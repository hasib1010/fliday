// app/api/topups/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import TopUp from '@/models/TopUp';
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

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order ID is required' 
      }, { status: 400 });
    }

    // Find all top-ups for this order
    const topUps = await TopUp.find({ 
      orderId,
      userId: user._id,
      topUpStatus: 'completed' // Only show completed top-ups
    }).sort({ createdAt: -1 }); // Latest first

    return NextResponse.json({
      success: true,
      topUps: topUps.map(topUp => ({
        topUpId: topUp.topUpId,
        packageName: topUp.packageName,
        dataAmount: topUp.dataAmount,
        duration: topUp.duration,
        price: topUp.finalPrice,
        currency: topUp.currency,
        createdAt: topUp.createdAt,
        completedAt: topUp.completedAt,
        // Include additional fields if needed
        providerResponse: topUp.providerResponse
      }))
    });
  } catch (error) {
    console.error('Error fetching top-ups:', error.stack);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to fetch top-up history' 
    }, { status: 500 });
  }
}