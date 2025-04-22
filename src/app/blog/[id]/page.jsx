import BlogDetail from '@/components/Blog/BlogDetail';

export async function generateMetadata({ params }) {
  console.log('generateMetadata: params.id:', params.id);
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/blogs/${params.id}`, {
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Failed to fetch blog');
    const blog = await response.json();
    return {
      title: `${blog.title} | Fliday Blog`,
      description: blog.excerpt || 'Read the latest insights and tips from Fliday.',
      openGraph: {
        title: blog.title,
        description: blog.excerpt,
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog/${params.id}`,
        images: [blog.featuredImage],
        type: 'article',
        publishedTime: blog.date,
        authors: [blog.author.name],
      },
      twitter: {
        card: 'summary_large_image',
        title: blog.title,
        description: blog.excerpt,
        images: [blog.featuredImage],
      },
    };
  } catch (error) {
    console.error('generateMetadata: Error:', error);
    return {
      title: 'Blog Post | Fliday Blog',
      description: 'Learn how to save on mobile data when traveling with these expert tips from Fliday.',
    };
  }
}

// Optional: Enable ISR for better performance
export const revalidate = 60; // Revalidate every 60 seconds

export default async function BlogDetailPage({ params }) {
  console.log('BlogDetailPage: params:', params);
  if (!params || !params.id) {
    console.error('BlogDetailPage: Invalid params');
    return <div>Invalid blog ID</div>;
  }

  let blog = null;
  let error = null;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/blogs/${params.id}`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch blog');
    }
    blog = await response.json();
  } catch (err) {
    console.error('BlogDetailPage: Fetch error:', err.message);
    error = err.message;
  }

  return <BlogDetail params={params} initialBlog={blog} initialError={error} />;
}