// app/api/admin/users/[userId]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Order from '@/models/Order';
import TopUp from '@/models/TopUp';
import mongoose from 'mongoose';

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
    
    const { userId } = params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return new NextResponse(
        JSON.stringify({ message: 'Invalid user ID format' }),
        { status: 400 }
      );
    }
    
    // Get user details
    const user = await User.findById(userId).lean();
    
    if (!user) {
      return new NextResponse(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }
    
    // Get user's orders
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
      
    // Get user's top-ups
    const topUps = await TopUp.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    
    // Combine orders and top-ups
    const allTransactions = [
      ...orders.map(order => ({
        ...order,
        type: 'order'
      })),
      ...topUps.map(topUp => ({
        orderId: topUp.topUpId,
        createdAt: topUp.createdAt,
        packageName: topUp.packageName,
        location: topUp.location,
        finalPrice: topUp.finalPrice,
        orderStatus: topUp.topUpStatus,
        type: 'topup'
      }))
    ];
    
    // Sort all transactions by date (most recent first)
    allTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return NextResponse.json({
      user,
      orders: allTransactions
    });
  } catch (error) {
    console.error('User Detail API error:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}

// API for updating user role
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
    
    const { userId } = params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return new NextResponse(
        JSON.stringify({ message: 'Invalid user ID format' }),
        { status: 400 }
      );
    }
    
    // Prevent modifying own role
    if (session.user.id === userId) {
      return new NextResponse(
        JSON.stringify({ message: 'Cannot modify your own role' }),
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { role } = body;
    
    // Validate role
    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
      return new NextResponse(
        JSON.stringify({ message: 'Invalid role value' }),
        { status: 400 }
      );
    }
    
    // Update user role
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).lean();
    
    if (!updatedUser) {
      return new NextResponse(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('User Update API error:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}