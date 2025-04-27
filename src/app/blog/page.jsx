'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const categories = ['All', 'eSim', 'Guides', 'Travel', 'Tech', 'News', 'Other'];
  const carouselInterval = useRef(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch('/api/blogs', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch blogs');
        const data = await res.json();
        console.log('Blog: Fetched blog posts:', data.map(post => ({ id: post._id, slug: post.slug, title: post.title })));
        setBlogPosts(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  // Get all featured posts
  const featuredPosts = blogPosts.filter((post) => post.featured);
  console.log('Blog: Featured posts:', featuredPosts.map(post => ({ slug: post.slug, title: post.title })));

  // Auto-rotate carousel if multiple featured posts
  useEffect(() => {
    if (featuredPosts.length > 1 && !isPaused) {
      carouselInterval.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % featuredPosts.length);
      }, 5000); // Rotate every 5 seconds
    }
    return () => clearInterval(carouselInterval.current);
  }, [featuredPosts.length, isPaused]);

  const filteredPosts =
    activeCategory === 'All'
      ? blogPosts.filter((post) => !post.featured)
      : blogPosts.filter((post) => post.category === activeCategory && !post.featured);

  const postsPerPage = 9;
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
  console.log('Blog: Current posts:', currentPosts.map(post => ({ slug: post.slug, title: post.title })));

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const LoadingSpinner = () => (
    <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-t-orange-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-4 border-t-transparent border-r-blue-500 border-b-transparent border-l-transparent rounded-full animate-spin animation-delay-100"></div>
        <div className="absolute inset-4 border-4 border-t-transparent border-r-transparent border-b-green-500 border-l-transparent rounded-full animate-spin animation-delay-200"></div>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="max-w-[1220px] mx-auto px-4 py-12 text-red-600">{error}</div>;
  }

  const FeaturedPost = ({ post }) => (
    <Link href={`/blog/${post.slug}`} className="block">
      <div className="relative rounded-xl overflow-hidden flex flex-col lg:flex-row transition-shadow lg:items-center justify-between">
        <div className="max-w-[440px] lg:p-8 py-4 lg:pr-0 flex flex-col justify-center">
          <div className="inline-block w-fit px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 mb-4">
            {post.category}
          </div>
          <h1 className="text-3xl font-medium mb-4">{post.title}</h1>
          <p className="text-gray-600 mb-6">{post.excerpt}</p>
          <div className="flex items-center text-sm text-gray-500">
            <span className="mr-4">
              {new Date(post.date).toLocaleDateString('en-US', {
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
              {post.readTime}
            </span>
          </div>
          <div className="flex items-center mt-4 space-x-2">
            <div className="relative w-8 h-8">
              <Image
                src={post.author?.image || '/fallback-author.jpg'}
                alt={post.author?.name || 'Unknown Author'}
                fill
                className="rounded-full object-cover"
              />
            </div>
            <span className="text-sm text-black">{post.author?.name || 'Unknown Author'}</span>
          </div>
        </div>
        <div className=" lg:w-[705px] relative h-[300px] ">
          <Image
            src={post.featuredImage || '/fallback-image.jpg'}
            alt={post.title}
            fill
            className="object-cover rounded-xl"
            priority
          />
        </div>
      </div>
    </Link>
  );

  return (
    <div className="max-w-[1220px] mx-auto px-3 lg:px-0 mt-24">
      {/* Featured Posts Section */}
      {featuredPosts.length > 0 && (
        <div
          className="mb-16 pt-5 lg:pt-0"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          role="region"
          aria-label="Featured posts carousel"
        >
          {featuredPosts.length === 1 ? (
            <FeaturedPost post={featuredPosts[0]} />
          ) : (
            <>
              <div className="relative overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {featuredPosts.map((post, index) => (
                    <div key={post._id} className="min-w-full">
                      <FeaturedPost post={post} />
                    </div>
                  ))}
                </div>
              </div>
              {/* Dots Navigation (Outside Carousel) */}
              <div className="flex justify-center mt-4 space-x-2">
                {featuredPosts.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full ${currentSlide === index ? 'bg-[#F15A25]' : 'bg-gray-300'} focus:outline-none focus:ring-2 focus:ring-[#F15A25]`}
                    aria-label={`Go to featured post ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
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
        {currentPosts.map((post) => (
          <Link key={post._id} href={`/blog/${post.slug}`} className="block group">
            <div className="rounded-xl overflow-hidden h-full flex flex-col">
              <div className="relative h-48">
                <Image
                  src={post.featuredImage || '/fallback-image.jpg'}
                  alt={post.title}
                  fill
                  className="object-cover rounded-xl"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className=" ">
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
                          stroke="currentColor"
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
                    src={post.author?.image || '/fallback-author.jpg'}
                    alt={post.author?.name || 'Unknown Author'}
                    width={24}
                    height={24}
                    className="rounded-full mr-2"
                  />
                  <span className="text-xs">{post.author?.name || 'Unknown Author'}</span>
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