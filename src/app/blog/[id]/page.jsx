// app/blog/[id]/page.js
import BlogDetail from '@/components/Blog/BlogDetail';

export async function generateMetadata({ params }) {
  // In a real app, you would fetch the blog post data based on params.id
  // For this example, we'll use a static title
  return {
    title: 'How Sally helps you save mobile data | Fliday Blog',
    description: 'Learn how to save on mobile data when traveling with these expert tips from Fliday.',
  };
}

export default function BlogDetailPage({ params }) {
  return <BlogDetail params={params} />;
}