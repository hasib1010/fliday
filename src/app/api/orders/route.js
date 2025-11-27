// app/api/orders/route.js - FINAL VERSION WITH PROPER PRICE HANDLING
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import PackagePricing from '@/models/PackagePricing';
import { v4 as uuidv4 } from 'uuid';
import { fetchProviderPackagePrice, orderESIMFromProvider } from '@/lib/esim-provider';

const DEFAULT_MARKUP_AMOUNT = 10000; // $1.00

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

    const user = await User.findOne({
      email: session.user.email
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

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
    
    const {
      packageCode,
      packageName,
      dataAmount,
      duration,
      location,
      price, // What user agreed to pay
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

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    console.log('='.repeat(80));
    console.log(`[Order Creation] Starting order for package: ${packageCode}`);
    console.log(`[Order Creation] User expected price: $${price / 10000}`);
    console.log('='.repeat(80));

    // ============================================
    // STEP 1: Fetch current price from provider
    // ============================================
    let currentProviderPrice;
    let providerPackageData;
    
    try {
      console.log('[STEP 1] Fetching current price from provider...');
      providerPackageData = await fetchProviderPackagePrice(packageCode);
      currentProviderPrice = providerPackageData.price;
      
      console.log(`[STEP 1] ✓ Current provider price: $${currentProviderPrice / 10000}`);
    } catch (providerError) {
      console.error('[STEP 1] ✗ Failed to fetch provider price:', providerError.message);
      console.log('[STEP 1] Falling back to calculated price...');
      
      // Fallback: Try to get from custom pricing or calculate
      let customPricing = null;
      try {
        customPricing = await PackagePricing.findOne({ packageCode });
      } catch (err) {
        console.warn('Error fetching custom pricing:', err);
      }

      if (customPricing) {
        currentProviderPrice = customPricing.originalPrice;
        console.log(`[STEP 1] Using custom pricing: $${currentProviderPrice / 10000}`);
      } else if (body.originalPrice !== undefined) {
        currentProviderPrice = body.originalPrice;
        console.log(`[STEP 1] Using provided original price: $${currentProviderPrice / 10000}`);
      } else {
        // Last resort: subtract default markup
        currentProviderPrice = price - DEFAULT_MARKUP_AMOUNT;
        if (currentProviderPrice < 0) {
          currentProviderPrice = Math.round(price * 0.9);
        }
        console.log(`[STEP 1] Using calculated price: $${currentProviderPrice / 10000}`);
      }
    }

    // ============================================
    // STEP 2: Calculate pricing with markup
    // ============================================
    console.log('[STEP 2] Calculating final pricing...');
    
    let originalPrice = currentProviderPrice;
    let markupAmount;
    let finalPrice;

    let customPricing = null;
    try {
      customPricing = await PackagePricing.findOne({ packageCode });
    } catch (error) {
      console.warn('Error fetching custom pricing for markup:', error);
    }

    if (customPricing && customPricing.retailPrice) {
      finalPrice = customPricing.retailPrice;
      markupAmount = finalPrice - originalPrice;
      console.log(`[STEP 2] Using custom markup: $${markupAmount / 10000}`);
    } else {
      markupAmount = DEFAULT_MARKUP_AMOUNT;
      finalPrice = originalPrice + markupAmount;
      console.log(`[STEP 2] Using default markup: $${markupAmount / 10000}`);
    }

    // Check if price changed significantly
    const priceDifference = Math.abs(finalPrice - price);
    const priceChangePercent = (priceDifference / price) * 100;
    
    if (priceChangePercent > 5) {
      console.warn(`[STEP 2] ⚠ Price changed ${priceChangePercent.toFixed(1)}%: Expected $${price/10000}, Actual $${finalPrice/10000}`);
    } else {
      console.log(`[STEP 2] ✓ Price stable (${priceChangePercent.toFixed(1)}% change)`);
    }

    console.log('[STEP 2] Final pricing breakdown:');
    console.log(`  - Provider price: $${originalPrice / 10000}`);
    console.log(`  - Markup: $${markupAmount / 10000}`);
    console.log(`  - Customer pays: $${finalPrice / 10000}`);

    let discountAmount = 0;
    if (couponCode) {
      // Implement coupon logic
    }

    // ============================================
    // STEP 3: Create order in MongoDB
    // ============================================
    console.log('[STEP 3] Creating order in MongoDB...');
    
    const orderId = uuidv4();
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const order = new Order({
      orderId,
      userId: user._id,
      transactionId,
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
      couponCode,
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: status,
      createdAt: new Date()
    });

    await order.save();
    console.log(`[STEP 3] ✓ Order created: ${orderId}`);

    // ============================================
    // STEP 4: Order eSIM from provider
    // ============================================
    console.log('[STEP 4] Ordering eSIM from provider...');
    
    try {
      const esimResult = await orderESIMFromProvider({
        transactionId,
        packageCode,
        providerPrice: originalPrice, // Use current provider price
        count: 1
      });

      console.log(`[STEP 4] ✓ eSIM ordered successfully. OrderNo: ${esimResult.orderNo}`);

      // Update order with orderNo
      await Order.findOneAndUpdate(
        { orderId },
        {
          $set: {
            'esimDetails.orderNo': esimResult.orderNo,
            'esimDetails.transactionId': transactionId,
            orderStatus: 'processing',
            updatedAt: new Date()
          }
        }
      );

      console.log(`[STEP 4] ✓ Order updated with orderNo`);
      console.log('='.repeat(80));
      console.log('[Order Creation] ✓ SUCCESS - All steps completed');
      console.log('='.repeat(80));

      return NextResponse.json({
        success: true,
        orderId,
        message: 'Order created successfully'
      });

    } catch (esimError) {
      console.error('[STEP 4] ✗ Failed to order eSIM:', esimError.message);
      
      // Update order status to failed
      await Order.findOneAndUpdate(
        { orderId },
        {
          $set: {
            orderStatus: 'failed',
            failureReason: esimError.message,
            updatedAt: new Date()
          }
        }
      );

      console.log('='.repeat(80));
      console.log('[Order Creation] ✗ FAILED - eSIM provisioning error');
      console.log('='.repeat(80));

      // Return error to frontend
      return NextResponse.json({
        success: false,
        error: `Failed to provision eSIM: ${esimError.message}`,
        orderId // Include for support reference
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating order:', error);
    console.log('='.repeat(80));
    console.log('[Order Creation] ✗ FAILED - Unexpected error');
    console.log('='.repeat(80));
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create order'
    }, { status: 500 });
  }
}