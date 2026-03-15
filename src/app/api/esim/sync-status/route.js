// src/app/api/esim/sync-status/route.js
// Called from the user's orders page on load and on refresh
// Syncs the current user's orders from provider API → DB
// No cron needed — runs on demand when user visits the page

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';

const BASE = process.env.ESIM_API_BASE_URL || 'https://api.esimaccess.com/api/v1';
const CODE = process.env.ESIM_ACCESS_CODE;

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Find the user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Fetch only THIS user's completed orders that have eSIM details
    const orders = await Order.find({
      userId: user._id,
      orderStatus: 'completed',
      'esimDetails.esimTranNo': { $exists: true, $ne: '' },
    }).limit(50); // One user rarely has more than 50 eSIMs

    if (!orders.length) {
      return NextResponse.json({ success: true, updated: 0, total: 0 });
    }

    let updated = 0;

    for (const order of orders) {
      try {
        const changed = await syncOne(order);
        if (changed) updated++;
      } catch (err) {
        // Non-fatal — skip this order and continue
        console.warn(`Sync skipped for order ${order.orderId}:`, err.message);
      }
      // Respect 8 req/s rate limit from provider
      await new Promise(r => setTimeout(r, 130));
    }

    return NextResponse.json({ success: true, updated, total: orders.length });

  } catch (error) {
    console.error('Sync status error:', error);
    // Return success:true so the UI doesn't show an error — sync is best-effort
    return NextResponse.json({ success: true, updated: 0, error: error.message });
  }
}

async function syncOne(order) {
  const { esimTranNo, iccid, orderNo } = order.esimDetails || {};

  // Build query — prefer esimTranNo (iccids can be reused per API docs)
  const body = { pager: { pageNum: 1, pageSize: 5 } };
  if (esimTranNo)     body.esimTranNo = esimTranNo;
  else if (iccid)     body.iccid      = iccid;
  else if (orderNo)   body.orderNo    = orderNo;
  else return false; // Nothing to query

  const res  = await fetch(`${BASE}/open/esim/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'RT-AccessCode': CODE },
    body: JSON.stringify(body),
  });

  if (!res.ok) return false;
  const data = await res.json();
  if (!data.success || !data.obj?.esimList?.length) return false;

  const esim    = data.obj.esimList[0];
  const current = order.esimDetails || {};
  const updates = {};

  // Only update fields that actually changed
  if (esim.esimStatus  !== current.esimStatus)  updates['esimDetails.esimStatus']  = esim.esimStatus;
  if (esim.smdpStatus  !== current.smdpStatus)  updates['esimDetails.smdpStatus']  = esim.smdpStatus;
  if (esim.orderUsage  !== current.orderUsage)  updates['esimDetails.orderUsage']  = esim.orderUsage;
  if (esim.totalVolume !== current.totalVolume) updates['esimDetails.totalVolume'] = esim.totalVolume;
  if (esim.expiredTime !== current.expiredTime) updates['esimDetails.expiredTime'] = esim.expiredTime;
  if (esim.eid && esim.eid !== current.eid)     updates['esimDetails.eid']         = esim.eid;
  if (esim.activateTime && esim.activateTime !== current.activateTime) {
    updates['esimDetails.activateTime'] = esim.activateTime;
  }

  // Update order-level status for terminal states
  if ((esim.esimStatus === 'CANCEL' || esim.esimStatus === 'REVOKE') && order.orderStatus !== 'failed') {
    updates.orderStatus   = 'failed';
    updates.failureReason = `eSIM ${esim.esimStatus === 'CANCEL' ? 'cancelled' : 'revoked'}`;
  }

  if (!Object.keys(updates).length) return false; // Nothing changed

  updates['esimDetails.lastUpdateTime'] = new Date();
  updates.updatedAt = new Date();

  await Order.findOneAndUpdate({ orderId: order.orderId }, { $set: updates });

  console.log(`[sync] Order ${order.orderId}: updated ${Object.keys(updates).filter(k => k.includes('esim')).join(', ')}`);
  return true;
}