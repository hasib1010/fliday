// app/api/topup/details/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import TopUp from '@/models/TopUp';
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

    // Get the topUpId from query params
    const { searchParams } = new URL(request.url);
    const topUpId = searchParams.get('topUpId');

    if (!topUpId) {
      return NextResponse.json({ 
        success: false, 
        error: 'TopUp ID is required' 
      }, { status: 400 });
    }

    await dbConnect();

    // Find the user
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

    // Find the topUp record
    const topUp = await TopUp.findOne({ 
      topUpId,
      userId: user._id
    }).lean();

    if (!topUp) {
      return NextResponse.json({ 
        success: false, 
        error: 'TopUp not found' 
      }, { status: 404 });
    }

    // Get the related original order
    const order = await Order.findOne({
      orderId: topUp.orderId,
      userId: user._id
    }).lean();

    return NextResponse.json({
      success: true,
      topUp,
      order
    });
  } catch (error) {
    console.error('Error fetching topUp details:', error.stack);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to fetch topUp details' 
    }, { status: 500 });
  }
}