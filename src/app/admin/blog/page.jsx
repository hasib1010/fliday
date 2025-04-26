'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminBlogPage() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { data: session, status } = useSession();
    const router = useRouter();

    // Fetch blogs on mount
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.role === 'admin') {
            fetchBlogs();
        } else if (status === 'unauthenticated' || (session && session.user.role !== 'admin')) {
            router.push('/auth/signin');
        }
    }, [status, session, router]);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/blogs', {
                headers: {
                    Authorization: `Bearer ${session?.accessToken}`,
                },
            });
            if (!res.ok) {
                throw new Error('Failed to fetch blogs');
            }
            const data = await res.json();
            setBlogs(data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this blog post?')) return;

        try {
            const res = await fetch(`/api/admin/blogs/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${session?.accessToken}`,
                },
            });
            if (!res.ok) {
                throw new Error('Failed to delete blog post');
            }
            setBlogs(blogs.filter((blog) => blog._id !== id));
        } catch (err) {
            setError(err.message);
        }
    };

    if (status === 'loading' || loading) {
        return( <AdminLayout>
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F15A25]"></div>
            </div>
        </AdminLayout>)
    }

    if (error) {
        return <div className="p-6 text-red-600">{error}</div>;
    }

    if (!session || session.user.role !== 'admin') {
        return null; // Redirect handled in useEffect
    }

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold">Manage Blog Posts</h1>
                    <Link
                        href="/admin/blog/create"
                        className="flex items-center px-4 py-2 bg-[#F15A25] text-white rounded-md hover:bg-[#e04e1a]"
                    >
                        <Plus size={20} className="mr-2" />
                        Create New Post
                    </Link>
                </div>

                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {blogs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        No blog posts found.
                                    </td>
                                </tr>
                            ) : (
                                blogs.map((blog) => (
                                    <tr key={blog._id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{blog.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{blog.category}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(blog.date), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{blog.author.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {blog.featured ? 'Yes' : 'No'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                href={`/admin/blog/edit/${blog._id}`}
                                                className="text-[#F15A25] hover:text-[#e04e1a] mr-4"
                                            >
                                                <Edit size={18} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(blog._id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}