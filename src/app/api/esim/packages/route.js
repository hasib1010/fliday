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
const CACHE_TTL = 3600000; // 1 hour

const ALLOWED_DATA_SIZES = [
  1 * 1073741824,
  3 * 1073741824,
  5 * 1073741824,
  10 * 1073741824,
  20 * 1073741824,
];
const ALLOWED_DURATIONS = [7, 30];

const packageCache = new LRUCache({ max: 100, ttl: CACHE_TTL });

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const locationCode = searchParams.get('locationCode') || '';
  const slug        = searchParams.get('slug')         || '';
  const packageCode = searchParams.get('packageCode')  || '';
  const type        = searchParams.get('type')         || '';
  const iccid       = searchParams.get('iccid')        || '';
  const skipCache   = searchParams.get('skipCache') === 'true';

  const cacheKey = `packages_${locationCode}_${slug}_${packageCode}_${type}_${iccid}`;

  try {
    if (!skipCache) {
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
    const normalizedCode  = locationCode.toUpperCase();

    const requestBody = {
      locationCode: normalizedCode,
      slug,
      packageCode,
      type,
      iccid,
    };
    Object.keys(requestBody).forEach(key => !requestBody[key] && delete requestBody[key]);

    console.log('API Request body:', requestBody);

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${ESIM_API_BASE_URL}/open/package/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RT-AccessCode': ESIM_ACCESS_CODE,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Package API error:', errorData);
      return NextResponse.json(
        { success: false, message: errorData.errorMsg || `Failed to fetch packages: ${response.status}` },
        { status: response.status }
      );
    }

    const data     = await response.json();
    const packages = data?.obj?.packageList || [];
    console.log('API Response packages:', packages.length);

    let filteredPackages = packages;

    if (!DISABLE_FILTERS || isCountrySearch) {
      const uniqueKeys = new Set();

      filteredPackages = packages.filter(pkg => {
        const meetsDataSize = DISABLE_FILTERS || ALLOWED_DATA_SIZES.includes(pkg.volume);
        const meetsDuration = DISABLE_FILTERS || (
          ALLOWED_DURATIONS.includes(pkg.duration) &&
          (pkg.durationUnit?.toUpperCase() === 'DAY' || pkg.durationUnit?.toUpperCase() === 'DAYS')
        );

        // ✅ FIX: location is a comma-separated string e.g. "DE,AT,CH"
        // Use split+includes instead of exact equality so "DE" matches "DE,AT,CH"
        const meetsLocation = !isCountrySearch || (
          pkg.location
            ? pkg.location.split(',').map(c => c.trim()).includes(normalizedCode)
            : false
        );

        if (meetsDataSize && meetsDuration && meetsLocation) {
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

    await dbConnect();

    const packageCodes     = filteredPackages.map(pkg => pkg.packageCode).filter(Boolean);
    let customPricingList  = [];
    try {
      customPricingList = await PackagePricing.find({ packageCode: { $in: packageCodes } });
      console.log(`Found ${customPricingList.length} custom pricing records`);
    } catch (err) {
      console.error('Error fetching custom pricing:', err);
    }

    const pricingMap = new Map(customPricingList.map(p => [p.packageCode, p]));

    const formattedPackages = filteredPackages.map(pkg => {
      const originalPrice  = parseInt(pkg.price || 0);
      const customPricing  = pricingMap.get(pkg.packageCode);
      const retailPrice    = customPricing ? customPricing.retailPrice : originalPrice + DEFAULT_MARKUP_AMOUNT;
      const markupAmount   = retailPrice - originalPrice;

      return {
        id:               pkg.packageCode || pkg.slug,
        packageCode:      pkg.packageCode || '',
        slug:             pkg.slug        || '',
        name:             pkg.name        || 'Unknown Plan',
        originalPrice,
        price:            retailPrice,
        retailPrice:      pkg.retailPrice ? pkg.retailPrice + markupAmount : retailPrice,
        markupAmount,
        hasCustomPricing: !!customPricing,
        currency:         pkg.currencyCode || 'USD',
        dataAmount:       pkg.volume ? `${(pkg.volume / 1073741824).toFixed(1)}GB` : 'N/A',
        duration:         pkg.duration ? `${pkg.duration}` : 'N/A',
        description:      pkg.description  || '',
        location:         pkg.location     || '',
        locations:        pkg.location ? pkg.location.split(',').map(c => c.trim()) : [],
        speed:            pkg.speed        || '4G/5G',
        locationNetworkList: pkg.locationNetworkList || [],
      };
    });

    const responseData = {
      success: true,
      data: formattedPackages,
      filtersDisabled: DISABLE_FILTERS,
    };

    if (!skipCache) packageCache.set(cacheKey, responseData);

    return NextResponse.json(responseData);

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('API request timed out');
      return NextResponse.json(
        { success: false, message: 'API request timed out. Please try again.' },
        { status: 504 }
      );
    }
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (body.action === 'clear_cache') {
      packageCache.clear();
      return NextResponse.json({ success: true, message: 'Package cache cleared' });
    }

    if (body.action === 'sync_pricing') {
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${ESIM_API_BASE_URL}/open/package/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'RT-AccessCode': ESIM_ACCESS_CODE },
        body: JSON.stringify({}),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.errorMsg || `Failed to fetch packages: ${response.status}`);
      }

      const data     = await response.json();
      const packages = data?.obj?.packageList || [];
      if (!packages.length) throw new Error('No packages returned from API');

      await dbConnect();

      let created = 0, updated = 0, skipped = 0;

      for (const pkg of packages) {
        if (!pkg.packageCode) { skipped++; continue; }
        try {
          const existing = await PackagePricing.findOne({ packageCode: pkg.packageCode });
          if (existing) {
            await PackagePricing.updateOne(
              { packageCode: pkg.packageCode },
              {
                $set: {
                  originalPrice: parseInt(pkg.price || 0),
                  packageName:   pkg.name,
                  dataAmount:    pkg.volume ? `${(pkg.volume / 1073741824).toFixed(1)}GB` : 'N/A',
                  duration:      pkg.duration,
                  durationUnit:  pkg.durationUnit || 'DAY',
                  location:      pkg.location,
                  slug:          pkg.slug,
                  updatedAt:     new Date(),
                },
              }
            );
            updated++;
          } else {
            const originalPrice = parseInt(pkg.price || 0);
            await PackagePricing.create({
              packageCode:   pkg.packageCode,
              originalPrice,
              retailPrice:   originalPrice + DEFAULT_MARKUP_AMOUNT,
              packageName:   pkg.name,
              dataAmount:    pkg.volume ? `${(pkg.volume / 1073741824).toFixed(1)}GB` : 'N/A',
              duration:      pkg.duration,
              durationUnit:  pkg.durationUnit || 'DAY',
              location:      pkg.location,
              slug:          pkg.slug,
              currency:      pkg.currencyCode || 'USD',
              createdAt:     new Date(),
              updatedAt:     new Date(),
            });
            created++;
          }
        } catch (err) {
          console.error(`Error processing package ${pkg.packageCode}:`, err);
          skipped++;
        }
      }

      packageCache.clear();

      return NextResponse.json({
        success: true,
        message: `Pricing sync complete: ${created} created, ${updated} updated, ${skipped} skipped`,
        stats: { created, updated, skipped },
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