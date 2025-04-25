// app/api/orders/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

const MARKUP_AMOUNT = 10000; // $1.00 markup in Stripe's format (cents * 100)

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    await dbConnect();

    // Get user ID
    const user = await User.findOne({
      email: session.user.email
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // If orderId is provided, fetch a specific order
    if (orderId) {
      const order = await Order.findOne({ 
        orderId, 
        userId: user._id 
      });

      if (!order) {
        return NextResponse.json({
          success: false,
          error: 'Order not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        order
      });
    }

    // If no orderId, fetch all orders for the user
    const orders = await Order.find({ 
      userId: user._id 
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch orders'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const body = await request.json();
    
    // Required fields
    const {
      packageCode,
      packageName,
      dataAmount,
      duration,
      location,
      price,           // This should be the final price with markup
      originalPrice,   // The provider's original price without markup
      currency = 'USD',
      paymentMethod,
      taxCountry,
      couponCode,
      status = 'pending_payment'
    } = body;

    if (!packageCode || !packageName || !price || !paymentMethod) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    await dbConnect();

    // Get user by email rather than trying ID conversion
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Verify/calculate prices correctly
    let providerPrice = originalPrice;
    const markupAmount = MARKUP_AMOUNT;
    
    // If originalPrice wasn't provided, calculate it from the price
    if (providerPrice === undefined) {
      providerPrice = price - markupAmount;
      
      // Sanity check to ensure we don't have negative provider price
      if (providerPrice < 0) {
        console.warn(`Calculated negative provider price: ${providerPrice}. Using price as fallback.`);
        providerPrice = price;
      }
    }
    
    // Final price should include the markup
    const finalPrice = price;

    // Create a unique orderId
    const orderId = uuidv4();

    // Create new order
    const order = new Order({
      orderId,
      userId: user._id,
      packageCode,
      packageName,
      dataAmount,
      duration,
      location,
      originalPrice: providerPrice,    // Provider's price without markup
      markupAmount: markupAmount,      // $1.00 markup
      discountAmount: 0,               // Handle coupons here if needed
      finalPrice: finalPrice,          // Price with markup (customer pays this)
      currency,
      taxCountry,
      couponCode,
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: status,
      createdAt: new Date()
    });

    await order.save();
    
    console.log(`Order created: ${orderId}, Original price: ${providerPrice/10000}$, Markup: ${markupAmount/10000}$, Final price: ${finalPrice/10000}$`);
    
    return NextResponse.json({
      success: true,
      orderId,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create order'
    }, { status: 500 });
  }
}