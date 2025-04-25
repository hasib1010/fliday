// src/app/api/payment/create-intent/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, packageCode, paymentMethod, couponCode, taxCountry } = body;

    if (!orderId || !packageCode || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, packageCode, paymentMethod' },
        { status: 400 }
      );
    }

    await dbConnect();

    const order = await Order.findOne({ orderId });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let amount = order.finalPrice;
    if (couponCode) {
      // Implement coupon logic if needed
    }

    // Convert from API format to Stripe's format
    // API format: 10000 = $1.00
    // Stripe format: 100 = $1.00
    // Divide by 100 to get the correct amount in cents for Stripe
    const stripeAmount = Math.round(amount / 100);

    console.log(`Creating payment intent for order: ${orderId}, amount: ${amount}, stripeAmount: ${stripeAmount}, taxCountry: ${taxCountry}`);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: stripeAmount,
      currency: order.currency?.toLowerCase() || 'usd',
      payment_method: paymentMethod,
      confirmation_method: 'automatic',
      confirm: false,
      metadata: {
        orderId,
        packageCode,
        type: 'order' // Add type explicitly
      },
      setup_future_usage: 'off_session',
    });
    
    console.log(`Payment intent created: ${paymentIntent.id}`);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId,
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}