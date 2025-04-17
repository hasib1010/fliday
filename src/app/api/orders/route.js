import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      packageCode,
      packageName,
      dataAmount,
      duration,
      location,
      price,
      currency,
      paymentMethod,
      taxCountry,
      couponCode,
      status = 'pending_payment',
    } = body;

    if (!packageCode) {
      return NextResponse.json({ error: 'Package code is required' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({
      $or: [{ _id: session.user.id }, { email: session.user.email }],
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const orderId = uuidv4();
    let discount = 0;
    let finalPrice = price;

    if (couponCode) {
      // Implement coupon logic if needed
    }

    const orderData = {
      orderId,
      userId: user._id,
      packageCode,
      packageName,
      dataAmount,
      duration,
      location,
      originalPrice: price,
      discountAmount: discount,
      finalPrice,
      currency: currency || 'USD',
      taxCountry,
      couponCode: couponCode || null,
      paymentStatus: 'pending',
      orderStatus: status,
      paymentMethod,
      createdAt: new Date(),
      esimDetails: {},
    };

    console.log('Saving temporary order:', orderData);
    const order = await Order.create(orderData);

    await User.findByIdAndUpdate(user._id, {
      $set: { updatedAt: new Date(), lastLogin: new Date() },
    });

    return NextResponse.json({
      success: true,
      orderId,
      message: 'Order created successfully',
    });
  } catch (error) {
    console.error('Order creation error:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');

  try {
    await dbConnect();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await Order.findOne({ orderId }).lean();
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log(`Fetched order: ${orderId}`, {
      orderStatus: order.orderStatus,
      esimDetails: order.esimDetails || 'none',
    });

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(`Error fetching order ${orderId}:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order' },
      { status: 500 }
    );
  }
}