'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = ['All', 'eSim', 'Guides', 'Travel', 'Tech', 'News', 'Other'];

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch('/api/blogs');
        if (!res.ok) throw new Error('Failed to fetch blogs');
        const data = await res.json();
        setBlogPosts(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const featuredPost = blogPosts.find((post) => post.featured);

  const filteredPosts =
    activeCategory === 'All'
      ? blogPosts.filter((post) => !post.featured)
      : blogPosts.filter((post) => post.category === activeCategory && !post.featured);

  const postsPerPage = 9;
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  if (loading) {
    return <div className="max-w-[1220px] mx-auto px-4 py-12">Loading...</div>;
  }

  if (error) {
    return <div className="max-w-[1220px] mx-auto px-4 py-12 text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-[1220px] mx-auto px-3 lg:px-0 mt-24">
      {/* Featured Post Section */}
      {featuredPost && (
        <div className="mb-16 pt-5 lg:pt-0">
          <Link href={`/blog/${featuredPost.slug}`} className="block">
            <div className="relative rounded-xl overflow-hidden flex flex-col lg:flex-row transition-shadow justify-between">
              <div className="max-w-[440px] lg:p-8 py-4 lg:pr-0 flex flex-col justify-center">
                <div className="inline-block w-fit px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 mb-4">
                  {featuredPost.category}
                </div>
                <h1 className="text-3xl font-medium mb-4">{featuredPost.title}</h1>
                <p className="text-gray-600 mb-6">{featuredPost.excerpt}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="mr-4">
                    {new Date(featuredPost.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {featuredPost.readTime}
                  </span>
                </div>
                <div className="flex items-center mt-4">
                  <Image
                    src={featuredPost.author.image}
                    alt={featuredPost.author.name}
                    width={32}
                    height={32}
                    className="rounded-full mr-2"
                  />
                  <span className="text-sm">{featuredPost.author.name}</span>
                </div>
              </div>
              <div className="lg:w-[705px] relative h-[300px] lg:h-auto">
                <Image
                  src={featuredPost.featuredImage}
                  alt={featuredPost.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Category Filter */}
      <div className="mb-12">
        <h2 className="text-2xl font-medium mb-6">Choose category</h2>
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-colors ${
                activeCategory === category
                  ? 'bg-black text-white'
                  : 'bg-white text-black border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {currentPosts.map((post) => (
          <Link key={post._id} href={`/blog/${post.slug}`} className="block group">
            <div className="rounded-xl overflow-hidden h-full flex flex-col">
              <div className="relative h-48">
                <Image
                  src={post.featuredImage}
                  alt={post.title}
                  fill
                  className="object-cover rounded-xl"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex-1">
                  <div className="inline-block px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600 mb-3">
                    {post.category}
                  </div>
                  <div className="flex items-center text-xs text-gray-500 mb-3">
                    <span className="mr-3">
                      {new Date(post.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {post.readTime}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium mb-2 group-hover:text-[#F15A25] transition-colors">
                    {post.title}
                  </h3>
                </div>
                <div className="flex items-center">
                  <Image
                    src={post.author.image}
                    alt={post.author.name}
                    width={24}
                    height={24}
                    className="rounded-full mr-2"
                  />
                  <span className="text-xs">{post.author.name}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          {currentPage > 1 && (
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              className="flex items-center justify-center ml-2 text-sm font-medium text-gray-700 hover:text-black"
            >
              ← Go Back
            </button>
          )}
          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => setCurrentPage(number)}
              className={`w-8 h-8 flex items-center justify-center rounded-full ${
                currentPage === number
                  ? 'bg-black text-white'
                  : 'bg-white text-black border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {number}
            </button>
          ))}
          {currentPage < totalPages && (
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              className="flex items-center justify-center ml-2 text-sm font-medium text-gray-700 hover:text-black"
            >
              Next →
            </button>
          )}
        </div>
      )}
    </div>
  );
}