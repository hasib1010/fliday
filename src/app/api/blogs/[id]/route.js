import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Blog from '@/models/Blog';

// Utility to validate slug
const isValidSlug = (slug) => {
  // Enforce lowercase, alphanumeric, hyphens only, non-empty
  return typeof slug === 'string' && /^[a-z0-9-]+$/i.test(slug) && slug.trim().length > 0;
};

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params; // Await params to resolve the id

    if (!id || !isValidSlug(id)) {
      return NextResponse.json(
        { error: 'Invalid slug format' },
        { status: 400 }
      );
    }

    // Normalize slug to lowercase to match BlogSchema
    const normalizedSlug = id.toLowerCase();
    const blog = await Blog.findOne({ slug: normalizedSlug }).lean();

    if (!blog) {
      return NextResponse.json(
        { error: 'Blog not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { data: blog },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching blog:', {
      slug: id,
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}