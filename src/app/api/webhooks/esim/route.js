// src/app/api/webhooks/esim/route.js
// Receives webhook events from eSIM Access provider and updates order DB
// Register your webhook URL at: https://esimaccess.com → Settings → Webhooks
// URL: https://fliday.com/api/webhooks/esim

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

export async function POST(request) {
  try {
    const body = await request.json();
    const { notifyType, content } = body;

    if (!notifyType || !content) {
      return NextResponse.json({ success: false, error: 'Invalid webhook payload' }, { status: 400 });
    }

    // Health check
    if (notifyType === 'CHECK_HEALTH') {
      console.log('[eSIM Webhook] Health check received');
      return NextResponse.json({ success: true });
    }

    await dbConnect();

    console.log(`[eSIM Webhook] ${notifyType}:`, JSON.stringify(content));

    switch (notifyType) {

      // ── eSIM profile ready after order ──────────────────────────────────────
      case 'ORDER_STATUS': {
        if (content.orderStatus !== 'GOT_RESOURCE') break;
        // Order is ready — mark as completed (QR code will be fetched on next confirmation page visit)
        await Order.findOneAndUpdate(
          { 'esimDetails.orderNo': content.orderNo },
          { $set: { orderStatus: 'completed', updatedAt: new Date() } }
        );
        console.log(`[eSIM Webhook] ORDER_STATUS GOT_RESOURCE for orderNo: ${content.orderNo}`);
        break;
      }

      // ── Real-time SM-DP+ profile lifecycle events ───────────────────────────
      case 'SMDP_EVENT': {
        const { iccid, esimStatus, smdpStatus, orderNo, esimTranNo } = content;
        const query = esimTranNo
          ? { 'esimDetails.esimTranNo': esimTranNo }
          : orderNo
            ? { 'esimDetails.orderNo': orderNo }
            : iccid
              ? { 'esimDetails.iccid': iccid }
              : null;

        if (!query) break;

        await Order.findOneAndUpdate(query, {
          $set: {
            'esimDetails.esimStatus':  esimStatus  || undefined,
            'esimDetails.smdpStatus':  smdpStatus  || undefined,
            'esimDetails.eid':         content.eid || undefined,
            'esimDetails.lastUpdateTime': new Date(),
            updatedAt: new Date(),
          },
        });
        console.log(`[eSIM Webhook] SMDP_EVENT ${smdpStatus}/${esimStatus} for esimTranNo: ${esimTranNo}`);
        break;
      }

      // ── eSIM status changes (activated, expired, cancelled, etc.) ───────────
      case 'ESIM_STATUS': {
        const { iccid, esimStatus, smdpStatus, orderNo, esimTranNo } = content;
        const query = esimTranNo
          ? { 'esimDetails.esimTranNo': esimTranNo }
          : orderNo
            ? { 'esimDetails.orderNo': orderNo }
            : iccid
              ? { 'esimDetails.iccid': iccid }
              : null;

        if (!query) break;

        const updateFields = {
          'esimDetails.esimStatus':     esimStatus  || undefined,
          'esimDetails.smdpStatus':     smdpStatus  || undefined,
          'esimDetails.lastUpdateTime': new Date(),
          updatedAt: new Date(),
        };

        // If cancelled/revoked, update order status too
        if (esimStatus === 'CANCEL' || esimStatus === 'REVOKE') {
          updateFields.orderStatus = 'failed';
          updateFields.failureReason = `eSIM ${esimStatus === 'CANCEL' ? 'cancelled' : 'revoked'}`;
        }

        await Order.findOneAndUpdate(query, { $set: updateFields });
        console.log(`[eSIM Webhook] ESIM_STATUS ${esimStatus} for esimTranNo: ${esimTranNo}`);
        break;
      }

      // ── Data usage updates (50%, 80%, 90% thresholds) ───────────────────────
      case 'DATA_USAGE': {
        const { iccid, esimTranNo, orderNo, totalVolume, orderUsage } = content;
        const query = esimTranNo
          ? { 'esimDetails.esimTranNo': esimTranNo }
          : orderNo
            ? { 'esimDetails.orderNo': orderNo }
            : iccid
              ? { 'esimDetails.iccid': iccid }
              : null;

        if (!query) break;

        await Order.findOneAndUpdate(query, {
          $set: {
            'esimDetails.totalVolume':    totalVolume  || undefined,
            'esimDetails.orderUsage':     orderUsage   ?? undefined,
            'esimDetails.lastUpdateTime': new Date(),
            updatedAt: new Date(),
          },
        });
        console.log(`[eSIM Webhook] DATA_USAGE for esimTranNo: ${esimTranNo}, used: ${orderUsage}/${totalVolume}`);
        break;
      }

      // ── Validity expiring in 1 day ───────────────────────────────────────────
      case 'VALIDITY_USAGE': {
        const { iccid, esimTranNo, orderNo, expiredTime } = content;
        const query = esimTranNo
          ? { 'esimDetails.esimTranNo': esimTranNo }
          : orderNo
            ? { 'esimDetails.orderNo': orderNo }
            : iccid
              ? { 'esimDetails.iccid': iccid }
              : null;

        if (!query) break;

        await Order.findOneAndUpdate(query, {
          $set: {
            'esimDetails.expiredTime':    expiredTime  || undefined,
            'esimDetails.lastUpdateTime': new Date(),
            updatedAt: new Date(),
          },
        });
        console.log(`[eSIM Webhook] VALIDITY_USAGE expiring soon for esimTranNo: ${esimTranNo}`);
        break;
      }

      default:
        console.log(`[eSIM Webhook] Unhandled notifyType: ${notifyType}`);
    }

    return NextResponse.json({ success: true, received: notifyType });
  } catch (error) {
    console.error('[eSIM Webhook] Error:', error);
    return NextResponse.json({ success: false, error: 'Webhook handler failed' }, { status: 500 });
  }
}