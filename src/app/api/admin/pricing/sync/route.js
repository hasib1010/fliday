// src/app/api/admin/pricing/sync/route.js
// Run this to refresh all PackagePricing records with live provider prices
// POST /api/admin/pricing/sync  (admin only)

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import PackagePricing from '@/models/PackagePricing';

const BASE = process.env.ESIM_API_BASE_URL || 'https://api.esimaccess.com/api/v1';
const CODE = process.env.ESIM_ACCESS_CODE;

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Fetch ALL packages from provider in one call
    console.log('Fetching all packages from provider...');
    const res = await fetch(`${BASE}/open/package/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'RT-AccessCode': CODE },
      body: JSON.stringify({}),
    });

    if (!res.ok) throw new Error(`Provider API error: ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.errorMsg || 'Failed to fetch packages');

    const packages = data?.obj?.packageList || [];
    console.log(`Fetched ${packages.length} packages from provider`);

    // Build a map for quick lookup
    const providerMap = new Map(packages.map(p => [p.packageCode, parseInt(p.price || 0)]));

    // Get all our pricing records
    const ourPricing = await PackagePricing.find({});
    console.log(`Found ${ourPricing.length} pricing records in DB`);

    let updated = 0;
    let stale   = 0;
    let missing = 0;

    const bulkOps = [];

    for (const record of ourPricing) {
      const livePrice = providerMap.get(record.packageCode);

      if (livePrice === undefined) {
        missing++;
        continue; // Package no longer in provider catalog
      }

      if (livePrice !== record.originalPrice) {
        stale++;
        bulkOps.push({
          updateOne: {
            filter: { packageCode: record.packageCode },
            update: {
              $set: {
                originalPrice: livePrice,
                updatedAt:     new Date(),
                updatedBy:     'price-sync',
              },
            },
          },
        });
      }
    }

    if (bulkOps.length > 0) {
      const result = await PackagePricing.bulkWrite(bulkOps);
      updated = result.modifiedCount;
    }

    console.log(`Sync complete: ${updated} updated, ${stale - updated} failed, ${missing} missing from provider`);

    return NextResponse.json({
      success: true,
      message: `Sync complete: ${updated} prices updated`,
      stats: { total: ourPricing.length, updated, stale, missing },
    });

  } catch (error) {
    console.error('Pricing sync error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}