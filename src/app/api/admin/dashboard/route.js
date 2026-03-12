// app/api/admin/dashboard/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import TopUp from '@/models/TopUp';
import User from '@/models/User';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized: Please sign in' }),
        { status: 401 }
      );
    }

    if (session.user.role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized: Admin access required' }),
        { status: 403 }
      );
    }

    await dbConnect();

    // Range selection
    const { searchParams } = new URL(request.url);
    const rangeParam = searchParams.get('range') || '30';
    const allowedRanges = [15, 30, 60, 90];
    const rangeDays = allowedRanges.includes(Number(rangeParam))
      ? Number(rangeParam)
      : 30;

    const now = new Date();
    const rangeStart = new Date();
    rangeStart.setDate(now.getDate() - rangeDays);

    const previousRangeStart = new Date(rangeStart);
    previousRangeStart.setDate(rangeStart.getDate() - rangeDays);

    // Totals
    const totalOrders = await Order.countDocuments();
    const totalTopUps = await TopUp.countDocuments();

    const totalUsers = await User.countDocuments();

    const activeEsims = await Order.countDocuments({
      orderStatus: 'completed',
      'esimDetails.esimStatus': { $ne: 'expired' },
    });

    // Recent transactions
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentTopUps = await TopUp.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentTransactions = [
      ...recentOrders,
      ...recentTopUps.map((topUp) => ({
        orderId: topUp.topUpId,
        createdAt: topUp.createdAt,
        packageName: topUp.packageName,
        location: topUp.location,
        finalPrice: topUp.finalPrice,
        orderStatus: topUp.topUpStatus,
        paymentStatus: topUp.paymentStatus,
        type: 'Top-up',
      })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // Total revenue (all time)
    const orderRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$finalPrice' } } },
    ]);

    const topUpRevenue = await TopUp.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$finalPrice' } } },
    ]);

    const totalRevenue =
      (orderRevenue[0]?.total || 0) + (topUpRevenue[0]?.total || 0);

    // Range comparison

    const currentRangeOrders = await Order.countDocuments({
      createdAt: { $gte: rangeStart, $lte: now },
    });

    const previousRangeOrders = await Order.countDocuments({
      createdAt: { $gte: previousRangeStart, $lt: rangeStart },
    });

    const currentRangeTopUps = await TopUp.countDocuments({
      createdAt: { $gte: rangeStart, $lte: now },
    });

    const previousRangeTopUps = await TopUp.countDocuments({
      createdAt: { $gte: previousRangeStart, $lt: rangeStart },
    });

    const currentRangeTransactions =
      currentRangeOrders + currentRangeTopUps;

    const previousRangeTransactions =
      previousRangeOrders + previousRangeTopUps;

    // Revenue comparison
    const currentRangeOrderRevenue = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          createdAt: { $gte: rangeStart, $lte: now },
        },
      },
      { $group: { _id: null, total: { $sum: '$finalPrice' } } },
    ]);

    const previousRangeOrderRevenue = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          createdAt: { $gte: previousRangeStart, $lt: rangeStart },
        },
      },
      { $group: { _id: null, total: { $sum: '$finalPrice' } } },
    ]);

    const currentRangeTopUpRevenue = await TopUp.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          createdAt: { $gte: rangeStart, $lte: now },
        },
      },
      { $group: { _id: null, total: { $sum: '$finalPrice' } } },
    ]);

    const previousRangeTopUpRevenue = await TopUp.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          createdAt: { $gte: previousRangeStart, $lt: rangeStart },
        },
      },
      { $group: { _id: null, total: { $sum: '$finalPrice' } } },
    ]);

    const currentRangeTotalRevenue =
      (currentRangeOrderRevenue[0]?.total || 0) +
      (currentRangeTopUpRevenue[0]?.total || 0);

    const previousRangeTotalRevenue =
      (previousRangeOrderRevenue[0]?.total || 0) +
      (previousRangeTopUpRevenue[0]?.total || 0);

    // Users growth
    const currentRangeUsers = await User.countDocuments({
      createdAt: { $gte: rangeStart, $lte: now },
    });

    const previousRangeUsers = await User.countDocuments({
      createdAt: { $gte: previousRangeStart, $lt: rangeStart },
    });

    const orderChange =
      previousRangeTransactions === 0
        ? currentRangeTransactions > 0
          ? 100
          : 0
        : Math.round(
            ((currentRangeTransactions - previousRangeTransactions) /
              previousRangeTransactions) *
              100
          );

    const revenueChange =
      previousRangeTotalRevenue === 0
        ? currentRangeTotalRevenue > 0
          ? 100
          : 0
        : Math.round(
            ((currentRangeTotalRevenue - previousRangeTotalRevenue) /
              previousRangeTotalRevenue) *
              100
          );

    const userChange =
      previousRangeUsers === 0
        ? currentRangeUsers > 0
          ? 100
          : 0
        : Math.round(
            ((currentRangeUsers - previousRangeUsers) /
              previousRangeUsers) *
              100
          );

    // Additional metrics
    const paidOrdersInRange = await Order.countDocuments({
      paymentStatus: 'completed',
      createdAt: { $gte: rangeStart, $lte: now },
    });

    const paidTopUpsInRange = await TopUp.countDocuments({
      paymentStatus: 'completed',
      createdAt: { $gte: rangeStart, $lte: now },
    });

    const averageOrderValue =
      paidOrdersInRange + paidTopUpsInRange > 0
        ? Math.round(
            currentRangeTotalRevenue /
              (paidOrdersInRange + paidTopUpsInRange)
          )
        : 0;

    // Top destinations within range
    const orderDestinations = await Order.aggregate([
      {
        $match: {
          orderStatus: 'completed',
          createdAt: { $gte: rangeStart, $lte: now },
        },
      },
      { $group: { _id: '$location', count: { $sum: 1 } } },
    ]);

    const topUpDestinations = await TopUp.aggregate([
      {
        $match: {
          topUpStatus: 'completed',
          createdAt: { $gte: rangeStart, $lte: now },
        },
      },
      { $group: { _id: '$location', count: { $sum: 1 } } },
    ]);

    const destinationsMap = {};

    orderDestinations.forEach((dest) => {
      destinationsMap[dest._id] =
        (destinationsMap[dest._id] || 0) + dest.count;
    });

    topUpDestinations.forEach((dest) => {
      destinationsMap[dest._id] =
        (destinationsMap[dest._id] || 0) + dest.count;
    });

    const combinedDestinations = Object.entries(destinationsMap)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const totalCompletedTransactions =
      paidOrdersInRange + paidTopUpsInRange;

    const formattedTopDestinations = combinedDestinations.map(
      (destination) => ({
        location: destination.location,
        count: destination.count,
        percentage:
          Math.round(
            (destination.count / totalCompletedTransactions) * 100
          ) || 0,
      })
    );

    return NextResponse.json({
      totalOrders: totalOrders + totalTopUps,
      totalRevenue,
      totalUsers,
      activeEsims,

      recentOrders: recentTransactions,

      orderChange,
      revenueChange,
      userChange,

      averageOrderValue,
      paidOrdersInRange,
      paidTopUpsInRange,

      topDestinations: formattedTopDestinations,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}