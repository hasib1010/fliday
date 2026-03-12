// app/api/admin/dashboard/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import TopUp from '@/models/TopUp';
import User from '@/models/User';

const countryNames = {
  AD: 'Andorra',
  AE: 'United Arab Emirates',
  AF: 'Afghanistan',
  AG: 'Antigua and Barbuda',
  AI: 'Anguilla',
  AL: 'Albania',
  AM: 'Armenia',
  AO: 'Angola',
  AQ: 'Antarctica',
  AR: 'Argentina',
  AS: 'American Samoa',
  AT: 'Austria',
  AU: 'Australia',
  AW: 'Aruba',
  AX: 'Åland Islands',
  AZ: 'Azerbaijan',
  BA: 'Bosnia and Herzegovina',
  BB: 'Barbados',
  BD: 'Bangladesh',
  BE: 'Belgium',
  BF: 'Burkina Faso',
  BG: 'Bulgaria',
  BH: 'Bahrain',
  BI: 'Burundi',
  BJ: 'Benin',
  BL: 'Saint Barthélemy',
  BM: 'Bermuda',
  BN: 'Brunei',
  BO: 'Bolivia',
  BQ: 'Caribbean Netherlands',
  BR: 'Brazil',
  BS: 'Bahamas',
  BT: 'Bhutan',
  BV: 'Bouvet Island',
  BW: 'Botswana',
  BY: 'Belarus',
  BZ: 'Belize',
  CA: 'Canada',
  CC: 'Cocos (Keeling) Islands',
  CD: 'Congo (DRC)',
  CF: 'Central African Republic',
  CG: 'Congo (Republic)',
  CH: 'Switzerland',
  CI: "Côte d'Ivoire",
  CK: 'Cook Islands',
  CL: 'Chile',
  CM: 'Cameroon',
  CN: 'China',
  CO: 'Colombia',
  CR: 'Costa Rica',
  CU: 'Cuba',
  CV: 'Cape Verde',
  CW: 'Curaçao',
  CX: 'Christmas Island',
  CY: 'Cyprus',
  CZ: 'Czechia',
  DE: 'Germany',
  DJ: 'Djibouti',
  DK: 'Denmark',
  DM: 'Dominica',
  DO: 'Dominican Republic',
  DZ: 'Algeria',
  EC: 'Ecuador',
  EE: 'Estonia',
  EG: 'Egypt',
  EH: 'Western Sahara',
  ER: 'Eritrea',
  ES: 'Spain',
  ET: 'Ethiopia',
  FI: 'Finland',
  FJ: 'Fiji',
  FK: 'Falkland Islands',
  FM: 'Micronesia',
  FO: 'Faroe Islands',
  FR: 'France',
  GA: 'Gabon',
  GB: 'United Kingdom',
  GD: 'Grenada',
  GE: 'Georgia',
  GF: 'French Guiana',
  GG: 'Guernsey',
  GH: 'Ghana',
  GI: 'Gibraltar',
  GL: 'Greenland',
  GM: 'Gambia',
  GN: 'Guinea',
  GP: 'Guadeloupe',
  GQ: 'Equatorial Guinea',
  GR: 'Greece',
  GT: 'Guatemala',
  GU: 'Guam',
  GW: 'Guinea-Bissau',
  GY: 'Guyana',
  HK: 'Hong Kong',
  HN: 'Honduras',
  HR: 'Croatia',
  HT: 'Haiti',
  HU: 'Hungary',
  ID: 'Indonesia',
  IE: 'Ireland',
  IL: 'Israel',
  IM: 'Isle of Man',
  IN: 'India',
  IQ: 'Iraq',
  IR: 'Iran',
  IS: 'Iceland',
  IT: 'Italy',
  JE: 'Jersey',
  JM: 'Jamaica',
  JO: 'Jordan',
  JP: 'Japan',
  KE: 'Kenya',
  KG: 'Kyrgyzstan',
  KH: 'Cambodia',
  KI: 'Kiribati',
  KM: 'Comoros',
  KN: 'Saint Kitts and Nevis',
  KP: 'North Korea',
  KR: 'South Korea',
  KW: 'Kuwait',
  KY: 'Cayman Islands',
  KZ: 'Kazakhstan',
  LA: 'Laos',
  LB: 'Lebanon',
  LC: 'Saint Lucia',
  LI: 'Liechtenstein',
  LK: 'Sri Lanka',
  LR: 'Liberia',
  LS: 'Lesotho',
  LT: 'Lithuania',
  LU: 'Luxembourg',
  LV: 'Latvia',
  LY: 'Libya',
  MA: 'Morocco',
  MC: 'Monaco',
  MD: 'Moldova',
  ME: 'Montenegro',
  MF: 'Saint Martin',
  MG: 'Madagascar',
  MH: 'Marshall Islands',
  MK: 'North Macedonia',
  ML: 'Mali',
  MM: 'Myanmar',
  MN: 'Mongolia',
  MO: 'Macao',
  MP: 'Northern Mariana Islands',
  MQ: 'Martinique',
  MR: 'Mauritania',
  MS: 'Montserrat',
  MT: 'Malta',
  MU: 'Mauritius',
  MV: 'Maldives',
  MW: 'Malawi',
  MX: 'Mexico',
  MY: 'Malaysia',
  MZ: 'Mozambique',
  NA: 'Namibia',
  NC: 'New Caledonia',
  NE: 'Niger',
  NF: 'Norfolk Island',
  NG: 'Nigeria',
  NI: 'Nicaragua',
  NL: 'Netherlands',
  NO: 'Norway',
  NP: 'Nepal',
  NZ: 'New Zealand',
  OM: 'Oman',
  PA: 'Panama',
  PE: 'Peru',
  PF: 'French Polynesia',
  PG: 'Papua New Guinea',
  PH: 'Philippines',
  PK: 'Pakistan',
  PL: 'Poland',
  PR: 'Puerto Rico',
  PT: 'Portugal',
  PW: 'Palau',
  PY: 'Paraguay',
  QA: 'Qatar',
  RE: 'Réunion',
  RO: 'Romania',
  RS: 'Serbia',
  RU: 'Russia',
  RW: 'Rwanda',
  SA: 'Saudi Arabia',
  SC: 'Seychelles',
  SD: 'Sudan',
  SE: 'Sweden',
  SG: 'Singapore',
  SI: 'Slovenia',
  SK: 'Slovakia',
  SL: 'Sierra Leone',
  SM: 'San Marino',
  SN: 'Senegal',
  SO: 'Somalia',
  SR: 'Suriname',
  SS: 'South Sudan',
  SV: 'El Salvador',
  SX: 'Sint Maarten',
  SY: 'Syria',
  SZ: 'Eswatini',
  TC: 'Turks and Caicos Islands',
  TD: 'Chad',
  TG: 'Togo',
  TH: 'Thailand',
  TJ: 'Tajikistan',
  TL: 'Timor-Leste',
  TM: 'Turkmenistan',
  TN: 'Tunisia',
  TO: 'Tonga',
  TR: 'Turkey',
  TT: 'Trinidad and Tobago',
  TW: 'Taiwan',
  TZ: 'Tanzania',
  UA: 'Ukraine',
  UG: 'Uganda',
  US: 'United States',
  UY: 'Uruguay',
  UZ: 'Uzbekistan',
  VA: 'Vatican City',
  VC: 'Saint Vincent and the Grenadines',
  VE: 'Venezuela',
  VG: 'British Virgin Islands',
  VI: 'U.S. Virgin Islands',
  VN: 'Vietnam',
  ZA: 'South Africa',
  ZM: 'Zambia',
  ZW: 'Zimbabwe',
};

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

    const { searchParams } = new URL(request.url);
    const rangeParam = searchParams.get('range') || '30';
    const allowedRanges = ['all', '15', '30', '60', '90'];
    const selectedRange = allowedRanges.includes(rangeParam) ? rangeParam : '30';

    const now = new Date();
    const isAllTime = selectedRange === 'all';

    let rangeStart = null;
    let previousRangeStart = null;
    let rangeDays = null;

    if (!isAllTime) {
      rangeDays = Number(selectedRange);
      rangeStart = new Date();
      rangeStart.setDate(now.getDate() - rangeDays);

      previousRangeStart = new Date(rangeStart);
      previousRangeStart.setDate(rangeStart.getDate() - rangeDays);
    }

    const currentRangeFilter = isAllTime
      ? {}
      : { createdAt: { $gte: rangeStart, $lte: now } };

    const previousRangeFilter = isAllTime
      ? null
      : { createdAt: { $gte: previousRangeStart, $lt: rangeStart } };

    const totalUsers = await User.countDocuments();

    const activeEsims = await Order.countDocuments({
      orderStatus: 'completed',
      'esimDetails.esimStatus': { $ne: 'expired' },
    });

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentTopUps = await TopUp.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentTransactions = [
      ...recentOrders.map((order) => ({
        ...order,
        type: 'Order',
      })),
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

    const currentRangeOrders = await Order.countDocuments(currentRangeFilter);
    const currentRangeTopUps = await TopUp.countDocuments(currentRangeFilter);

    const totalTransactionsInRange = currentRangeOrders + currentRangeTopUps;

    const currentRangeOrderRevenue = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          ...currentRangeFilter,
        },
      },
      { $group: { _id: null, total: { $sum: '$finalPrice' } } },
    ]);

    const currentRangeTopUpRevenue = await TopUp.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          ...currentRangeFilter,
        },
      },
      { $group: { _id: null, total: { $sum: '$finalPrice' } } },
    ]);

    const totalRevenueInRange =
      (currentRangeOrderRevenue[0]?.total || 0) +
      (currentRangeTopUpRevenue[0]?.total || 0);

    const currentRangeUsers = isAllTime
      ? totalUsers
      : await User.countDocuments(currentRangeFilter);

    const paidOrdersInRange = await Order.countDocuments({
      paymentStatus: 'completed',
      ...currentRangeFilter,
    });

    const paidTopUpsInRange = await TopUp.countDocuments({
      paymentStatus: 'completed',
      ...currentRangeFilter,
    });

    const averageOrderValue =
      paidOrdersInRange + paidTopUpsInRange > 0
        ? Math.round(totalRevenueInRange / (paidOrdersInRange + paidTopUpsInRange))
        : 0;

    let orderChange = 0;
    let revenueChange = 0;
    let userChange = 0;

    if (!isAllTime) {
      const previousRangeOrders = await Order.countDocuments(previousRangeFilter);
      const previousRangeTopUps = await TopUp.countDocuments(previousRangeFilter);
      const previousRangeTransactions = previousRangeOrders + previousRangeTopUps;

      const previousRangeOrderRevenue = await Order.aggregate([
        {
          $match: {
            paymentStatus: 'completed',
            ...previousRangeFilter,
          },
        },
        { $group: { _id: null, total: { $sum: '$finalPrice' } } },
      ]);

      const previousRangeTopUpRevenue = await TopUp.aggregate([
        {
          $match: {
            paymentStatus: 'completed',
            ...previousRangeFilter,
          },
        },
        { $group: { _id: null, total: { $sum: '$finalPrice' } } },
      ]);

      const previousRangeTotalRevenue =
        (previousRangeOrderRevenue[0]?.total || 0) +
        (previousRangeTopUpRevenue[0]?.total || 0);

      const previousRangeUsers = await User.countDocuments(previousRangeFilter);

      orderChange =
        previousRangeTransactions === 0
          ? totalTransactionsInRange > 0
            ? 100
            : 0
          : Math.round(
              ((totalTransactionsInRange - previousRangeTransactions) /
                previousRangeTransactions) *
                100
            );

      revenueChange =
        previousRangeTotalRevenue === 0
          ? totalRevenueInRange > 0
            ? 100
            : 0
          : Math.round(
              ((totalRevenueInRange - previousRangeTotalRevenue) /
                previousRangeTotalRevenue) *
                100
            );

      userChange =
        previousRangeUsers === 0
          ? currentRangeUsers > 0
            ? 100
            : 0
          : Math.round(
              ((currentRangeUsers - previousRangeUsers) / previousRangeUsers) * 100
            );
    }

    const orderDestinations = await Order.aggregate([
      {
        $match: {
          orderStatus: 'completed',
          ...currentRangeFilter,
        },
      },
      { $group: { _id: '$location', count: { $sum: 1 } } },
    ]);

    const topUpDestinations = await TopUp.aggregate([
      {
        $match: {
          topUpStatus: 'completed',
          ...currentRangeFilter,
        },
      },
      { $group: { _id: '$location', count: { $sum: 1 } } },
    ]);

    const destinationsMap = {};

    orderDestinations.forEach((dest) => {
      destinationsMap[dest._id] = (destinationsMap[dest._id] || 0) + dest.count;
    });

    topUpDestinations.forEach((dest) => {
      destinationsMap[dest._id] = (destinationsMap[dest._id] || 0) + dest.count;
    });

    const combinedDestinations = Object.entries(destinationsMap)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const totalCompletedTransactions = paidOrdersInRange + paidTopUpsInRange;

    const formattedTopDestinations = combinedDestinations.map((destination) => ({
      location: countryNames[destination.location] || destination.location,
      code: destination.location,
      count: destination.count,
      percentage:
        Math.round((destination.count / (totalCompletedTransactions || 1)) * 100) || 0,
    }));

    return NextResponse.json({
      selectedRange,
      totalOrders: totalTransactionsInRange,
      totalRevenue: totalRevenueInRange,
      totalUsers: currentRangeUsers,
      activeEsims,
      recentOrders: recentTransactions,
      orderChange,
      revenueChange,
      userChange,
      topDestinations: formattedTopDestinations,
      averageOrderValue,
      paidOrdersInRange,
      paidTopUpsInRange,
      isAllTime,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}