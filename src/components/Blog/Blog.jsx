'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // List of available categories
  const categories = ['All', 'eSim', 'Guides', 'Travel', 'Tech', 'News'];

  // Sample blog post data
  const blogPosts = [
    {
      id: 1,
      title: "How Fliday eSIM helps you save mobile data",
      excerpt: "You'll probably get an eSIM for your next trip abroad to avoid the sky-high roaming charges, right? If you do, go for an eSIM that...",
      author: "Ilias R.",
      authorImage: "/blog/authors/ulas.png",
      date: "Mar 24, 2025",
      readTime: "6 min read",
      image: "/blog/featured-post.png",
      category: "eSim",
      featured: true
    },
    {
      id: 2,
      title: "How Fliday eSIM helps you save mobile data",
      excerpt: "Traveling abroad doesn't have to mean high data costs. Learn how to save on roaming with these simple tips.",
      author: "Ilias R.",
      authorImage: "/blog/authors/ulas.png",
      date: "Mar 24, 2025",
      readTime: "6 min read",
      image: "/blog/post-1.png",
      category: "eSim"
    },
    {
      id: 3,
      title: "How Fliday eSIM helps you save mobile data",
      excerpt: "Traveling abroad doesn't have to mean high data costs. Learn how to save on roaming with these simple tips.",
      author: "Ilias R.",
      authorImage: "/blog/authors/ulas.png",
      date: "Mar 24, 2025",
      readTime: "6 min read",
      image: "/blog/post-1.png",
      category: "Guides"
    },
    {
      id: 4,
      title: "How Fliday eSIM helps you save mobile data",
      excerpt: "Traveling abroad doesn't have to mean high data costs. Learn how to save on roaming with these simple tips.",
      author: "Ilias R.",
      authorImage: "/blog/authors/ulas.png",
      date: "Mar 24, 2025",
      readTime: "6 min read",
      image: "/blog/post-1.png",
      category: "Travel"
    },
    {
      id: 5,
      title: "How Fliday eSIM helps you save mobile data",
      excerpt: "Traveling abroad doesn't have to mean high data costs. Learn how to save on roaming with these simple tips.",
      author: "Ilias R.",
      authorImage: "/blog/authors/ulas.png",
      date: "Mar 24, 2025",
      readTime: "6 min read",
      image: "/blog/post-1.png",
      category: "eSim"
    },
    {
      id: 6,
      title: "How Fliday eSIM helps you save mobile data",
      excerpt: "Traveling abroad doesn't have to mean high data costs. Learn how to save on roaming with these simple tips.",
      author: "Ilias R.",
      authorImage: "/blog/authors/ulas.png",
      date: "Mar 24, 2025",
      readTime: "6 min read",
      image: "/blog/post-1.png",
      category: "Guides"
    },
    {
      id: 7,
      title: "How Fliday eSIM helps you save mobile data",
      excerpt: "Traveling abroad doesn't have to mean high data costs. Learn how to save on roaming with these simple tips.",
      author: "Ilias R.",
      authorImage: "/blog/authors/ulas.png",
      date: "Mar 24, 2025",
      readTime: "6 min read",
      image: "/blog/post-1.png",
      category: "Travel"
    },
    {
      id: 8,
      title: "How Fliday eSIM helps you save mobile data",
      excerpt: "Traveling abroad doesn't have to mean high data costs. Learn how to save on roaming with these simple tips.",
      author: "Ilias R.",
      authorImage: "/blog/authors/ulas.png",
      date: "Mar 24, 2025",
      readTime: "6 min read",
      image: "/blog/post-1.png",
      category: "eSim"
    },
    {
      id: 9,
      title: "How Fliday eSIM helps you save mobile data",
      excerpt: "Traveling abroad doesn't have to mean high data costs. Learn how to save on roaming with these simple tips.",
      author: "Ilias R.",
      authorImage: "/blog/authors/ulas.png",
      date: "Mar 24, 2025",
      readTime: "6 min read",
      image: "/blog/post-1.png",
      category: "Guides"
    },
    {
      id: 10,
      title: "How Fliday eSIM helps you save mobile data",
      excerpt: "Traveling abroad doesn't have to mean high data costs. Learn how to save on roaming with these simple tips.",
      author: "Ilias R.",
      authorImage: "/blog/authors/ulas.png",
      date: "Mar 24, 2025",
      readTime: "6 min read",
      image: "/blog/post-1.png",
      category: "Travel"
    },
    {
      id: 11,
      title: "How Fliday eSIM helps you save mobile data",
      excerpt: "Traveling abroad doesn't have to mean high data costs. Learn how to save on roaming with these simple tips.",
      author: "Ilias R.",
      authorImage: "/blog/authors/ulas.png",
      date: "Mar 24, 2025",
      readTime: "6 min read",
      image: "/blog/post-1.png",
      category: "Travel"
    },
    {
      id: 12,
      title: "How Fliday eSIM helps you save mobile data",
      excerpt: "Traveling abroad doesn't have to mean high data costs. Learn how to save on roaming with these simple tips.",
      author: "Ilias R.",
      authorImage: "/blog/authors/ulas.png",
      date: "Mar 24, 2025",
      readTime: "6 min read",
      image: "/blog/post-1.png",
      category: "Travel"
    },
    {
      id: 13,
      title: "How Fliday eSIM helps you save mobile data",
      excerpt: "Traveling abroad doesn't have to mean high data costs. Learn how to save on roaming with these simple tips.",
      author: "Ilias R.",
      authorImage: "/blog/authors/ulas.png",
      date: "Mar 24, 2025",
      readTime: "6 min read",
      image: "/blog/post-1.png",
      category: "Travel"
    },
    {
      id: 14,
      title: "How Fliday eSIM helps you save mobile data",
      excerpt: "Traveling abroad doesn't have to mean high data costs. Learn how to save on roaming with these simple tips.",
      author: "Ilias R.",
      authorImage: "/blog/authors/ulas.png",
      date: "Mar 24, 2025",
      readTime: "6 min read",
      image: "/blog/post-1.png",
      category: "Travel"
    },
    {
      id: 15,
      title: "How Fliday eSIM helps you save mobile data",
      excerpt: "Traveling abroad doesn't have to mean high data costs. Learn how to save on roaming with these simple tips.",
      author: "Ilias R.",
      authorImage: "/blog/authors/ulas.png",
      date: "Mar 24, 2025",
      readTime: "6 min read",
      image: "/blog/post-1.png",
      category: "Travel"
    },
    // Add more blog posts as needed
  ];

  // Get featured post
  const featuredPost = blogPosts.find(post => post.featured);

  // Filter posts based on selected category
  const filteredPosts = activeCategory === 'All'
    ? blogPosts.filter(post => !post.featured)
    : blogPosts.filter(post => post.category === activeCategory && !post.featured);

  // Pagination logic
  const postsPerPage = 9;
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="max-w-[1220px] mx-auto px-4 lg:py-24">
      {/* Featured Post Section */}
      {featuredPost && (
        <div className="mb-16">
          <Link href={`/blog/${featuredPost.id}`} className="block">
            <div className="relative rounded-xl overflow-hidden flex flex-col lg:flex-row  transition-shadow justify-between">
              <div className="max-w-[440px] p-8 lg:pr-0 flex flex-col justify-center">
                <div className="inline-block w-fit px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 mb-4">
                  {featuredPost.category}
                </div>
                <h1 className="text-3xl font-medium mb-4">{featuredPost.title}</h1>
                <p className="text-gray-600 mb-6">{featuredPost.excerpt}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="mr-4">{featuredPost.date}</span>
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {featuredPost.readTime}
                  </span>
                </div>
                <div className="flex items-center mt-4">
                  <Image
                    src={featuredPost.authorImage}
                    alt={featuredPost.author}
                    width={32}
                    height={32}
                    className="rounded-full mr-2"
                  />
                  <span className="text-sm">{featuredPost.author}</span>
                </div>
              </div>
              <div className="lg:w-[705px] relative h-[300px] lg:h-auto">
                <Image
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  fill
                  className="lg:object-cover"
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
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-colors ${activeCategory === category
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
        {currentPosts.map(post => (
          <Link key={post.id} href={`/blog/${post.id}`} className="block group">
            <div className="rounded-xl overflow-hidden   h-full flex flex-col">
              <div className={`relative h-48 `}>
                <Image
                  src={post.image}
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
                    <span className="mr-3">{post.date}</span>
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {post.readTime}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium mb-2 group-hover:text-[#F15A25] transition-colors">
                    {post.title}
                  </h3>
                </div>
                <div className="flex items-center ">
                  <Image
                    src={post.authorImage}
                    alt={post.author}
                    width={24}
                    height={24}
                    className="rounded-full mr-2"
                  />
                  <span className="text-xs">{post.author}</span>
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
          {pageNumbers.map(number => (
            <button
              key={number}
              onClick={() => setCurrentPage(number)}
              className={`w-8 h-8 flex items-center justify-center rounded-full ${currentPage === number
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