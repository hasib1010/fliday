// app/api/esim/locations/route.js
import { NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';
import dbConnect from '@/lib/mongodb';
import PackagePricing from '@/models/PackagePricing';

// Create a server-side cache with 1 hour TTL
const cache = new LRUCache({
  max: 100,    // Maximum number of items in cache
  ttl: 3600000 // 1 hour in milliseconds
});
const CACHE_KEY = 'esim_locations_data';

// Environment variables
const ESIM_ACCESS_CODE = process.env.ESIM_ACCESS_CODE;
const ESIM_API_BASE_URL = process.env.ESIM_API_BASE_URL || 'https://api.esimaccess.com/api/v1';
const DISABLE_FILTERS = process.env.DISABLE_ESIM_FILTERS === 'true';
const DEFAULT_MARKUP_AMOUNT = 10000; // $1.00 markup in cents * 100 format

// Filter parameters
const ALLOWED_DATA_SIZES = [
  1 * 1073741824,    // 1GB
  3 * 1073741824,    // 3GB
  5 * 1073741824,    // 5GB
  10 * 1073741824,   // 10GB
  20 * 1073741824    // 20GB
];
const ALLOWED_DURATIONS = [7, 30]; // Only allow 7 or 30 days

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const skipCache = searchParams.get('skipCache') === 'true';
    const debug = searchParams.get('debug') === 'true'; // Add debug mode
    
    // Check cache first
    if (!skipCache) {
      const cachedData = cache.get(CACHE_KEY);
      if (cachedData) {
        console.log('Returning cached eSIM locations data');
        return NextResponse.json(cachedData);
      }
    }

    console.log('Cache miss, fetching fresh eSIM locations data');

    // Validate credentials
    if (!ESIM_ACCESS_CODE) {
      return NextResponse.json(
        { success: false, message: 'Server configuration error: Missing API access code' },
        { status: 500 }
      );
    }

    // Fetch both endpoints in parallel
    const [locationsResponse, packagesResponse] = await Promise.all([
      fetch(`${ESIM_API_BASE_URL}/open/location/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'RT-AccessCode': ESIM_ACCESS_CODE,
        },
        body: JSON.stringify({}),
        // Set timeout and retry logic
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }).catch(err => {
        console.error('Error fetching locations:', err);
        return { ok: false, status: 500, error: err.message };
      }),
      
      fetch(`${ESIM_API_BASE_URL}/open/package/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'RT-AccessCode': ESIM_ACCESS_CODE,
        },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }).catch(err => {
        console.error('Error fetching packages:', err);
        return { ok: false, status: 500, error: err.message };
      })
    ]);

    // Handle location response
    if (!locationsResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message: locationsResponse.error || `Failed to fetch locations: ${locationsResponse.status}`,
        },
        { status: locationsResponse.status || 500 }
      );
    }

    const locationsData = await locationsResponse.json();
    const locations = locationsData?.obj?.locationList || [];

    // Process packages
    let allPackages = [];
    if (packagesResponse.ok) {
      const packagesData = await packagesResponse.json();
      allPackages = packagesData?.obj?.packageList || [];
    } else {
      console.warn('Failed to fetch packages, will continue with empty packages list');
    }

    // Filter packages with optimized code
    const filteredPackages = DISABLE_FILTERS 
      ? allPackages 
      : allPackages.filter(pkg => {
          const hasAllowedDataSize = ALLOWED_DATA_SIZES.includes(pkg.volume);
          const hasAllowedDuration = 
            ALLOWED_DURATIONS.includes(pkg.duration) && 
            (pkg.durationUnit?.toUpperCase() === 'DAY' || pkg.durationUnit?.toUpperCase() === 'DAYS');

          return hasAllowedDataSize && hasAllowedDuration;
        });

    // Connect to the database to get custom pricing
    await dbConnect();
    
    // Get all package codes for database lookup
    const packageCodes = filteredPackages.map(pkg => pkg.packageCode).filter(code => code);
    
    // Fetch all custom pricing records in one query
    let customPricingList = [];
    try {
      customPricingList = await PackagePricing.find({
        packageCode: { $in: packageCodes }
      }).lean(); // Using lean for better performance
      
      console.log(`Found ${customPricingList.length} custom pricing records for locations`);
    } catch (err) {
      console.error('Error fetching custom pricing for locations:', err);
      // Continue with default pricing if there's an error
    }
    
    // Create a lookup map for efficient access
    const pricingMap = new Map();
    customPricingList.forEach(pricing => {
      pricingMap.set(pricing.packageCode, pricing);
    });

    // Helper function to get original price in API format
    const getOriginalPrice = (pkg) => {
      return parseInt(pkg.price || 0);
    };

    // Helper function to get retail price in API format (not formatted string)
    const getRetailPrice = (pkg) => {
      const originalPrice = getOriginalPrice(pkg);
      const customPricing = pricingMap.get(pkg.packageCode);
      
      // Use custom pricing if available, otherwise apply default markup
      return customPricing 
        ? customPricing.retailPrice 
        : originalPrice + DEFAULT_MARKUP_AMOUNT;
    };
    
    // Helper function to get price as formatted string for display
    const getFormattedPrice = (pkg) => {
      const retailPrice = getRetailPrice(pkg);
      return (retailPrice / 10000).toFixed(2);
    };

    // Optimized data processing - create all collections upfront
    const countries = [];
    const regions = [];
    const globalPackages = [];
    
    // Process global packages first (optimization: one loop through packages)
    const packageMap = new Map(); // For quick lookup by location
    
    // Create a map for faster lookups by location
    filteredPackages.forEach(pkg => {
      // Check if it's a global package
      const isGlobal = pkg.slug.toLowerCase().startsWith('gl-') || 
                      pkg.name.toLowerCase().startsWith('global');
      
      if (isGlobal) {
        const packageDetails = {
          id: pkg.packageCode || pkg.slug,
          name: pkg.name,
          code: pkg.slug.toLowerCase(),
          regionCode: pkg.slug,
          type: 'region',
          countries: pkg.location ? pkg.location.split(',').map(code => ({ code, name: code })) : [],
          price: getFormattedPrice(pkg),
          originalPrice: getOriginalPrice(pkg),
          retailPrice: getRetailPrice(pkg),
          slug: pkg.slug,
          packageCode: pkg.packageCode,
          hasCustomPricing: pricingMap.has(pkg.packageCode),
          data: pkg.volume ? `${(pkg.volume / 1073741824).toFixed(1)}GB` : 'N/A',
          duration: pkg.duration ? `${pkg.duration}` : 'N/A',
          durationUnit: pkg.durationUnit || 'DAY'
        };

        globalPackages.push(packageDetails);
      } else {
        // For non-global packages, create location-to-package mapping
        if (pkg.location) {
          const locations = pkg.location.split(',');
          locations.forEach(loc => {
            if (!packageMap.has(loc)) {
              packageMap.set(loc, []);
            }
            packageMap.get(loc).push(pkg);
          });
        }
      }
    });

    // Process locations
    locations.forEach((location) => {
      if (location.type === 1) {
        // Process single country
        const countryPackages = packageMap.get(location.code) || [];
        
        if (countryPackages.length > 0) {
          // Use retail prices (with custom pricing if available) for comparison
          // Get retail prices in numeric format, not formatted strings
          const prices = countryPackages.map(pkg => getRetailPrice(pkg)).filter(p => p > 0);
          
          if (prices.length > 0) {
            const lowestPrice = Math.min(...prices);
            const packageWithLowestPrice = countryPackages.find(pkg => 
              getRetailPrice(pkg) === lowestPrice
            );

            // Enhanced country object with more price details
            const countryDetails = {
              id: location.code,
              name: location.name,
              code: location.code.toLowerCase(),
              countryCode: location.code,
              type: 'country',
              price: (lowestPrice / 10000).toFixed(2),
              retailPriceRaw: lowestPrice,
              packageCode: packageWithLowestPrice?.packageCode,
              hasCustomPricing: packageWithLowestPrice ? pricingMap.has(packageWithLowestPrice.packageCode) : false,
              packageDetails: debug ? {
                name: packageWithLowestPrice?.name,
                dataAmount: packageWithLowestPrice?.volume ? `${(packageWithLowestPrice.volume / 1073741824).toFixed(1)}GB` : 'N/A',
                duration: packageWithLowestPrice?.duration,
                durationUnit: packageWithLowestPrice?.durationUnit
              } : undefined
            };
            
            countries.push(countryDetails);
          }
        }
      } else if (location.type === 2 && location.subLocationList?.length > 0) {
        // Process region
        const regionCountryCodes = location.subLocationList.map(subLoc => subLoc.code);
        
        // Find packages for this region using our map
        const regionPackagesSet = new Set();
        regionCountryCodes.forEach(code => {
          const packagesForCountry = packageMap.get(code) || [];
          packagesForCountry.forEach(pkg => regionPackagesSet.add(pkg));
        });
        
        const regionPackages = Array.from(regionPackagesSet);
        
        // Filter to packages that cover at least 70% of countries
        const validRegionPackages = regionPackages.filter(pkg => {
          if (!pkg.location) return false;
          
          const pkgLocations = pkg.location.split(',');
          const countriesCovered = regionCountryCodes.filter(code => 
            pkgLocations.includes(code)
          ).length;
          
          const coverageRatio = countriesCovered / regionCountryCodes.length;
          return coverageRatio >= 0.7 || pkg.name.toLowerCase().includes(location.name.toLowerCase());
        });
        
        if (validRegionPackages.length > 0) {
          // Use retail prices (with custom pricing) for comparison in numeric format
          const prices = validRegionPackages.map(pkg => getRetailPrice(pkg)).filter(p => p > 0);
          
          if (prices.length > 0) {
            const lowestPrice = Math.min(...prices);
            const packageWithLowestPrice = validRegionPackages.find(pkg => 
              getRetailPrice(pkg) === lowestPrice
            );

            // Enhanced region object with more price details
            const regionDetails = {
              id: location.code,
              name: location.name,
              code: location.code.toLowerCase(),
              regionCode: location.code,
              type: 'region',
              countries: location.subLocationList,
              price: (lowestPrice / 10000).toFixed(2),
              retailPriceRaw: lowestPrice,
              slug: packageWithLowestPrice?.slug || '',
              packageCode: packageWithLowestPrice?.packageCode,
              hasCustomPricing: packageWithLowestPrice ? pricingMap.has(packageWithLowestPrice.packageCode) : false,
              packageDetails: debug ? {
                name: packageWithLowestPrice?.name,
                dataAmount: packageWithLowestPrice?.volume ? `${(packageWithLowestPrice.volume / 1073741824).toFixed(1)}GB` : 'N/A',
                duration: packageWithLowestPrice?.duration,
                durationUnit: packageWithLowestPrice?.durationUnit
              } : undefined
            };
            
            regions.push(regionDetails);
          }
        }
      }
    });

    // Add synthetic regions (e.g., Africa) from packages
    const syntheticRegions = new Set();
    filteredPackages.forEach(pkg => {
      const pkgNameLower = pkg.name.toLowerCase();
      
      // Africa region
      if (pkgNameLower.includes('africa') && !syntheticRegions.has('africa') && 
          !regions.some(r => r.name.toLowerCase() === 'africa')) {
        syntheticRegions.add('africa');
        
        // Enhanced synthetic region with price details
        const syntheticRegionDetails = {
          id: 'AFRICA',
          name: 'Africa',
          code: 'africa',
          regionCode: 'AFRICA',
          type: 'region',
          countries: pkg.location ? pkg.location.split(',').map(code => ({ code, name: code })) : [],
          price: getFormattedPrice(pkg),
          retailPriceRaw: getRetailPrice(pkg),
          slug: pkg.slug,
          packageCode: pkg.packageCode,
          hasCustomPricing: pricingMap.has(pkg.packageCode),
          packageDetails: debug ? {
            name: pkg?.name,
            dataAmount: pkg?.volume ? `${(pkg.volume / 1073741824).toFixed(1)}GB` : 'N/A',
            duration: pkg?.duration,
            durationUnit: pkg?.durationUnit
          } : undefined
        };
        
        regions.push(syntheticRegionDetails);
      }
      
      // Add other synthetic regions as needed
    });

    // Combine and sort results 
    const allRegions = [...regions, ...globalPackages];
    
    // Prepare the response
    const response = {
      success: true,
      data: {
        countries: countries.sort((a, b) => a.name.localeCompare(b.name)),
        regions: allRegions.sort((a, b) => a.name.localeCompare(b.name)),
        all: [...countries, ...allRegions],
        filtersDisabled: DISABLE_FILTERS,
        cachedAt: Date.now(),
        pricingInfo: {
          totalCustomPriced: customPricingList.length,
          lastUpdated: new Date().toISOString()
        }
      },
    };
    
    // Store in cache if not skipping cache
    if (!skipCache) {
      cache.set(CACHE_KEY, response);
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in locations API:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch locations',
      },
      { status: 500 }
    );
  }
}

// Cache invalidation and admin functions
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Simple cache invalidation
    if (body.action === 'clear_cache') {
      // In production, add proper authorization check here
      cache.delete(CACHE_KEY);
      return NextResponse.json({ success: true, message: 'Cache cleared successfully' });
    }
    
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}