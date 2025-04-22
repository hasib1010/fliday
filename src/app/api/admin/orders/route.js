// app/api/admin/orders/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
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
      query.orderStatus = status;
    }
    
    // Search filter
    if (search) {
      // If search looks like an orderId
      if (/^[a-zA-Z0-9]+$/.test(search)) {
        query.$or = [
          { orderId: { $regex: search, $options: 'i' } }
        ];
      } else {
        // Look for matches in user email or location
        const users = await User.find({ 
          email: { $regex: search, $options: 'i' } 
        }).select('_id');
        
        const userIds = users.map(user => user._id);
        
        query.$or = [
          { location: { $regex: search, $options: 'i' } },
          { userIds: { $in: userIds } }
        ];
      }
    }
    
    // Prepare sort
    const sortOptions = {};
    sortOptions[sort] = direction === 'asc' ? 1 : -1;
    
    // If exporting, get all orders
    if (exportData === 'csv') {
      // Get all orders that match the query
      const orders = await Order.find(query)
        .sort(sortOptions)
        .lean();
      
      // Fetch user emails for the orders
      const userIds = [...new Set(orders.map(order => order.userId))];
      const users = await User.find({ _id: { $in: userIds } }).select('_id email').lean();
      
      // Create a map of user IDs to emails
      const userEmailMap = users.reduce((map, user) => {
        map[user._id.toString()] = user.email;
        return map;
      }, {});
      
      // Add user email to each order
      const ordersWithEmail = orders.map(order => {
        const userEmail = userEmailMap[order.userId?.toString()] || 'N/A';
        return { ...order, userEmail };
      });
      
      // Convert to CSV format
      // In a real application, you would use a proper CSV library
      const headers = [
        'Order ID', 'Date', 'User Email', 'Location', 'Package', 
        'Amount', 'Status', 'Payment Status'
      ].join(',');
      
      const rows = ordersWithEmail.map(order => [
        order.orderId,
        new Date(order.createdAt).toISOString(),
        order.userEmail,
        order.location,
        order.packageName,
        (order.finalPrice / 100).toFixed(2),
        order.orderStatus,
        order.paymentStatus
      ].join(','));
      
      const csv = [headers, ...rows].join('\n');
      
      // Return CSV as a downloadable file
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="orders-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }
    
    // Get orders with pagination for normal request
    const orders = await Order.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Count total orders for pagination
    const total = await Order.countDocuments(query);
    
    // Fetch user emails for the orders
    const userIds = [...new Set(orders.map(order => order.userId))];
    const users = await User.find({ _id: { $in: userIds } }).select('_id email').lean();
    
    // Create a map of user IDs to emails
    const userEmailMap = users.reduce((map, user) => {
      map[user._id.toString()] = user.email;
      return map;
    }, {});
    
    // Add user email to each order
    const ordersWithEmail = orders.map(order => {
      const userEmail = userEmailMap[order.userId?.toString()] || 'N/A';
      return { ...order, userEmail };
    });
    
    return NextResponse.json({
      orders: ordersWithEmail,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Orders API error:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}