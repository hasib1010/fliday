import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Blog from '@/models/Blog';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const blog = await Blog.findById(params.id);
    if (!blog) {
      return NextResponse.json({ message: 'Blog not found' }, { status: 404 });
    }
    return NextResponse.json(blog);
  } catch (error) {
    console.error('Error fetching blog:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    await dbConnect();

    // Check if slug is unique (excluding current blog)
    const existingBlog = await Blog.findOne({ slug: data.slug, _id: { $ne: params.id } });
    if (existingBlog) {
      return NextResponse.json({ message: 'Slug already exists' }, { status: 400 });
    }

    const blog = await Blog.findByIdAndUpdate(params.id, data, { new: true, runValidators: true });
    if (!blog) {
      return NextResponse.json({ message: 'Blog not found' }, { status: 404 });
    }
    return NextResponse.json(blog);
  } catch (error) {
    console.error('Error updating blog:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const blog = await Blog.findByIdAndDelete(params.id);
    if (!blog) {
      return NextResponse.json({ message: 'Blog not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}