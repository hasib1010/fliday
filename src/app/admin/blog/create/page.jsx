'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import AdminLayout from '@/components/admin/AdminLayout';

export default function CreateBlogPage() {
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        featuredImage: '',
        category: 'eSim',
        content: [{ id: '', heading: '', content: '' }],
        author: { name: '', image: '' },
        date: format(new Date(), 'yyyy-MM-dd'),
        readTime: '',
        featured: false,
        relatedArticles: [],
    });
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState({ featuredImage: false, authorImage: false });
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.role !== 'admin') {
            router.push('/auth/signin');
        }
    }, [status, session, router]);

    const handleInputChange = (e, index = null, field = null) => {
        const { name, value, type, checked } = e.target;
        if (index !== null && field) {
            const updatedContent = [...formData.content];
            updatedContent[index][field] = value;
            setFormData({ ...formData, content: updatedContent });
        } else if (name.startsWith('author.')) {
            const authorField = name.split('.')[1];
            setFormData({
                ...formData,
                author: { ...formData.author, [authorField]: value },
            });
        } else {
            setFormData({
                ...formData,
                [name]: type === 'checkbox' ? checked : value,
            });
        }
    };

    const handleFileUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        console.log('Cloud Name:', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
        console.log('Upload Preset:', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

        setUploading({ ...uploading, [field]: true });
        setError(null);

        try {
            const uploadData = new FormData();
            uploadData.append('file', file);
            uploadData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: uploadData,
                }
            );

            if (!res.ok) {
                const errorData = await res.json();
                console.error('Cloudinary Error:', errorData);
                throw new Error(`Failed to upload image: ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await res.json();
            if (field === 'featuredImage') {
                setFormData({ ...formData, featuredImage: data.secure_url });
            } else if (field === 'authorImage') {
                setFormData({ ...formData, author: { ...formData.author, image: data.secure_url } });
            }
        } catch (err) {
            setError('Failed to upload image: ' + err.message);
        } finally {
            setUploading({ ...uploading, [field]: false });
        }
    };

    const addContentSection = () => {
        setFormData({
            ...formData,
            content: [...formData.content, { id: '', heading: '', content: '' }],
        });
    };

    const removeContentSection = (index) => {
        if (formData.content.length === 1) return;
        const updatedContent = formData.content.filter((_, i) => i !== index);
        setFormData({ ...formData, content: updatedContent });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/admin/blogs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify({ ...formData, createdBy: session?.user?.id }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to create blog post');
            }

            router.push('/admin/blog');
        } catch (err) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    if (status === 'loading') {
        return <div className="p-6">Loading...</div>;
    }

    if (!session || session.user.role !== 'admin') {
        return null;
    }

    return (
        <AdminLayout>
            <div className="p-6 max-w-4xl mx-auto">
                <h1 className="text-2xl font-semibold mb-6">Create Blog Post</h1>
                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
                    {error && <div className="text-red-600">{error}</div>}

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Slug</label>
                        <input
                            type="text"
                            name="slug"
                            value={formData.slug}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Excerpt</label>
                        <textarea
                            name="excerpt"
                            value={formData.excerpt}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            rows="4"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Featured Image</label>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif"
                            onChange={(e) => handleFileUpload(e, 'featuredImage')}
                            className="mt-1 block w-full"
                            disabled={uploading.featuredImage}
                        />
                        {uploading.featuredImage && <p className="text-sm text-gray-500">Uploading...</p>}
                        {formData.featuredImage && (
                            <div className="mt-2">
                                <img
                                    src={formData.featuredImage}
                                    alt="Featured Image Preview"
                                    className="h-32 w-auto rounded-md"
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            required
                        >
                            {['eSim', 'Guides', 'Travel', 'Tech', 'News', 'Other'].map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Content Sections</label>
                        {formData.content.map((section, index) => (
                            <div key={index} className="mt-4 p-4 border rounded-md">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Section ID</label>
                                    <input
                                        type="text"
                                        value={section.id}
                                        onChange={(e) => handleInputChange(e, index, 'id')}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Section Heading</label>
                                    <input
                                        type="text"
                                        value={section.heading}
                                        onChange={(e) => handleInputChange(e, index, 'heading')}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Section Content</label>
                                    <textarea
                                        value={section.content}
                                        onChange={(e) => handleInputChange(e, index, 'content')}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        rows="6"
                                        required
                                    />
                                </div>
                                {formData.content.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeContentSection(index)}
                                        className="mt-2 text-red-600 hover:text-red-800"
                                    >
                                        Remove Section
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addContentSection}
                            className="mt-2 text-[#F15A25] hover:text-[#e04e1a]"
                        >
                            Add Content Section
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Author Name</label>
                        <input
                            type="text"
                            name="author.name"
                            value={formData.author.name}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Author Image</label>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif"
                            onChange={(e) => handleFileUpload(e, 'authorImage')}
                            className="mt-1 block w-full"
                            disabled={uploading.authorImage}
                        />
                        {uploading.authorImage && <p className="text-sm text-gray-500">Uploading...</p>}
                        {formData.author.image && (
                            <div className="mt-2">
                                <img
                                    src={formData.author.image}
                                    alt="Author Image Preview"
                                    className="h-16 w-16 rounded-full"
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Publication Date</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Read Time</label>
                        <input
                            type="text"
                            name="readTime"
                            value={formData.readTime}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            required
                            placeholder="e.g., 6 min read"
                        />
                    </div>

                    <div>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="featured"
                                checked={formData.featured}
                                onChange={handleInputChange}
                                className="rounded border-gray-300 text-[#F15A25] shadow-sm"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">Featured Post</span>
                        </label>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting || uploading.featuredImage || uploading.authorImage}
                            className={`px-6 py-2 rounded-md text-white ${submitting || uploading.featuredImage || uploading.authorImage
                                ? 'bg-gray-400'
                                : 'bg-[#F15A25] hover:bg-[#e04e1a]'
                                }`}
                        >
                            {submitting ? 'Creating...' : 'Create Post'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}