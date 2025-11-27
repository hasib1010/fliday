import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Analytics from '@/models/Analytics';
import crypto from 'crypto';

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { page, referrer } = body;

    // Get visitor information from headers
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

    // Generate visitor ID (using IP + User Agent hash for anonymity)
    const visitorId = crypto
      .createHash('sha256')
      .update(ip + userAgent)
      .digest('hex')
      .substring(0, 16);

    // Generate session ID (could be enhanced with cookies)
    const sessionId = crypto.randomBytes(16).toString('hex');

    // Detect device type
    const device = getDeviceType(userAgent);

    // Get location data (you can use a GeoIP service here)
    const locationData = await getLocationFromIP(ip);

    // Hash IP for privacy
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

    // Create analytics entry
    const analyticsEntry = new Analytics({
      visitorId,
      sessionId,
      page,
      referrer,
      device,
      browser: getBrowser(userAgent),
      os: getOS(userAgent),
      ipHash,
      ...locationData,
      timestamp: new Date(),
    });

    await analyticsEntry.save();

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track analytics' },
      { status: 500 }
    );
  }
}

// Helper functions
function getDeviceType(userAgent) {
  const ua = userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

function getBrowser(userAgent) {
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Other';
}

function getOS(userAgent) {
  if (userAgent.includes('Win')) return 'Windows';
  if (userAgent.includes('Mac')) return 'MacOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Other';
}

async function getLocationFromIP(ip) {
  try {
    // Using ipapi.co (free tier: 1000 requests/day)
    // You can also use: ipgeolocation.io, ip-api.com, or maxmind
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    
    if (!response.ok) {
      return {};
    }

    const data = await response.json();
    
    return {
      country: data.country_name,
      countryCode: data.country_code,
      city: data.city,
      region: data.region,
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch (error) {
    console.error('Location lookup error:', error);
    return {};
  }
}