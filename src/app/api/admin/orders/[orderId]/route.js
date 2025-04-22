// app/api/admin/orders/[orderId]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
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
    
    const { orderId } = params;
    
    // Get order details
    const order = await Order.findOne({ orderId }).lean();
    
    if (!order) {
      return new NextResponse(
        JSON.stringify({ message: 'Order not found' }),
        { status: 404 }
      );
    }
    
    // Get user details
    const user = await User.findById(order.userId).select('name email').lean();
    
    // Add user info to order
    const orderWithUserInfo = {
      ...order,
      userName: user?.name || 'Unknown User',
      userEmail: user?.email || 'Unknown Email'
    };
    
    // Add timeline if it doesn't exist
    if (!orderWithUserInfo.timeline) {
      // Create a basic timeline based on order history
      const timeline = [];
      
      // Add order creation event
      timeline.push({
        type: 'created',
        title: 'Order Created',
        timestamp: order.createdAt,
        status: 'pending_payment'
      });
      
      // Add payment event if payment was completed
      if (order.paymentStatus === 'completed') {
        timeline.push({
          type: 'payment',
          title: 'Payment Completed',
          timestamp: order.updatedAt || new Date(order.createdAt.getTime() + 1000),
          status: 'completed'
        });
      }
      
      // Add order completion event if order was completed
      if (order.orderStatus === 'completed' && order.completedAt) {
        timeline.push({
          type: 'status_change',
          title: 'Order Completed',
          timestamp: order.completedAt,
          status: 'completed'
        });
      }
      
      // Add failure event if order failed
      if (order.orderStatus === 'failed') {
        timeline.push({
          type: 'status_change',
          title: 'Order Failed',
          timestamp: order.updatedAt || new Date(order.createdAt.getTime() + 2000),
          status: 'failed',
          note: order.failureReason || 'No failure reason provided'
        });
      }
      
      orderWithUserInfo.timeline = timeline;
    }
    
    return NextResponse.json(orderWithUserInfo);
  } catch (error) {
    console.error('Order Detail API error:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}

// Update order status endpoint
export async function PUT(request, { params }) {
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
    
    const { orderId } = params;
    const body = await request.json();
    
    // Check if it's a full update or just a status update
    if (body.status) {
      // Status update 
      const { status, note } = body;
      
      // Validate status
      const validStatuses = ['pending_payment', 'processing', 'completed', 'failed'];
      if (!validStatuses.includes(status)) {
        return new NextResponse(
          JSON.stringify({ message: 'Invalid status value' }),
          { status: 400 }
        );
      }
      
      // Get order details
      const order = await Order.findOne({ orderId });
      
      if (!order) {
        return new NextResponse(
          JSON.stringify({ message: 'Order not found' }),
          { status: 404 }
        );
      }
      
      // Update order status
      const updates = {
        orderStatus: status,
        updatedAt: new Date()
      };
      
      // Set completedAt if status is completed
      if (status === 'completed' && !order.completedAt) {
        updates.completedAt = new Date();
      }
      
      // Add the status change to timeline
      const newTimelineEvent = {
        type: 'status_change',
        title: `Order Status Changed to ${status.replace('_', ' ')}`,
        timestamp: new Date(),
        status: status,
        note: note || undefined
      };
      
      // Initialize timeline if it doesn't exist
      if (!order.timeline) {
        updates.timeline = [newTimelineEvent];
      } else {
        // Use MongoDB array operator to append to existing timeline
        await Order.updateOne(
          { orderId },
          { $push: { timeline: newTimelineEvent } }
        );
      }
      
      // Update order
      await Order.updateOne({ orderId }, { $set: updates });
      
      // Get updated order
      const updatedOrder = await Order.findOne({ orderId }).lean();
      
      return NextResponse.json(updatedOrder);
    } else {
      // Full order update
      // This would handle other types of updates beyond just status changes
      // For example, if we need to update other order fields in the future
      
      // For now, return error since we only support status updates
      return new NextResponse(
        JSON.stringify({ message: 'Only status updates are supported' }),
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Order Update API error:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}