// app/api/admin/users/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Order from '@/models/Order';

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
    const sort = searchParams.get('sort') || 'lastLogin';
    const direction = searchParams.get('direction') || 'desc';
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const exportData = searchParams.get('export');
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    // Build query
    let query = {};
    
    // Role filter
    if (role && role !== 'all') {
      query.role = role;
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Prepare sort
    const sortOptions = {};
    sortOptions[sort] = direction === 'asc' ? 1 : -1;
    
    // If exporting, get all users
    if (exportData === 'csv') {
      // Get all users that match the query
      const users = await User.find(query)
        .sort(sortOptions)
        .lean();
      
      // Convert to CSV format
      // In a real application, you would use a proper CSV library
      const headers = [
        'User ID', 'Name', 'Email', 'Role', 'Provider', 
        'Joined Date', 'Last Login', 'Phone Number'
      ].join(',');
      
      const rows = users.map(user => [
        user._id,
        `"${user.name.replace(/"/g, '""')}"`,
        user.email,
        user.role,
        user.provider,
        user.createdAt ? new Date(user.createdAt).toISOString() : '',
        user.lastLogin ? new Date(user.lastLogin).toISOString() : '',
        user.phoneNumber || ''
      ].join(','));
      
      const csv = [headers, ...rows].join('\n');
      
      // Return CSV as a downloadable file
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }
    
    // Get users with pagination for normal request
    const users = await User.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Count total users for pagination
    const total = await User.countDocuments(query);
    
    return NextResponse.json({
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Users API error:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}