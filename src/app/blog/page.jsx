// app/blog/page.js
import Blog from '@/components/Blog/Blog';

export const metadata = {
  title: 'Blog | Fliday',
  description: 'Read the latest articles about eSIMs, travel tips, and technology from Fliday.',
};

export default function BlogPage() {
  return <Blog />;
}