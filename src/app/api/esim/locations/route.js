import { NextResponse } from 'next/server';

// Environment variables
const ESIM_ACCESS_CODE = process.env.ESIM_ACCESS_CODE;
const ESIM_API_BASE_URL = process.env.ESIM_API_BASE_URL || 'https://api.esimaccess.com/api/v1';
const DISABLE_FILTERS = process.env.DISABLE_ESIM_FILTERS === 'true';

// Filter parameters
const ALLOWED_DATA_SIZES = [
  1 * 1073741824,    // 1GB
  3 * 1073741824,    // 3GB
  5 * 1073741824,    // 5GB
  10 * 1073741824,   // 10GB
  20 * 1073741824    // 20GB
];
const ALLOWED_DURATIONS = [7, 30]; // Only allow 7 or 30 days

export async function GET() {
  try {
    // Validate credentials
    if (!ESIM_ACCESS_CODE) {
      return NextResponse.json(
        { success: false, message: 'Server configuration error: Missing API access code' },
        { status: 500 }
      );
    }

    // Fetch locations
    const locationsResponse = await fetch(`${ESIM_API_BASE_URL}/open/location/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RT-AccessCode': ESIM_ACCESS_CODE,
      },
      body: JSON.stringify({}),
    });

    if (!locationsResponse.ok) {
      const errorData = await locationsResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          message: errorData.errorMsg || `Failed to fetch locations: ${locationsResponse.status}`,
        },
        { status: locationsResponse.status }
      );
    }

    const locationsData = await locationsResponse.json();
    const locations = locationsData?.obj?.locationList || [];

    // Fetch packages from eSIM API directly
    let allPackages = [];
    try {
      const esimPackagesResponse = await fetch(`${ESIM_API_BASE_URL}/open/package/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'RT-AccessCode': ESIM_ACCESS_CODE,
        },
        body: JSON.stringify({}),
      });

      if (esimPackagesResponse.ok) {
        const esimPackagesData = await esimPackagesResponse.json();
        allPackages = esimPackagesData?.obj?.packageList || [];
        console.log(`Found ${allPackages.length} total packages from eSIM API`);
      }
    } catch (error) {
      console.warn('Failed to fetch packages:', error);
    }

    // Filter packages based on configuration
    const filteredPackages = allPackages.filter(pkg => {
      if (DISABLE_FILTERS) return true;

      const hasAllowedDataSize = ALLOWED_DATA_SIZES.includes(pkg.volume);
      const hasAllowedDuration = 
        ALLOWED_DURATIONS.includes(pkg.duration) && 
        (pkg.durationUnit?.toUpperCase() === 'DAY' || pkg.durationUnit?.toUpperCase() === 'DAYS');

      return hasAllowedDataSize && hasAllowedDuration;
    });

    console.log(`Filtered packages: ${filteredPackages.length} out of ${allPackages.length}`);

    // Helper function to convert API price to display price
    const convertPrice = (apiPrice) => {
      return (parseFloat(apiPrice) + 10000) / 10000;
    };

    // Process locations
    const countries = [];
    const regions = [];
    const globalPackages = []; // New list for global packages

    // First, handle global packages
    const remainingPackages = filteredPackages.filter(pkg => {
      const isGlobal = pkg.slug.toLowerCase().startsWith('gl-') || pkg.name.toLowerCase().startsWith('global');
      if (isGlobal) {
        const lowestPrice = convertPrice(pkg.price);
        globalPackages.push({
          id: pkg.packageCode || pkg.slug,
          name: pkg.name,
          code: pkg.slug.toLowerCase(),
          regionCode: pkg.slug,
          type: 'region', // Still treated as a region type for frontend compatibility
          countries: pkg.location ? pkg.location.split(',').map(code => ({ code, name: code })) : [],
          price: lowestPrice.toFixed(2),
          slug: pkg.slug,
        });
        return false; // Exclude from remaining packages
      }
      return true;
    });

    locations.forEach((location) => {
      if (location.type === 1) {
        // Single country
        const countryPackages = remainingPackages.filter(pkg => 
          pkg.location && pkg.location.split(',').includes(location.code)
        );

        if (countryPackages.length > 0) {
          const lowestPrice = Math.min(
            ...countryPackages.map(pkg => convertPrice(pkg.price)).filter(p => p > 0)
          );

          countries.push({
            id: location.code,
            name: location.name,
            code: location.code.toLowerCase(),
            countryCode: location.code,
            type: 'country',
            price: lowestPrice.toFixed(2),
          });
        }
      } else if (location.type === 2) {
        // Region
        if (!location.subLocationList || location.subLocationList.length === 0) {
          return; // Skip this region
        }

        const regionCountryCodes = location.subLocationList.map(subLoc => subLoc.code);

        // Find packages that match this region
        const regionPackages = remainingPackages.filter(pkg => {
          if (!pkg.location) return false;

          const pkgLocations = pkg.location.split(',');
          const countriesCovered = regionCountryCodes.filter(code => 
            pkgLocations.includes(code)
          ).length;

          // Consider a package valid if it covers at least 70% of the region's countries
          const coverageRatio = countriesCovered / regionCountryCodes.length;
          return coverageRatio >= 0.7 || pkg.name.toLowerCase().includes(location.name.toLowerCase());
        });

        if (regionPackages.length > 0) {
          const lowestPrice = Math.min(
            ...regionPackages.map(pkg => convertPrice(pkg.price)).filter(p => p > 0)
          );

          regions.push({
            id: location.code,
            name: location.name,
            code: location.code.toLowerCase(),
            regionCode: location.code,
            type: 'region',
            countries: location.subLocationList,
            price: lowestPrice.toFixed(2),
            slug: regionPackages[0]?.slug || '',
          });
        }
      }
    });

    // Add synthetic regions based on remaining packages (e.g., Africa)
    remainingPackages.forEach(pkg => {
      const pkgNameLower = pkg.name.toLowerCase();
      if (pkgNameLower.includes('africa') && !regions.some(r => r.name.toLowerCase() === 'africa')) {
        const lowestPrice = convertPrice(pkg.price);
        regions.push({
          id: 'AFRICA',
          name: 'Africa',
          code: 'africa',
          regionCode: 'AFRICA',
          type: 'region',
          countries: pkg.location ? pkg.location.split(',').map(code => ({ code, name: code })) : [],
          price: lowestPrice.toFixed(2),
          slug: pkg.slug,
        });
      }
      // Add more synthetic regions if needed
    });

    // Combine regions and global packages for the frontend
    const allRegions = [...regions, ...globalPackages];

    return NextResponse.json({
      success: true,
      data: {
        countries: countries.sort((a, b) => a.name.localeCompare(b.name)),
        regions: allRegions.sort((a, b) => a.name.localeCompare(b.name)),
        all: [...countries, ...allRegions],
        filtersDisabled: DISABLE_FILTERS,
      },
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch locations',
      },
      { status: 500 }
    );
  }
}