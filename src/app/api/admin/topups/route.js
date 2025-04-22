// app/api/admin/topups/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
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
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const sort = searchParams.get('sort') || 'createdAt';
    const direction = searchParams.get('direction') || 'desc';
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const exportData = searchParams.get('export');
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    // Build query
    let query = {};
    
    // Status filter
    if (status && status !== 'all') {
      query.topUpStatus = status;
    }
    
    // Search filter
    if (search) {
      // If search looks like a topUpId or transactionId
      if (/^[a-zA-Z0-9-]+$/.test(search)) {
        query.$or = [
          { topUpId: { $regex: search, $options: 'i' } },
          { transactionId: { $regex: search, $options: 'i' } },
          { iccid: { $regex: search, $options: 'i' } }
        ];
      } else {
        // Look for matches in user email or location
        const users = await User.find({ 
          email: { $regex: search, $options: 'i' } 
        }).select('_id');
        
        const userIds = users.map(user => user._id);
        
        query.$or = [
          { location: { $regex: search, $options: 'i' } },
          { userId: { $in: userIds } }
        ];
      }
    }
    
    // Prepare sort
    const sortOptions = {};
    sortOptions[sort] = direction === 'asc' ? 1 : -1;
    
    // If exporting, get all topUps
    if (exportData === 'csv') {
      // Get all topUps that match the query
      const topUps = await TopUp.find(query)
        .sort(sortOptions)
        .lean();
      
      // Fetch user emails for the topUps
      const userIds = [...new Set(topUps.map(topUp => topUp.userId))];
      const users = await User.find({ _id: { $in: userIds } }).select('_id email').lean();
      
      // Create a map of user IDs to emails
      const userEmailMap = users.reduce((map, user) => {
        map[user._id.toString()] = user.email;
        return map;
      }, {});
      
      // Add user email to each topUp
      const topUpsWithEmail = topUps.map(topUp => {
        const userEmail = userEmailMap[topUp.userId?.toString()] || 'N/A';
        return { ...topUp, userEmail };
      });
      
      // Convert to CSV format
      // In a real application, you would use a proper CSV library
      const headers = [
        'Top-up ID', 'Original Order ID', 'Date', 'User Email', 'Location', 'Package', 
        'Amount', 'Status', 'Payment Status', 'ICCID'
      ].join(',');
      
      const rows = topUpsWithEmail.map(topUp => [
        topUp.topUpId,
        topUp.orderId,
        new Date(topUp.createdAt).toISOString(),
        topUp.userEmail,
        topUp.location,
        topUp.packageName,
        (topUp.finalPrice / 10000).toFixed(2), // Convert to dollars assuming 10000 = $1.00
        topUp.topUpStatus,
        topUp.paymentStatus,
        topUp.iccid
      ].join(','));
      
      const csv = [headers, ...rows].join('\n');
      
      // Return CSV as a downloadable file
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="topups-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }
    
    // Get topUps with pagination for normal request
    const topUps = await TopUp.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Count total topUps for pagination
    const total = await TopUp.countDocuments(query);
    
    // Fetch user emails for the topUps
    const userIds = [...new Set(topUps.map(topUp => topUp.userId))];
    const users = await User.find({ _id: { $in: userIds } }).select('_id email').lean();
    
    // Create a map of user IDs to emails
    const userEmailMap = users.reduce((map, user) => {
      map[user._id.toString()] = user.email;
      return map;
    }, {});
    
    // Add user email to each topUp
    const topUpsWithEmail = topUps.map(topUp => {
      const userEmail = userEmailMap[topUp.userId?.toString()] || 'N/A';
      return { ...topUp, userEmail };
    });
    
    return NextResponse.json({
      topUps: topUpsWithEmail,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('TopUps API error:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}