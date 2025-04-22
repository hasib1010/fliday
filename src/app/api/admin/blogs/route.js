import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Blog from '@/models/Blog';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const blogs = await Blog.find({}).sort({ createdAt: -1 });
    return NextResponse.json(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    await dbConnect();

    // Validate createdBy
    const user = await User.findById(data.createdBy);
    if (!user) {
      return NextResponse.json({ message: 'Invalid user' }, { status: 400 });
    }

    // Ensure unique slug
    const existingBlog = await Blog.findOne({ slug: data.slug });
    if (existingBlog) {
      return NextResponse.json({ message: 'Slug already exists' }, { status: 400 });
    }

    const blog = await Blog.create(data);
    return NextResponse.json(blog, { status: 201 });
  } catch (error) {
    console.error('Error creating blog:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}