// app/api/checkout/topup/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import TopUp from '@/models/TopUp';
import User from '@/models/User';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Get the topUpId from query params
    const { searchParams } = new URL(request.url);
    const topUpId = searchParams.get('topUpId');

    if (!topUpId) {
      return NextResponse.json({ 
        success: false, 
        error: 'TopUp ID is required' 
      }, { status: 400 });
    }

    await dbConnect();

    // Find the user
    const user = await User.findOne({
      $or: [
        { _id: session.user.id },
        { email: session.user.email }
      ]
    });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Find the topUp
    const topUp = await TopUp.findOne({ 
      topUpId,
      userId: user._id
    });

    if (!topUp) {
      return NextResponse.json({ 
        success: false, 
        error: 'TopUp not found' 
      }, { status: 404 });
    }

    // If the topUp is already paid for, no need to create a new payment intent
    if (topUp.paymentStatus === 'completed') {
      return NextResponse.json({
        success: true,
        topUp
      });
    }

    // Log the price values for debugging
    console.log(`TopUp ${topUpId} - Original price: ${topUp.originalPrice}, Markup: ${topUp.markupAmount}, Final price: ${topUp.finalPrice}`);

    // Convert from provider's price format (10000 = $1.00) to Stripe's format (100 = $1.00)
    // Provider format: 10,000 units = $1.00
    // Stripe format: 100 cents = $1.00
    // Therefore: Provider price / 100 = Stripe price
    const stripeAmount = Math.round(topUp.finalPrice / 100);
    
    console.log(`Converting provider price ${topUp.finalPrice} to Stripe amount ${stripeAmount}`);
    
    // Create or retrieve a payment intent
    let paymentIntent;
    if (topUp.paymentIntentId) {
      // Retrieve existing payment intent
      paymentIntent = await stripe.paymentIntents.retrieve(topUp.paymentIntentId);
      
      // If it's not in a terminal state, update it
      if (!['succeeded', 'canceled'].includes(paymentIntent.status)) {
        paymentIntent = await stripe.paymentIntents.update(topUp.paymentIntentId, {
          amount: stripeAmount,
          currency: topUp.currency.toLowerCase(),
        });
      }
    } else {
      // Create a new payment intent
      paymentIntent = await stripe.paymentIntents.create({
        amount: stripeAmount,
        currency: topUp.currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          topUpId: topUp.topUpId,
          orderId: topUp.orderId,
          userId: user._id.toString(),
          type: 'topup'
        },
      });

      // Save the payment intent ID
      topUp.paymentIntentId = paymentIntent.id;
      await topUp.save();
    }

    console.log(`Payment intent ${paymentIntent.id} created/updated with amount ${stripeAmount}`);

    return NextResponse.json({
      success: true,
      topUp,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error handling topUp checkout:', error.stack);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'An error occurred processing your checkout' 
    }, { status: 500 });
  }
}