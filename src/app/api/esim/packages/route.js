import { NextResponse } from 'next/server';

// Configuration
const ESIM_ACCESS_CODE = process.env.ESIM_ACCESS_CODE;
const ESIM_API_BASE_URL = process.env.ESIM_API_BASE_URL || 'https://api.esimaccess.com/api/v1';
const DISABLE_FILTERS = process.env.DISABLE_ESIM_FILTERS === 'true'; // Set in .env file
const MARKUP_AMOUNT = 10000; // $1.00 markup in Stripe's format (cents * 100)

// Filter parameters (ignored if DISABLE_FILTERS is true)
const ALLOWED_DATA_SIZES = [
  1 * 1073741824,    // 1GB
  3 * 1073741824,    // 3GB
  5 * 1073741824,    // 5GB
  10 * 1073741824,   // 10GB
  20 * 1073741824    // 20GB
];
const ALLOWED_DURATIONS = [7, 30]; // Only allow 7 or 30 days

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const locationCode = searchParams.get('locationCode') || '';
  const slug = searchParams.get('slug') || '';
  const packageCode = searchParams.get('packageCode') || '';
  const type = searchParams.get('type') || '';
  const iccid = searchParams.get('iccid') || '';

  try {
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

    Object.keys(requestBody).forEach(key =>
      !requestBody[key] ? delete requestBody[key] : {}
    );

    console.log('API Request body:', requestBody);

    const response = await fetch(`${ESIM_API_BASE_URL}/open/package/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RT-AccessCode': ESIM_ACCESS_CODE,
      },
      body: JSON.stringify(requestBody),
    });

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
  
    
    // Filter packages based on configuration
    let filteredPackages = packages.filter(pkg => {
      if (DISABLE_FILTERS) return true;
      
      // Data size check
      const hasAllowedDataSize = ALLOWED_DATA_SIZES.includes(pkg.volume);
      
      // Duration check
      const hasAllowedDuration = 
        ALLOWED_DURATIONS.includes(pkg.duration) && 
        (pkg.durationUnit?.toUpperCase() === 'DAY' || pkg.durationUnit?.toUpperCase() === 'DAYS');
      
      return hasAllowedDataSize && hasAllowedDuration;
    });

    // Additional location filtering for country-specific searches
    if (isCountrySearch) {
      filteredPackages = filteredPackages.filter(pkg => 
        pkg.location === locationCode.toUpperCase()
      );
    }

    console.log(`Filtered packages: ${filteredPackages.length} out of ${packages.length}`);

    // Format response with price markup
    const formattedPackages = filteredPackages.map((pkg, index) => {
      const locationArray = pkg.location?.split(',') || [];
      
      // Store the original provider price
      const originalPrice = pkg.price || 0;
      
      // Add $1 markup to the price - this is what the customer will pay
      const markedUpPrice = originalPrice + MARKUP_AMOUNT;
      
      return {
        id: pkg.packageCode || `pkg-${index}`,
        packageCode: pkg.packageCode || `pkg-${index}`,
        slug: pkg.slug || '',
        name: pkg.name || 'Unknown Plan',
        originalPrice: originalPrice, // Store original price (hidden from customer)
        price: markedUpPrice,         // Price with markup (what customer pays)
        retailPrice: pkg.retailPrice ? pkg.retailPrice + MARKUP_AMOUNT : markedUpPrice, 
        markupAmount: MARKUP_AMOUNT,  // Store the markup amount for reference
        currency: pkg.currencyCode || 'USD',
        dataAmount: pkg.volume ? `${(pkg.volume / 1073741824).toFixed(1)}GB` : 'N/A',
        duration: pkg.duration ? `${pkg.duration} ${pkg.durationUnit || 'Days'}` : 'N/A',
        description: pkg.description || '',
        location: pkg.location || '',
        locations: locationArray,
        locationNetworkList: pkg.locationNetworkList || [],
        operatorList: pkg.operatorList || [],
        speed: pkg.speed || '4G/5G',
        activeType: pkg.activeType || 1,
        favorite: pkg.favorite || false,
        smsStatus: pkg.smsStatus || 0,
        dataType: pkg.dataType || 1,
        unusedValidTime: pkg.unusedValidTime || 30,
        supportTopUpType: pkg.supportTopUpType || 0
      };
    });

    // Log a few examples of pricing for debugging
    if (formattedPackages.length > 0) {
      console.log('Example pricing (first 3 packages):');
      formattedPackages.slice(0, 3).forEach(pkg => {
        console.log(`Package ${pkg.packageCode}: Original: ${pkg.originalPrice/10000}$, Markup: ${pkg.markupAmount/10000}$, Final: ${pkg.price/10000}$`);
      });
    }

    return NextResponse.json({
      success: true,
      data: formattedPackages,
      filtersDisabled: DISABLE_FILTERS
    });
  } catch (error) {
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