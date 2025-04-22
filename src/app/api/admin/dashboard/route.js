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
    // Check if user is authenticated and is an admin
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

    // Connect to the database
    await dbConnect();

    // Get total number of orders and top-ups
    const totalOrders = await Order.countDocuments();
    const totalTopUps = await TopUp.countDocuments();

    // Get recent orders (limited to 5)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get recent top-ups (limited to 5)
    const recentTopUps = await TopUp.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Combine and sort recent transactions by date
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

    // Get total revenue from orders
    const orderRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$finalPrice' } } },
    ]);

    // Get total revenue from top-ups
    const topUpRevenue = await TopUp.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$finalPrice' } } },
    ]);

    const totalRevenue =
      (orderRevenue.length > 0 ? orderRevenue[0].total : 0) +
      (topUpRevenue.length > 0 ? topUpRevenue[0].total : 0);

    // Get total users
    const totalUsers = await User.countDocuments();

    // Get active eSIMs
    const activeEsims = await Order.countDocuments({
      orderStatus: 'completed',
      'esimDetails.esimStatus': { $ne: 'expired' },
    });

    // Calculate month-over-month growth for orders and top-ups
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Orders this month
    const currentMonthOrders = await Order.countDocuments({
      createdAt: { $gte: currentMonth },
    });

    // Orders last month
    const previousMonthOrders = await Order.countDocuments({
      createdAt: { $gte: previousMonth, $lt: currentMonth },
    });

    // Top-ups this month
    const currentMonthTopUps = await TopUp.countDocuments({
      createdAt: { $gte: currentMonth },
    });

    // Top-ups last month
    const previousMonthTopUps = await TopUp.countDocuments({
      createdAt: { $gte: previousMonth, $lt: currentMonth },
    });

    // Total transactions this month vs. last month
    const currentMonthTransactions = currentMonthOrders + currentMonthTopUps;
    const previousMonthTransactions = previousMonthOrders + previousMonthTopUps;

    // Orders revenue this month
    const currentMonthOrderRevenue = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          createdAt: { $gte: currentMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$finalPrice' } } },
    ]);

    // Orders revenue last month
    const previousMonthOrderRevenue = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          createdAt: { $gte: previousMonth, $lt: currentMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$finalPrice' } } },
    ]);

    // Top-ups revenue this month
    const currentMonthTopUpRevenue = await TopUp.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          createdAt: { $gte: currentMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$finalPrice' } } },
    ]);

    // Top-ups revenue last month
    const previousMonthTopUpRevenue = await TopUp.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          createdAt: { $gte: previousMonth, $lt: currentMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$finalPrice' } } },
    ]);

    // Total revenue this month
    const currentMonthTotalRevenue =
      (currentMonthOrderRevenue.length > 0
        ? currentMonthOrderRevenue[0].total
        : 0) +
      (currentMonthTopUpRevenue.length > 0
        ? currentMonthTopUpRevenue[0].total
        : 0);

    // Total revenue last month
    const previousMonthTotalRevenue =
      (previousMonthOrderRevenue.length > 0
        ? previousMonthOrderRevenue[0].total
        : 0) +
      (previousMonthTopUpRevenue.length > 0
        ? previousMonthTopUpRevenue[0].total
        : 0);

    // Calculate month-over-month growth for users
    const currentMonthUsers = await User.countDocuments({
      createdAt: { $gte: currentMonth },
    });

    const previousMonthUsers = await User.countDocuments({
      createdAt: { $gte: previousMonth, $lt: currentMonth },
    });

    // Calculate growth percentages
    const orderChange =
      previousMonthTransactions === 0
        ? 100
        : Math.round(
            ((currentMonthTransactions - previousMonthTransactions) /
              previousMonthTransactions) *
              100
          );

    const revenueChange =
      previousMonthTotalRevenue === 0
        ? 100
        : Math.round(
            ((currentMonthTotalRevenue - previousMonthTotalRevenue) /
              previousMonthTotalRevenue) *
              100
          );

    const userChange =
      previousMonthUsers === 0
        ? 100
        : Math.round(
            ((currentMonthUsers - previousMonthUsers) / previousMonthUsers) * 100
          );

    // Get top destinations from both orders and top-ups
    const orderDestinations = await Order.aggregate([
      { $match: { orderStatus: 'completed' } },
      { $group: { _id: '$location', count: { $sum: 1 } } },
    ]);

    const topUpDestinations = await TopUp.aggregate([
      { $match: { topUpStatus: 'completed' } },
      { $group: { _id: '$location', count: { $sum: 1 } } },
    ]);

    // Combine destination data
    const destinationsMap = {};

    orderDestinations.forEach((dest) => {
      destinationsMap[dest._id] = (destinationsMap[dest._id] || 0) + dest.count;
    });

    topUpDestinations.forEach((dest) => {
      destinationsMap[dest._id] = (destinationsMap[dest._id] || 0) + dest.count;
    });

    // Convert to array and sort
    const combinedDestinations = Object.entries(destinationsMap)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate total completed transactions for percentage
    const totalCompletedTransactions =
      (await Order.countDocuments({ orderStatus: 'completed' })) +
      (await TopUp.countDocuments({ topUpStatus: 'completed' }));

    // Format top destinations with percentage
    const formattedTopDestinations = combinedDestinations.map((destination) => ({
      location: destination.location,
      count: destination.count,
      percentage:
        Math.round((destination.count / totalCompletedTransactions) * 100) || 0,
    }));

    // Return the response
    return NextResponse.json({
      totalOrders: totalOrders + totalTopUps,
      totalRevenue,
      totalUsers,
      activeEsims,
      recentOrders: recentTransactions,
      orderChange,
      revenueChange,
      userChange,
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