import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import Order from '@/models/Order';
import User from '@/models/User';
import PackagePricing from '@/models/PackagePricing';
import { fetchProviderPackagePrice } from '@/lib/esim-provider';

const DEFAULT_MARKUP_AMOUNT = 10000; // $1.00

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Please login to your account before applying the coupon' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      couponCode,
      packageCode,
      dataAmount,
      duration,
      location,
    } = body;

    if (!couponCode || !packageCode) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const normalizedCouponCode = couponCode.trim().toUpperCase();

    const coupon = await Coupon.findOne({
      code: normalizedCouponCode,
      active: true,
    });

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive coupon code' },
        { status: 400 }
      );
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'This coupon has expired' },
        { status: 400 }
      );
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json(
        { success: false, error: 'This coupon has reached its usage limit' },
        { status: 400 }
      );
    }

    if (
      coupon.applicablePackages.length > 0 &&
      !coupon.applicablePackages.includes(packageCode)
    ) {
      return NextResponse.json(
        { success: false, error: 'This coupon is not valid for this package' },
        { status: 400 }
      );
    }

    if (
      coupon.applicableLocations.length > 0 &&
      !coupon.applicableLocations.includes(location)
    ) {
      return NextResponse.json(
        { success: false, error: 'This coupon is not valid for this destination' },
        { status: 400 }
      );
    }

    const normalizedDataAmount = (dataAmount || '').replace(/\s+/g, '').toLowerCase();
    const normalizedApplicableDataAmounts = (coupon.applicableDataAmounts || []).map(
      (amount) => (amount || '').replace(/\s+/g, '').toLowerCase()
    );

    if (
      normalizedApplicableDataAmounts.length > 0 &&
      !normalizedApplicableDataAmounts.includes(normalizedDataAmount)
    ) {
      return NextResponse.json(
        { success: false, error: 'This coupon is not valid for this data plan' },
        { status: 400 }
      );
    }

    if (
      coupon.applicableDurations.length > 0 &&
      !coupon.applicableDurations.includes(duration)
    ) {
      return NextResponse.json(
        { success: false, error: 'This coupon is not valid for this duration' },
        { status: 400 }
      );
    }

    if (coupon.firstOrderOnly) {
      const previousPaidOrder = await Order.findOne({
        userId: user._id,
        paymentStatus: 'paid',
      });

      if (previousPaidOrder) {
        return NextResponse.json(
          { success: false, error: 'This coupon is only valid on your first order' },
          { status: 400 }
        );
      }
    }

    if (coupon.useOncePerCustomer) {
      const previousCouponUse = await Order.findOne({
        userId: user._id,
        couponCode: normalizedCouponCode,
        paymentStatus: 'paid',
      });

      if (previousCouponUse) {
        return NextResponse.json(
          { success: false, error: 'You have already used this coupon' },
          { status: 400 }
        );
      }
    }

    // Recalculate current package price
    let currentProviderPrice;
    try {
      const providerPackageData = await fetchProviderPackagePrice(packageCode);
      currentProviderPrice = providerPackageData.price;
    } catch (providerError) {
      const customPricing = await PackagePricing.findOne({ packageCode });

      if (customPricing) {
        currentProviderPrice = customPricing.originalPrice;
      } else {
        return NextResponse.json(
          { success: false, error: 'Could not validate current package price' },
          { status: 500 }
        );
      }
    }

    const originalPrice = currentProviderPrice;
    let markupAmount;
    let finalPrice;

    const customPricing = await PackagePricing.findOne({ packageCode });

    if (customPricing && customPricing.retailPrice) {
      finalPrice = customPricing.retailPrice;
      markupAmount = finalPrice - originalPrice;
    } else {
      markupAmount = DEFAULT_MARKUP_AMOUNT;
      finalPrice = originalPrice + markupAmount;
    }

    let discountAmount = 0;

    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round((finalPrice * coupon.discountValue) / 100);
    } else if (coupon.discountType === 'fixed') {
      discountAmount = coupon.discountValue;
    }

    if (discountAmount > finalPrice) {
      discountAmount = finalPrice;
    }

    const discountedPrice = finalPrice - discountAmount;

    return NextResponse.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      pricing: {
        originalPrice: finalPrice,
        discountAmount,
        finalPrice: discountedPrice,
      },
      message: 'Coupon applied successfully',
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to validate coupon' },
      { status: 500 }
    );
  }
}