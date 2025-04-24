import { NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';

// Configuration
const ESIM_ACCESS_CODE = process.env.ESIM_ACCESS_CODE;
const ESIM_API_BASE_URL = process.env.ESIM_API_BASE_URL || 'https://api.esimaccess.com/api/v1';
const DISABLE_FILTERS = process.env.DISABLE_ESIM_FILTERS === 'true';
const MARKUP_AMOUNT = 10000; // $1.00 markup in Stripe's format (cents * 100)
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
  
  // Create cache key from request parameters
  const cacheKey = `packages_${locationCode}_${slug}_${packageCode}_${type}_${iccid}`;
  
  try {
    // Check if we have a cached response
    const cachedData = packageCache.get(cacheKey);
    if (cachedData) {
      console.log('Returning cached package data for:', cacheKey);
      return NextResponse.json(cachedData);
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

    // Format response with price markup (Map is faster than forEach for transformations)
    const formattedPackages = filteredPackages.map((pkg, index) => {
      const locationArray = pkg.location?.split(',') || [];
      const originalPrice = pkg.price || 0;
      const markedUpPrice = originalPrice + MARKUP_AMOUNT;

      return {
        id: pkg.packageCode || `pkg-${index}`,
        packageCode: pkg.packageCode || `pkg-${index}`,
        slug: pkg.slug || '',
        name: pkg.name || 'Unknown Plan',
        originalPrice: originalPrice,
        price: markedUpPrice,
        retailPrice: pkg.retailPrice ? pkg.retailPrice + MARKUP_AMOUNT : markedUpPrice,
        markupAmount: MARKUP_AMOUNT,
        currency: pkg.currencyCode || 'USD',
        dataAmount: pkg.volume ? `${(pkg.volume / 1073741824).toFixed(1)}GB` : 'N/A',
        duration: pkg.duration ? `${pkg.duration}` : 'N/A', // Simplified
        description: pkg.description || '',
        location: pkg.location || '',
        locations: locationArray,
        speed: pkg.speed || '4G/5G',
        // Only include essential fields for frontend
        networkInfo: (pkg.locationNetworkList || []).map(network => ({
          name: network.networkName,
          operator: network.operatorName
        }))
      };
    });

    const responseData = {
      success: true,
      data: formattedPackages,
      filtersDisabled: DISABLE_FILTERS
    };
    
    // Cache the response
    packageCache.set(cacheKey, responseData);

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