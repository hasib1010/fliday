// app/api/admin/topups/[topUpId]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import TopUp from '@/models/TopUp';
import User from '@/models/User';

export async function GET(request, { params }) {
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
    
    const { topUpId } = params;
    
    // Get topUp details
    const topUp = await TopUp.findOne({ topUpId }).lean();
    
    if (!topUp) {
      return new NextResponse(
        JSON.stringify({ message: 'Top-up not found' }),
        { status: 404 }
      );
    }
    
    // Get user details
    const user = await User.findById(topUp.userId).select('name email').lean();
    
    // Add user info to topUp
    const topUpWithUserInfo = {
      ...topUp,
      userName: user?.name || 'Unknown User',
      userEmail: user?.email || 'Unknown Email'
    };
    
    // Add timeline if it doesn't exist
    if (!topUpWithUserInfo.timeline) {
      // Create a basic timeline based on topUp history
      const timeline = [];
      
      // Add topUp creation event
      timeline.push({
        type: 'created',
        title: 'Top-up Created',
        timestamp: topUp.createdAt,
        status: 'pending'
      });
      
      // Add payment event if payment was completed
      if (topUp.paymentStatus === 'completed') {
        timeline.push({
          type: 'payment',
          title: 'Payment Completed',
          timestamp: topUp.updatedAt || new Date(topUp.createdAt.getTime() + 1000),
          status: 'completed'
        });
      }
      
      // Add topUp completion event if topUp was completed
      if (topUp.topUpStatus === 'completed' && topUp.completedAt) {
        timeline.push({
          type: 'status_change',
          title: 'Top-up Completed',
          timestamp: topUp.completedAt,
          status: 'completed'
        });
      }
      
      // Add failure event if topUp failed
      if (topUp.topUpStatus === 'failed') {
        timeline.push({
          type: 'status_change',
          title: 'Top-up Failed',
          timestamp: topUp.updatedAt || new Date(topUp.createdAt.getTime() + 2000),
          status: 'failed',
          note: topUp.failureReason || 'No failure reason provided'
        });
      }
      
      topUpWithUserInfo.timeline = timeline;
    }
    
    return NextResponse.json(topUpWithUserInfo);
  } catch (error) {
    console.error('Top-up Detail API error:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}