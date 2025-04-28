// app/api/orders/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import PackagePricing from '@/models/PackagePricing'; // Import the pricing model
import { v4 as uuidv4 } from 'uuid';

// Default markup if no custom pricing is found
const DEFAULT_MARKUP_AMOUNT = 10000; // $1.00 markup in Stripe's format (cents * 100)

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
      price,           // This is the price from the eSIM API (may include frontend markup)
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

    // Look up custom pricing if available
    let customPricing = null;
    try {
      customPricing = await PackagePricing.findOne({ packageCode });
    } catch (error) {
      console.warn('Error fetching custom pricing:', error);
      // Continue with default pricing if there's an error
    }

    // Calculate pricing based on custom settings if available
    let originalPrice; // Provider's price without markup
    let markupAmount; // Our markup
    let finalPrice; // Price customer pays

    if (customPricing) {
      // Use custom pricing from database
      originalPrice = customPricing.originalPrice;
      finalPrice = customPricing.retailPrice;
      markupAmount = finalPrice - originalPrice;
      
      console.log(`Using custom pricing for ${packageCode}: Original: ${originalPrice/10000}, Retail: ${finalPrice/10000}, Markup: ${markupAmount/10000}`);
    } else {
      // Use default markup
      // The price passed from frontend may already include markup, so we need to be careful
      
      // Check if originalPrice was provided in the request (from frontend)
      if (body.originalPrice !== undefined) {
        originalPrice = body.originalPrice;
        finalPrice = price; // Keep the price as-is from the request
        markupAmount = finalPrice - originalPrice;
      } else {
        // Calculate originalPrice by removing default markup from price
        markupAmount = DEFAULT_MARKUP_AMOUNT;
        originalPrice = price - markupAmount;
        finalPrice = price;
        
        // Ensure we don't have negative provider price (sanity check)
        if (originalPrice < 0) {
          console.warn(`Calculated negative provider price: ${originalPrice}. Using price as fallback.`);
          originalPrice = Math.round(price * 0.9); // Assume 90% of price is original
          markupAmount = price - originalPrice;
        }
      }
      
      console.log(`Using default pricing for ${packageCode}: Original: ${originalPrice/10000}, Final: ${finalPrice/10000}, Markup: ${markupAmount/10000}`);
    }

    // Apply coupon discount if available
    let discountAmount = 0;
    if (couponCode) {
      // Here you could implement coupon validation and discount calculation
      // For now, assuming no discount
    }

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
      originalPrice: originalPrice,     // Provider's price without markup
      markupAmount: markupAmount,       // Our markup
      discountAmount: discountAmount,   // Handle coupons here if needed
      finalPrice: finalPrice,           // Price with markup (customer pays this)
      currency,
      taxCountry,
      couponCode,
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: status,
      createdAt: new Date()
    });

    await order.save();
    
    console.log(`Order created: ${orderId}, Original price: ${originalPrice/10000}$, Markup: ${markupAmount/10000}$, Final price: ${finalPrice/10000}$`);
    
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