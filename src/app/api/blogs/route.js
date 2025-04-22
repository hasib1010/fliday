import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Blog from '@/models/Blog';

export async function GET() {
  try {
    await dbConnect();
    const blogs = await Blog.find({}).sort({ date: -1 });
    return NextResponse.json(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}