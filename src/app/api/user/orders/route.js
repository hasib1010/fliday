import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    await dbConnect();

    // Find the user based on the session
    const user = await User.findOne({
      $or: [
        { _id: session.user.id },
        { email: session.user.email }
      ]
    });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query object
    const query = { userId: user._id };
    
    if (status) {
      query.orderStatus = status;
    }

    // Get total count
    const totalOrders = await Order.countDocuments(query);
    
    // Fetch orders with pagination and sorting
    const orders = await Order.find(query)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Calculate pagination info
    const totalPages = Math.ceil(totalOrders / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        total: totalOrders,
        page,
        limit,
        totalPages,
        hasMore
      }
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to fetch orders' 
    }, { status: 500 });
  }
}