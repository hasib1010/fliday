import BlogDetail from '@/components/Blog/BlogDetail';
import { notFound } from 'next/navigation';

// Utility to validate slug
const isValidSlug = (slug) => {
  // Enforce lowercase, alphanumeric, hyphens only, non-empty
  return typeof slug === 'string' && /^[a-z0-9-]+$/i.test(slug) && slug.trim().length > 0;
};

// Fetch blog data
async function fetchBlog(slug) {
  try {
    // Normalize slug to lowercase to match BlogSchema
    const normalizedSlug = slug.toLowerCase();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/blogs/${encodeURIComponent(normalizedSlug)}`,
      {
        next: { revalidate: 60 }, // Leverage ISR with 60-second revalidation
      }
    );
    if (!response.ok) {
      throw new Error('Failed to fetch blog');
    }
    const { data } = await response.json(); // Extract data from { data: blog }
    if (!data) {
      throw new Error('Blog not found');
    }
    return data;
  } catch (error) {
    console.error('fetchBlog: Error:', error.message);
    throw error;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params; // Await params to resolve id
  if (!id || !isValidSlug(id)) {
    return {
      title: 'Blog Post Not Found | Fliday Blog',
      description: 'The requested blog post could not be found.',
    };
  }

  try {
    const blog = await fetchBlog(id);
    return {
      title: `${blog.title} | Fliday Blog`,
      description: blog.excerpt || 'Read the latest insights and tips from Fliday.',
      openGraph: {
        title: blog.title,
        description: blog.excerpt,
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog/${blog.slug}`,
        images: [blog.featuredImage],
        type: 'article',
        publishedTime: blog.date,
        authors: [blog.author?.name || 'Unknown Author'],
      },
      twitter: {
        card: 'summary_large_image',
        title: blog.title,
        description: blog.excerpt,
        images: [blog.featuredImage],
      },
    };
  } catch (error) {
    return {
      title: 'Blog Post Not Found | Fliday Blog',
      description: 'The requested blog post could not be found.',
    };
  }
}

// Enable ISR for better performance
export const revalidate = 60; // Revalidate every 60 seconds

export default async function BlogDetailPage({ params }) {
  const { id } = await params; // Await params to resolve id
  if (!id || !isValidSlug(id)) {
    notFound(); // Redirect to 404 page
  }

  let blog = null;
  let error = null;

  try {
    blog = await fetchBlog(id);
  } catch (err) {
    error = err.message;
  }

  if (!blog) {
    notFound(); // Redirect to 404 page if blog is not found
  }

  return <BlogDetail initialBlog={blog} initialError={error} />;
}