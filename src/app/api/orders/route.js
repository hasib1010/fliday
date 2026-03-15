// app/api/orders/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import PackagePricing from '@/models/PackagePricing';
import Coupon from '@/models/Coupon';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_MARKUP_AMOUNT = 10000; // $1.00

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (orderId) {
      const order = await Order.findOne({ orderId, userId: user._id });
      if (!order) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, order });
    }

    const orders = await Order.find({ userId: user._id }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, orders });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      packageCode,
      packageName,
      dataAmount,
      duration,
      location,
      price,         // What the user agreed to pay (retailPrice)
      currency = 'USD',
      paymentMethod,
      taxCountry,
      couponCode,
    } = body;

    if (!packageCode || !packageName || !price || !paymentMethod) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // ── Pricing ───────────────────────────────────────────────────────────────
    // Look up provider (original) price from PackagePricing table
    let originalPrice;
    let markupAmount;
    let finalPrice;

    const customPricing = await PackagePricing.findOne({ packageCode }).catch(() => null);

    if (customPricing) {
      originalPrice = customPricing.originalPrice;
      finalPrice    = customPricing.retailPrice;
      markupAmount  = finalPrice - originalPrice;
    } else {
      // Fallback: treat the incoming price as the retail price with default markup
      finalPrice    = price;
      markupAmount  = DEFAULT_MARKUP_AMOUNT;
      originalPrice = finalPrice - markupAmount;
      if (originalPrice < 0) originalPrice = Math.round(finalPrice * 0.9);
    }

    const discountAmount = 0; // Coupon logic can go here

    console.log(`[Order] packageCode=${packageCode} originalPrice=$${originalPrice/10000} markup=$${markupAmount/10000} finalPrice=$${finalPrice/10000}`);

    // ── Create order record (pending_payment) ─────────────────────────────────
    // NOTE: Do NOT call the eSIM provider here.
    // The Stripe webhook (payment_intent.succeeded) handles eSIM provisioning
    // after payment is confirmed. Calling here would double-provision every order.
    const orderId = uuidv4();

    const order = new Order({
      orderId,
      userId:       user._id,
      packageCode,
      packageName,
      dataAmount,
      duration,
      location,
      originalPrice,
      markupAmount,
      discountAmount,
      finalPrice,
      currency,
      taxCountry,
      couponCode: couponCode ? couponCode.trim().toUpperCase() : null,
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus:   'pending_payment',
      createdAt:     new Date(),
    });

    await order.save();
    console.log(`[Order] Created order ${orderId} — awaiting payment confirmation from Stripe webhook`);

    return NextResponse.json({ success: true, orderId, message: 'Order created successfully' });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create order' }, { status: 500 });
  }
}