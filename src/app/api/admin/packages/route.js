// app/api/admin/packages/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import PackagePricing from '@/models/PackagePricing';

// Configuration
const ESIM_ACCESS_CODE = process.env.ESIM_ACCESS_CODE;
const ESIM_API_BASE_URL = process.env.ESIM_API_BASE_URL || 'https://api.esimaccess.com/api/v1';
const DEFAULT_MARKUP_AMOUNT = 10000; // $1.00 markup in API format (cents * 100)

// Helper function to check if user is admin
async function isAdmin(request) {
  const session = await getServerSession(authOptions);
  // Implement your admin role check here
  return session?.user?.role === 'admin';
}

export async function GET(request) {
  try {
    // Check admin authorization
    if (!await isAdmin(request)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    if (!ESIM_ACCESS_CODE) {
      return NextResponse.json(
        { success: false, message: 'Server configuration error: Missing API access code' },
        { status: 500 }
      );
    }
    
    // Fetch all packages from the provider API without any filters
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
    
    // Call the provider API with empty parameters to get all packages
    const response = await fetch(`${ESIM_API_BASE_URL}/open/package/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RT-AccessCode': ESIM_ACCESS_CODE,
      },
      body: JSON.stringify({
        // Empty body to get all packages
        locationCode: "",
        type: "",
        slug: "",
        packageCode: "",
        iccid: ""
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Provider API error:', errorData);
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
    console.log(`Fetched ${packages.length} packages from provider API`);

    // Connect to the database to get custom pricing
    await dbConnect();
    
    // Get all package codes
    const packageCodes = packages.map(pkg => pkg.packageCode).filter(Boolean);
    
    // Fetch all custom pricing records
    const customPricingList = await PackagePricing.find({
      packageCode: { $in: packageCodes }
    }).lean();
    
    // Create lookup map for efficient access
    const pricingMap = new Map();
    customPricingList.forEach(pricing => {
      pricingMap.set(pricing.packageCode, pricing);
    });

    // Format the packages with custom pricing information
    const formattedPackages = packages.map(pkg => {
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
        duration: pkg.duration ? `${pkg.duration}` : 'N/A',
        durationUnit: pkg.durationUnit || 'DAY',
        description: pkg.description || '',
        location: pkg.location || '',
        locations: pkg.location ? pkg.location.split(',') : [],
        speed: pkg.speed || '4G/5G',
        volume: pkg.volume || 0,
        // Include all available provider data
        locationNetworkList: pkg.locationNetworkList || [],
        smsStatus: pkg.smsStatus,
        dataType: pkg.dataType,
        unusedValidTime: pkg.unusedValidTime,
        activeType: pkg.activeType,
        favorite: pkg.favorite,
        ipExport: pkg.ipExport,
        supportTopUpType: pkg.supportTopUpType
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedPackages,
      total: formattedPackages.length
    });
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

// Endpoint to sync pricing with provider (creates/updates pricing records)
export async function POST(request) {
  try {
    // Check admin authorization
    if (!await isAdmin(request)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { action } = body;
    
    // Only implement the sync_pricing action
    if (action !== 'sync_pricing') {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid action. Only sync_pricing is supported.' 
      }, { status: 400 });
    }

    // Fetch all packages from the provider API
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
    
    // Track operation stats
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    // Process each package for pricing sync
    for (const pkg of packages) {
      if (!pkg.packageCode) {
        skipped++;
        continue;
      }
      
      try {
        // Check if we already have this package in our pricing database
        const existingPricing = await PackagePricing.findOne({ packageCode: pkg.packageCode });
        
        if (existingPricing) {
          // Update the original price but keep our custom retail price
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
    
    return NextResponse.json({
      success: true,
      message: `Pricing sync complete: ${created} created, ${updated} updated, ${skipped} skipped`,
      stats: { created, updated, skipped, total: packages.length }
    });
  } catch (error) {
    console.error('Error in sync operation:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}