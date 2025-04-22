import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Blog from '@/models/Blog';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params; // Await params to resolve the id
    const blog = await Blog.findOne({ slug: id });
    if (!blog) {
      return NextResponse.json({ message: 'Blog not found' }, { status: 404 });
    }
    return NextResponse.json(blog);
  } catch (error) {
    console.error('Error fetching blog:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}