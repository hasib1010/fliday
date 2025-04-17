// src\app\api\payment\create-intent\route.js
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

    console.log(`Creating payment intent for order: ${orderId}, amount: ${amount}`);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: order.currency || 'usd',
      payment_method: paymentMethod,
      confirmation_method: 'automatic', // Changed to automatic
      confirm: false,
      metadata: { orderId, packageCode },
      // Attach payment method but don't confirm yet
      setup_future_usage: 'off_session', // Optional: adjust based on needs
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