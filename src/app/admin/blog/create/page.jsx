'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    X, Plus, Eye, Save, FilePlus, Image as ImageIcon, Bold, Italic, List,
    AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Heading3,
    Code, Quote, Link as LinkIcon, ImagePlus, ListOrdered
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';

// Dynamically import the EditorComponent with SSR disabled
const EditorComponent = dynamic(
    () => import('@/components/editor/EditorComponent'),
    { ssr: false }
);

export default function CreateBlogPost() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [uploading, setUploading] = useState({ featuredImage: false, authorImage: false });
    const [viewMode, setViewMode] = useState({});
    const [editors, setEditors] = useState({});
    const [editorsMounted, setEditorsMounted] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        featuredImage: '',
        category: 'Travel',
        content: [
            {
                heading: 'Introduction',
                id: 'section1',
                content: ''
            }
        ],
        author: {
            name: '',
            image: ''
        },
        date: format(new Date(), 'yyyy-MM-dd'),
        readTime: '1 min',
        featured: false,
        relatedArticles: []
    });

    // Check authentication
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.role === 'admin') {
            setFormData(prev => ({
                ...prev,
                author: {
                    ...prev.author,
                    name: session.user.name || '',
                    image: session.user.image || ''
                }
            }));
        } else if (status === 'unauthenticated' || (session && session.user.role !== 'admin')) {
            router.push('/auth/signin');
        }
    }, [status, session, router]);

    // Auto-generate slug from title
    useEffect(() => {
        if (formData.title) {
            const slug = formData.title
                .toLowerCase()
                .replace(/[^\w\s]/gi, '')
                .replace(/\s+/g, '-');
            setFormData(prev => ({ ...prev, slug }));
        }
    }, [formData.title]);

    // Calculate read time
    useEffect(() => {
        let totalWords = 0;
        totalWords += countWords(formData.title);
        totalWords += countWords(formData.excerpt);

        formData.content.forEach(section => {
            totalWords += countWords(section.heading);
            totalWords += countWords(stripHtml(section.content));
        });

        const minutes = Math.max(1, Math.ceil(totalWords / 225));
        const readTimeStr = `${minutes} min${minutes !== 1 ? 's' : ''}`;
        setFormData(prev => ({ ...prev, readTime: readTimeStr }));
    }, [formData.title, formData.excerpt, formData.content]);

    // Get editor instances from registry
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const checkForEditors = () => {
                if (window.editorRegistry) {
                    setEditors(window.editorRegistry);
                    setEditorsMounted(true);
                }
            };

            checkForEditors();
            const interval = setInterval(checkForEditors, 300);
            return () => clearInterval(interval);
        }
    }, [formData.content.length]);

    const countWords = (text) => {
        if (!text) return 0;
        return text.trim().split(/\s+/).length;
    };

    const stripHtml = (html) => {
        if (!html) return '';
        if (typeof document !== 'undefined') {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            return tempDiv.textContent || tempDiv.innerText || '';
        }
        return html.replace(/<[^>]*>/g, '');
    };

    const toggleViewMode = (sectionIndex) => {
        setViewMode(prev => ({
            ...prev,
            [sectionIndex]: !prev[sectionIndex]
        }));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith('author.')) {
            const authorField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                author: { ...prev.author, [authorField]: value }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSectionHeadingChange = (e, index) => {
        const { value } = e.target;
        const updatedContent = [...formData.content];
        updatedContent[index].heading = value;
        setFormData(prev => ({ ...prev, content: updatedContent }));
    };

    const addSection = () => {
        const newSectionId = `section${formData.content.length + 1}`;
        setFormData(prev => ({
            ...prev,
            content: [
                ...prev.content,
                {
                    heading: 'New Section',
                    id: newSectionId,
                    content: ''
                }
            ]
        }));
    };

    const removeSection = (index) => {
        if (formData.content.length <= 1) {
            setError('Cannot remove the last section');
            return;
        }

        const updatedContent = formData.content.filter((_, i) => i !== index);
        const renumberedContent = updatedContent.map((section, i) => ({
            ...section,
            id: `section${i + 1}`
        }));

        setFormData(prev => ({ ...prev, content: renumberedContent }));

        const newEditors = { ...editors };
        delete newEditors[index];
        const adjustedEditors = {};

        Object.keys(newEditors).forEach(key => {
            const keyIndex = parseInt(key);
            if (keyIndex < index) {
                adjustedEditors[keyIndex] = newEditors[keyIndex];
            } else if (keyIndex > index) {
                adjustedEditors[keyIndex - 1] = newEditors[keyIndex];
            }
        });

        setEditors(adjustedEditors);

        const newViewMode = {};
        Object.keys(viewMode).forEach(key => {
            const keyIndex = parseInt(key);
            if (keyIndex < index) {
                newViewMode[keyIndex] = viewMode[keyIndex];
            } else if (keyIndex > index) {
                newViewMode[keyIndex - 1] = viewMode[keyIndex];
            }
        });
        setViewMode(newViewMode);
    };

    const handleImageUpload = async (index) => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (file && editors[index]) {
                try {
                    setUploading(prev => ({ ...prev, [`content-image-${index}`]: true }));

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
                        throw new Error(`Failed to upload image: ${errorData.error?.message || 'Unknown error'}`);
                    }

                    const data = await res.json();

                    if (editors[index]) {
                        editors[index].chain().focus().setImage({ src: data.secure_url }).run();
                    }
                } catch (err) {
                    setError('Failed to upload image: ' + err.message);
                } finally {
                    setUploading(prev => ({ ...prev, [`content-image-${index}`]: false }));
                }
            }
        };
    };

    const handleFileUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(prev => ({ ...prev, [field]: true }));
        setError('');

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
                throw new Error(`Failed to upload image: ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await res.json();

            if (field === 'featuredImage') {
                setFormData(prev => ({ ...prev, featuredImage: data.secure_url }));
            } else if (field === 'authorImage') {
                setFormData(prev => ({
                    ...prev,
                    author: { ...prev.author, image: data.secure_url }
                }));
            }
        } catch (err) {
            setError('Failed to upload image: ' + err.message);
        } finally {
            setUploading(prev => ({ ...prev, [field]: false }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            // Validate required fields
            if (!formData.title) {
                throw new Error('Please provide a title');
            }
            if (!formData.slug) {
                throw new Error('Please provide a slug');
            }
            if (!formData.excerpt) {
                throw new Error('Please provide an excerpt');
            }
            if (!formData.featuredImage) {
                throw new Error('Please provide a featured image');
            }
            if (!formData.author.name) {
                throw new Error('Please provide an author name');
            }
            if (!formData.author.image) {
                throw new Error('Please provide an author image');
            }
            if (!formData.date) {
                throw new Error('Please provide a publication date');
            }
            if (!formData.readTime) {
                throw new Error('Please provide an estimated read time');
            }
            for (const [index, section] of formData.content.entries()) {
                if (!section.heading) {
                    throw new Error(`Please provide a heading for section ${index + 1}`);
                }
                if (!section.id) {
                    throw new Error(`Please provide an ID for section ${index + 1}`);
                }
                if (!section.content) {
                    throw new Error(`Please provide content for section ${index + 1}`);
                }
            }

            const blogData = {
                ...formData,
                createdBy: session.user.id
            };

            const response = await fetch('/api/admin/blogs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.accessToken}`
                },
                body: JSON.stringify(blogData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create blog post');
            }

            setSuccess('Blog post created successfully!');
            setTimeout(() => {
                router.push('/admin/blog');
            }, 2000);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const RichTextPreview = ({ content }) => {
        return (
            <div
                className="min-h-[300px] border border-gray-300 rounded-md p-6 bg-white prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    };

    const EditorMenuBar = ({ editor, index }) => {
        if (!editor) {
            return null;
        }

        return (
            <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <div className="flex gap-1 mr-2 border-r border-gray-300 pr-2">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={`p-1.5 text-sm ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : 'bg-white'} border border-gray-300 rounded hover:bg-gray-100 flex items-center`}
                        title="Heading 1"
                    >
                        <Heading1 size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={`p-1.5 text-sm ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : 'bg-white'} border border-gray-300 rounded hover:bg-gray-100 flex items-center`}
                        title="Heading 2"
                    >
                        <Heading2 size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={`p-1.5 text-sm ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : 'bg-white'} border border-gray-300 rounded hover:bg-gray-100 flex items-center`}
                        title="Heading 3"
                    >
                        <Heading3 size={16} />
                    </button>
                </div>

                <div className="flex gap-1 mr-2 border-r border-gray-300 pr-2">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`p-1.5 text-sm ${editor.isActive('bold') ? 'bg-gray-200' : 'bg-white'} border border-gray-300 rounded hover:bg-gray-100 flex items-center`}
                        title="Bold"
                    >
                        <Bold size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`p-1.5 text-sm ${editor.isActive('italic') ? 'bg-gray-200' : 'bg-white'} border border-gray-300 rounded hover:bg-gray-100 flex items-center`}
                        title="Italic"
                    >
                        <Italic size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const url = window.prompt('URL:');
                            if (url) {
                                editor.chain().focus().setLink({ href: url }).run();
                            }
                        }}
                        className={`p-1.5 text-sm ${editor.isActive('link') ? 'bg-gray-200' : 'bg-white'} border border-gray-300 rounded hover:bg-gray-100 flex items-center`}
                        title="Link"
                    >
                        <LinkIcon size={16} />
                    </button>
                </div>

                <div className="flex gap-1 mr-2 border-r border-gray-300 pr-2">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`p-1.5 text-sm ${editor.isActive('bulletList') ? 'bg-gray-200' : 'bg-white'} border border-gray-300 rounded hover:bg-gray-100 flex items-center`}
                        title="Bullet List"
                    >
                        <List size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`p-1.5 text-sm ${editor.isActive('orderedList') ? 'bg-gray-200' : 'bg-white'} border border-gray-300 rounded hover:bg-gray-100 flex items-center`}
                        title="Numbered List"
                    >
                        <ListOrdered size={16} />
                    </button>
                </div>

                <div className="flex gap-1 mr-2 border-r border-gray-300 pr-2">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        className={`p-1.5 text-sm ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : 'bg-white'} border border-gray-300 rounded hover:bg-gray-100 flex items-center`}
                        title="Align Left"
                    >
                        <AlignLeft size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        className={`p-1.5 text-sm ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : 'bg-white'} border border-gray-300 rounded hover:bg-gray-100 flex items-center`}
                        title="Align Center"
                    >
                        <AlignCenter size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        className={`p-1.5 text-sm ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : 'bg-white'} border border-gray-300 rounded hover:bg-gray-100 flex items-center`}
                        title="Align Right"
                    >
                        <AlignRight size={16} />
                    </button>
                </div>

                <div className="flex gap-1 mr-2 border-r border-gray-300 pr-2">
                    <button
                        type="button"
                        onClick={() => handleImageUpload(index)}
                        className="p-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 flex items-center"
                        title="Insert Image"
                    >
                        <ImagePlus size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={`p-1.5 text-sm ${editor.isActive('blockquote') ? 'bg-gray-200' : 'bg-white'} border border-gray-300 rounded hover:bg-gray-100 flex items-center`}
                        title="Quote"
                    >
                        <Quote size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        className={`p-1.5 text-sm ${editor.isActive('codeBlock') ? 'bg-gray-200' : 'bg-white'} border border-gray-300 rounded hover:bg-gray-100 flex items-center`}
                        title="Code Block"
                    >
                        <Code size={16} />
                    </button>
                </div>

                
            </div>
        );
    };

    if (status === 'loading') {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F15A25]"></div>
                </div>
            </AdminLayout>
        );
    }

    if (!session || session.user.role !== 'admin') {
        return null;
    }

    return (
        <AdminLayout>
            <div className="p-6 max-w-6xl mx-auto bg-gray-50">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold">Create New Blog Post</h1>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => router.push('/admin/blog')}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center"
                        >
                            <X size={18} className="mr-2" />
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isLoading || uploading.featuredImage || uploading.authorImage}
                            className={`px-4 py-2 rounded-md text-white flex items-center ${isLoading || uploading.featuredImage || uploading.authorImage
                                ? 'bg-gray-400'
                                : 'bg-[#F15A25] hover:bg-[#e04e1a]'
                                }`}
                        >
                            <Save size={18} className="mr-2" />
                            {isLoading ? 'Saving...' : 'Save Post'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F15A25]"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                                    Slug <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="slug"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F15A25]"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-1">
                                    Excerpt <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="excerpt"
                                    name="excerpt"
                                    value={formData.excerpt}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F15A25]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Featured Image <span className="text-red-500">*</span>
                                </label>
                                <div className="flex items-center gap-4">
                                    {formData.featuredImage ? (
                                        <div className="relative">
                                            <img
                                                src={formData.featuredImage}
                                                alt="Featured"
                                                className="h-32 w-32 object-cover rounded-md"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, featuredImage: '' }))}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-gray-300 rounded-md h-32 w-32 flex items-center justify-center">
                                            {uploading.featuredImage ? (
                                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#F15A25]"></div>
                                            ) : (
                                                <ImageIcon size={24} className="text-gray-400" />
                                            )}
                                        </div>
                                    )}
                                    <div>
                                        <input
                                            type="file"
                                            id="featuredImage"
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload(e, 'featuredImage')}
                                            className="hidden"
                                            required
                                        />
                                        <label
                                            htmlFor="featuredImage"
                                            className={`px-3 py-2 rounded-md text-sm flex items-center ${uploading.featuredImage
                                                ? 'bg-gray-300 cursor-not-allowed'
                                                : 'bg-[#F15A25] hover:bg-[#e04e1a] text-white cursor-pointer'
                                                }`}
                                        >
                                            <FilePlus size={16} className="mr-2" />
                                            {uploading.featuredImage ? 'Uploading...' : 'Upload Image'}
                                        </label>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Recommended size: 1200x630px
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="author.name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Author Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="author.name"
                                    name="author.name"
                                    value={formData.author.name}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F15A25]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Author Image <span className="text-red-500">*</span>
                                </label>
                                <div className="flex items-center gap-4">
                                    {formData.author.image ? (
                                        <div className="relative">
                                            <img
                                                src={formData.author.image}
                                                alt="Author"
                                                className="h-32 w-32 object-cover rounded-md"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({
                                                    ...prev,
                                                    author: { ...prev.author, image: '' }
                                                }))}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-gray-300 rounded-md h-32 w-32 flex items-center justify-center">
                                            {uploading.authorImage ? (
                                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#F15A25]"></div>
                                            ) : (
                                                <ImageIcon size={24} className="text-gray-400" />
                                            )}
                                        </div>
                                    )}
                                    <div>
                                        <input
                                            type="file"
                                            id="authorImage"
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload(e, 'authorImage')}
                                            className="hidden"
                                            required
                                        />
                                        <label
                                            htmlFor="authorImage"
                                            className={`px-3 py-2 rounded-md text-sm flex items-center ${uploading.authorImage
                                                ? 'bg-gray-300 cursor-not-allowed'
                                                : 'bg-[#F15A25] hover:bg-[#e04e1a] text-white cursor-pointer'
                                                }`}
                                        >
                                            <FilePlus size={16} className="mr-2" />
                                            {uploading.authorImage ? 'Uploading...' : 'Upload Image'}
                                        </label>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Recommended size: 200x200px
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                                        Publish Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        id="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F15A25]"
                                        required
                                    />
                                </div>
                                <div className="flex-1">
                                    <label htmlFor="readTime" className="block text-sm font-medium text-gray-700 mb-1">
                                        Read Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="readTime"
                                        name="readTime"
                                        value={formData.readTime}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F15A25]"
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="featured"
                                    name="featured"
                                    checked={formData.featured}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-[#F15A25] focus:ring-[#F15A25] border-gray-300 rounded"
                                />
                                <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                                    Featured Post
                                </label>
                            </div>

                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F15A25]"
                                    required
                                >
                                    <option value="eSim">eSim</option>
                                    <option value="Guides">Guides</option>
                                    <option value="Travel">Travel</option>
                                    <option value="Tech">Tech</option>
                                    <option value="News">News</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold">Content Sections</h2>

                        {formData.content.map((section, index) => (
                            <div key={section.id} className="border border-gray-200 rounded-md bg-white">
                                <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                                    <input
                                        type="text"
                                        value={section.heading}
                                        onChange={(e) => handleSectionHeadingChange(e, index)}
                                        className="text-lg font-medium bg-transparent   border rounded px-2 py-1 w-full"
                                        required
                                    />
                                    <div className="flex gap-2">
                                       
                                        <button
                                            type="button"
                                            onClick={() => removeSection(index)}
                                            className="p-1.5 text-gray-600 hover:text-red-500"
                                            title="Remove Section"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>

                                {viewMode[index] ? (
                                    <RichTextPreview content={section.content} />
                                ) : (
                                    <>
                                        <EditorMenuBar editor={editors[index]} index={index} />
                                        <EditorComponent
                                            content={section.content}
                                            onUpdate={(html) => {
                                                const updatedContent = [...formData.content];
                                                updatedContent[index].content = html;
                                                setFormData(prev => ({ ...prev, content: updatedContent }));
                                            }}
                                            index={index}
                                        />
                                    </>
                                )}
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addSection}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
                        >
                            <Plus size={18} />
                            Add Section
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}