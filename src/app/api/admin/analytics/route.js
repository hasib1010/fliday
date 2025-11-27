import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Analytics from '@/models/Analytics';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    // Calculate date range
    const now = new Date();
    let startDate;

    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Get total visitors
    const totalVisitors = await Analytics.countDocuments({
      timestamp: { $gte: startDate },
    });

    // Get unique visitors
    const uniqueVisitors = await Analytics.distinct('visitorId', {
      timestamp: { $gte: startDate },
    });

    // Get page views
    const pageViews = await Analytics.countDocuments({
      timestamp: { $gte: startDate },
    });

    // Get top countries
    const topCountries = await Analytics.aggregate([
      { $match: { timestamp: { $gte: startDate }, country: { $exists: true } } },
      {
        $group: {
          _id: { country: '$country', countryCode: '$countryCode' },
          visitors: { $sum: 1 },
        },
      },
      { $sort: { visitors: -1 } },
      { $limit: 10 },
      {
        $project: {
          country: '$_id.country',
          countryCode: '$_id.countryCode',
          visitors: 1,
          _id: 0,
        },
      },
    ]);

    // Add flags and percentages
    const countriesWithFlags = topCountries.map(country => ({
      ...country,
      flag: getFlagEmoji(country.countryCode),
      percentage: ((country.visitors / totalVisitors) * 100).toFixed(1),
    }));

    // Get top pages
    const topPages = await Analytics.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: '$page',
          views: { $sum: 1 },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 10 },
      {
        $project: {
          path: '$_id',
          views: 1,
          _id: 0,
        },
      },
    ]);

    // Get device stats
    const deviceStats = await Analytics.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: '$device',
          count: { $sum: 1 },
        },
      },
    ]);

    const devices = { desktop: 0, mobile: 0, tablet: 0 };
    deviceStats.forEach(stat => {
      if (stat._id) {
        devices[stat._id] = stat.count;
      }
    });

    // Get recent visitors
    const recentVisitors = await Analytics.find({
      timestamp: { $gte: startDate },
    })
      .sort({ timestamp: -1 })
      .limit(20)
      .select('timestamp country city page device countryCode')
      .lean();

    const visitorsWithFlags = recentVisitors.map(visitor => ({
      ...visitor,
      flag: getFlagEmoji(visitor.countryCode),
    }));

    return NextResponse.json({
      totalVisitors,
      uniqueVisitors: uniqueVisitors.length,
      pageViews,
      topCountries: countriesWithFlags,
      topPages,
      deviceStats: devices,
      recentVisitors: visitorsWithFlags,
    });

  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

// Helper function to get flag emoji from country code
function getFlagEmoji(countryCode) {
  if (!countryCode) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}