// app/api/esim/packages/route.js
import { NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';
import dbConnect from '@/lib/mongodb';
import PackagePricing from '@/models/PackagePricing';

// Configuration
const ESIM_ACCESS_CODE = process.env.ESIM_ACCESS_CODE;
const ESIM_API_BASE_URL = process.env.ESIM_API_BASE_URL || 'https://api.esimaccess.com/api/v1';
const DISABLE_FILTERS = process.env.DISABLE_ESIM_FILTERS === 'true';
const DEFAULT_MARKUP_AMOUNT = 10000; // $1.00 markup in API format (cents * 100)
const CACHE_TTL = 3600000; // Cache TTL in milliseconds (1 hour)

// Filter parameters (ignored if DISABLE_FILTERS is true)
const ALLOWED_DATA_SIZES = [
  1 * 1073741824,    // 1GB
  3 * 1073741824,    // 3GB
  5 * 1073741824,    // 5GB
  10 * 1073741824,   // 10GB
  20 * 1073741824    // 20GB
];
const ALLOWED_DURATIONS = [7, 30]; // Only allow 7 or 30 days

// Initialize LRU cache for API responses
const packageCache = new LRUCache({
  max: 100, // Maximum number of items to store
  ttl: CACHE_TTL, // Time to live in milliseconds
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const locationCode = searchParams.get('locationCode') || '';
  const slug = searchParams.get('slug') || '';
  const packageCode = searchParams.get('packageCode') || '';
  const type = searchParams.get('type') || '';
  const iccid = searchParams.get('iccid') || '';
  const skipCache = searchParams.get('skipCache') === 'true';
  
  // Create cache key from request parameters
  const cacheKey = `packages_${locationCode}_${slug}_${packageCode}_${type}_${iccid}`;
  
  try {
    // Skip cache if requested (for admin refreshes)
    if (!skipCache) {
      // Check if we have a cached response
      const cachedData = packageCache.get(cacheKey);
      if (cachedData) {
        console.log('Returning cached package data for:', cacheKey);
        return NextResponse.json(cachedData);
      }
    }
    
    if (!ESIM_ACCESS_CODE) {
      return NextResponse.json(
        { success: false, message: 'Server configuration error: Missing API access code' },
        { status: 500 }
      );
    }

    const isCountrySearch = !!locationCode;
    const isSlugSearch = !!slug;

    const requestBody = {
      locationCode: locationCode.toUpperCase(),
      slug: slug,
      packageCode: packageCode,
      type: type,
      iccid: iccid
    };

    // Remove empty parameters
    Object.keys(requestBody).forEach(key =>
      !requestBody[key] ? delete requestBody[key] : {}
    );

    console.log('API Request body:', requestBody);

    // Set timeout for fetch to prevent long-running requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
    
    const response = await fetch(`${ESIM_API_BASE_URL}/open/package/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RT-AccessCode': ESIM_ACCESS_CODE,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Package API error:', errorData);
      return NextResponse.json(
        {
          success: false,
          message: errorData.errorMsg || `Failed to fetch packages: ${response.status}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const packages = data?.obj?.packageList || [];
    console.log('API Response packages:', packages.length);

    // Optimize filtering with a single pass
    let filteredPackages = packages;
    
    if (!DISABLE_FILTERS || isCountrySearch) {
      const uniqueKeys = new Set();
      
      filteredPackages = packages.filter(pkg => {
        // Check all filtering conditions at once
        const meetsDataSizeCriteria = DISABLE_FILTERS || ALLOWED_DATA_SIZES.includes(pkg.volume);
        const meetsDurationCriteria = DISABLE_FILTERS || (
          ALLOWED_DURATIONS.includes(pkg.duration) &&
          (pkg.durationUnit?.toUpperCase() === 'DAY' || pkg.durationUnit?.toUpperCase() === 'DAYS')
        );
        const meetsLocationCriteria = !isCountrySearch || pkg.location === locationCode.toUpperCase();
        
        // Deduplicate during filtering for better performance
        if (meetsDataSizeCriteria && meetsDurationCriteria && meetsLocationCriteria) {
          const key = `${pkg.volume}-${pkg.duration}-${pkg.durationUnit?.toUpperCase()}`;
          if (!uniqueKeys.has(key)) {
            uniqueKeys.add(key);
            return true;
          }
        }
        return false;
      });
    }

    console.log(`Filtered packages: ${filteredPackages.length} out of ${packages.length}`);

    // Connect to database to get custom pricing
    await dbConnect();
    
    // Extract all package codes for efficient DB lookup
    const packageCodes = filteredPackages.map(pkg => pkg.packageCode)
      .filter(code => code); // Filter out any undefined/null codes
    
    // Fetch all custom pricing records in one query
    let customPricingList = [];
    try {
      customPricingList = await PackagePricing.find({
        packageCode: { $in: packageCodes }
      });
      
      console.log(`Found ${customPricingList.length} custom pricing records`);
    } catch (err) {
      console.error('Error fetching custom pricing:', err);
      // Continue with default pricing
    }
    
    // Create a lookup map for efficiency
    const pricingMap = new Map();
    customPricingList.forEach(pricing => {
      pricingMap.set(pricing.packageCode, pricing);
    });

    // Format packages with custom pricing or default markup
    const formattedPackages = filteredPackages.map(pkg => {
      const originalPrice = parseInt(pkg.price || 0);
      const customPricing = pricingMap.get(pkg.packageCode);
      
      // Use custom pricing if available, otherwise apply default markup
      const retailPrice = customPricing 
        ? customPricing.retailPrice 
        : originalPrice + DEFAULT_MARKUP_AMOUNT;
        
      const markupAmount = retailPrice - originalPrice;
      const hasCustomPricing = !!customPricing;

      return {
        id: pkg.packageCode || pkg.slug,
        packageCode: pkg.packageCode || '',
        slug: pkg.slug || '',
        name: pkg.name || 'Unknown Plan',
        originalPrice: originalPrice,
        price: retailPrice, // This is what customers will pay
        retailPrice: pkg.retailPrice ? pkg.retailPrice + markupAmount : retailPrice,
        markupAmount: markupAmount,
        hasCustomPricing: hasCustomPricing,
        currency: pkg.currencyCode || 'USD',
        dataAmount: pkg.volume ? `${(pkg.volume / 1073741824).toFixed(1)}GB` : 'N/A',
        duration: pkg.duration ? `${pkg.duration}` : 'N/A', // Simplified
        description: pkg.description || '',
        location: pkg.location || '',
        locations: pkg.location ? pkg.location.split(',') : [],
        speed: pkg.speed || '4G/5G',
        // Include network information if available
        locationNetworkList: pkg.locationNetworkList || []
      };
    });

    const responseData = {
      success: true,
      data: formattedPackages,
      filtersDisabled: DISABLE_FILTERS
    };
    
    // Cache the response if not explicitly skipped
    if (!skipCache) {
      packageCache.set(cacheKey, responseData);
    }

    return NextResponse.json(responseData);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('API request timed out');
      return NextResponse.json(
        {
          success: false,
          message: 'API request timed out. Please try again.',
        },
        { status: 504 }
      );
    }
    
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch packages',
      },
      { status: 500 }
    );
  }
}

// Add route to clear cache and sync pricing
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Cache clearing endpoint
    if (body.action === 'clear_cache') {
      // In production, add proper authorization check here
      packageCache.clear();
      return NextResponse.json({ success: true, message: 'Package cache cleared' });
    }
    
    // Sync pricing from provider API to database
    if (body.action === 'sync_pricing') {
      // In production, add proper authorization check here
      
      // Fetch packages from API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
      
      const response = await fetch(`${ESIM_API_BASE_URL}/open/package/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'RT-AccessCode': ESIM_ACCESS_CODE,
        },
        body: JSON.stringify({}), // Empty request to get all packages
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.errorMsg || `Failed to fetch packages: ${response.status}`);
      }
      
      const data = await response.json();
      const packages = data?.obj?.packageList || [];
      
      if (!packages.length) {
        throw new Error('No packages returned from API');
      }
      
      // Connect to database
      await dbConnect();
      
      // Sync packages with database
      let created = 0;
      let updated = 0;
      let skipped = 0;
      
      for (const pkg of packages) {
        if (!pkg.packageCode) {
          skipped++;
          continue;
        }
        
        try {
          // Check if we already have this package code in our pricing table
          const existingPricing = await PackagePricing.findOne({ packageCode: pkg.packageCode });
          
          if (existingPricing) {
            // Update the original price from provider but keep our custom retail price
            await PackagePricing.updateOne(
              { packageCode: pkg.packageCode },
              {
                $set: {
                  originalPrice: parseInt(pkg.price || 0),
                  packageName: pkg.name,
                  dataAmount: pkg.volume ? `${(pkg.volume / 1073741824).toFixed(1)}GB` : 'N/A',
                  duration: pkg.duration,
                  durationUnit: pkg.durationUnit || 'DAY',
                  location: pkg.location,
                  slug: pkg.slug,
                  updatedAt: new Date()
                }
              }
            );
            updated++;
          } else {
            // Create new pricing record with default markup
            const originalPrice = parseInt(pkg.price || 0);
            await PackagePricing.create({
              packageCode: pkg.packageCode,
              originalPrice: originalPrice,
              retailPrice: originalPrice + DEFAULT_MARKUP_AMOUNT,
              packageName: pkg.name,
              dataAmount: pkg.volume ? `${(pkg.volume / 1073741824).toFixed(1)}GB` : 'N/A',
              duration: pkg.duration,
              durationUnit: pkg.durationUnit || 'DAY',
              location: pkg.location,
              slug: pkg.slug,
              currency: pkg.currencyCode || 'USD',
              createdAt: new Date(),
              updatedAt: new Date()
            });
            created++;
          }
        } catch (err) {
          console.error(`Error processing package ${pkg.packageCode}:`, err);
          skipped++;
        }
      }
      
      // Clear the cache after updating prices
      packageCache.clear();
      
      return NextResponse.json({
        success: true,
        message: `Pricing sync complete: ${created} created, ${updated} updated, ${skipped} skipped`,
        stats: { created, updated, skipped }
      });
    }
    
    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in POST request:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}