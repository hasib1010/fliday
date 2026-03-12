import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/models/Coupon';

export async function GET() {
  try {
    await dbConnect();

    const coupons = await Coupon.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      coupons
    });
  } catch (error) {
    console.error('Fetch coupons error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();

    const {
      code,
      discountType,
      discountValue,
      usageLimit,
      expiresAt,
      firstOrderOnly,
      useOncePerCustomer,
      applicablePackages = [],
      applicableLocations = [],
      applicableDataAmounts = [],
      applicableDurations = []
    } = body;

    if (!code || !discountType || !discountValue) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (existingCoupon) {
      return NextResponse.json(
        { success: false, error: 'Coupon already exists' },
        { status: 400 }
      );
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      usageLimit,
      expiresAt,
      firstOrderOnly,
      useOncePerCustomer,
      applicablePackages,
      applicableLocations,
      applicableDataAmounts,
      applicableDurations
    });

    return NextResponse.json({
      success: true,
      coupon
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create coupon' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await dbConnect();

    const body = await request.json();

    const {
      id,
      code,
      discountType,
      discountValue,
      usageLimit,
      expiresAt,
      firstOrderOnly,
      useOncePerCustomer,
      applicablePackages = [],
      applicableLocations = [],
      applicableDataAmounts = [],
      applicableDurations = [],
      active
    } = body;

    if (!id || !code || !discountType || !discountValue) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const existingCoupon = await Coupon.findOne({
      code: code.toUpperCase(),
      _id: { $ne: id }
    });

    if (existingCoupon) {
      return NextResponse.json(
        { success: false, error: 'Another coupon with this code already exists' },
        { status: 400 }
      );
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      {
        code: code.toUpperCase(),
        discountType,
        discountValue,
        usageLimit,
        expiresAt,
        firstOrderOnly,
        useOncePerCustomer,
        applicablePackages,
        applicableLocations,
        applicableDataAmounts,
        applicableDurations,
        active
      },
      { new: true }
    );

    if (!updatedCoupon) {
      return NextResponse.json(
        { success: false, error: 'Coupon not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      coupon: updatedCoupon
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update coupon' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Coupon ID required' },
        { status: 400 }
      );
    }

    await Coupon.findByIdAndDelete(id);

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Delete coupon error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete coupon' },
      { status: 500 }
    );
  }
}