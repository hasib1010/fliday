'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import sanitizeHtml from 'sanitize-html';

export default function BlogDetail({ params, initialBlog, initialError }) {
  const router = useRouter();
  const [blog, setBlog] = useState(initialBlog);
  const [activeSection, setActiveSection] = useState('');
  const [showAllHeadings, setShowAllHeadings] = useState(false);
  const [loading, setLoading] = useState(!initialBlog && !initialError);
  const [error, setError] = useState(initialError);
  const [retryCount, setRetryCount] = useState(0);

  // Extract slug from params or URL
  const slug = params?.id || (typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : null);

  useEffect(() => {
    console.log('BlogDetail: params.id:', params?.id);
    console.log('BlogDetail: slug:', slug);
    console.log('BlogDetail: router.isReady:', router.isReady);
    console.log('BlogDetail: initialBlog:', initialBlog ? initialBlog.title : null);
    console.log('BlogDetail: initialError:', initialError);

    // Skip client-side fetch if initialBlog is provided or there's an initial error
    if (initialBlog || initialError) {
      if (initialBlog && initialBlog.content && initialBlog.content.length > 0) {
        setActiveSection(initialBlog.content[0].id);
      }
      setLoading(false);
      return;
    }

    const fetchBlogData = async () => {
      if (!slug) {
        console.error('BlogDetail: No slug provided');
        setError('Invalid blog ID');
        setLoading(false);
        return;
      }

      try {
        console.log('BlogDetail: Fetching blog for slug:', slug);
        const response = await fetch(`/api/blogs/${slug}`, {
          cache: 'no-store',
        });
        console.log('BlogDetail: API response status:', response.status);
        if (!response.ok) {
          const errorData = await response.json();
          console.log('BlogDetail: API error:', errorData);
          throw new Error('Failed to fetch blog');
        }
        const data = await response.json();
        console.log('BlogDetail: Blog data:', data.title);
        setBlog(data);
        if (data.content && data.content.length > 0) {
          setActiveSection(data.content[0].id);
        }
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error('BlogDetail: Fetch error:', err.message);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchBlogData();
  }, [slug, initialBlog, initialError]);

  // Retry mechanism for failed fetches
  useEffect(() => {
    if (error && retryCount < 3) {
      const timer = setTimeout(() => {
        console.log('BlogDetail: Retrying fetch, attempt:', retryCount + 1);
        setLoading(true);
        setError(null);
        setRetryCount(retryCount + 1);
        const fetchBlogData = async () => {
          try {
            const response = await fetch(`/api/blogs/${slug}`, {
              cache: 'no-store',
            });
            if (!response.ok) throw new Error('Failed to fetch blog');
            const data = await response.json();
            setBlog(data);
            if (data.content && data.content.length > 0) {
              setActiveSection(data.content[0].id);
            }
            setLoading(false);
            setError(null);
            setRetryCount(0);
          } catch (err) {
            setError(err.message);
            setLoading(false);
          }
        };
        fetchBlogData();
      }, 2000); // Retry after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [error, retryCount, slug]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('.blog-section');
      if (sections.length === 0) return;

      let currentSection = sections[0].id;

      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        if (window.scrollY >= sectionTop - 200) {
          currentSection = section.id;
        }
      });

      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      window.scrollTo({
        top: section.offsetTop - 100,
        behavior: 'smooth',
      });
      setActiveSection(sectionId);
    }
  };

  const renderTableOfContents = () => {
    if (!blog?.content || blog.content.length === 0) return null;

    const visibleItems = showAllHeadings ? blog.content : blog.content.slice(0, 4);

    return (
      <>
        <ul className="space-y-2">
          {visibleItems.map((section) => (
            <li key={section.id}>
              <button
                onClick={() => scrollToSection(section.id)}
                className={`text-left text-sm hover:text-[#F15A25] transition-colors ${
                  activeSection === section.id ? 'text-[#F15A25] font-medium' : 'text-gray-700'
                }`}
              >
                {section.heading}
              </button>
            </li>
          ))}
        </ul>

        {blog.content.length > 4 && (
          <button
            className="mt-4 text-sm text-[#F15A25] font-medium hover:underline"
            onClick={() => setShowAllHeadings(!showAllHeadings)}
          >
            {showAllHeadings ? 'Show Less' : 'Show All'}
          </button>
        )}
      </>
    );
  };

  if (loading) {
    return <div className="max-w-[1220px] mx-auto px-4 py-12">Loading...</div>;
  }

  if (error) {
    return (
      <div className="max-w-[1220px] mx-auto px-4 py-12 text-red-600">
        {error}
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            setRetryCount(retryCount + 1);
            const fetchBlogData = async () => {
              try {
                const response = await fetch(`/api/blogs/${slug}`, {
                  cache: 'no-store',
                });
                if (!response.ok) throw new Error('Failed to fetch blog');
                const data = await response.json();
                setBlog(data);
                if (data.content && data.content.length > 0) {
                  setActiveSection(data.content[0].id);
                }
                setLoading(false);
                setError(null);
              } catch (err) {
                setError(err.message);
                setLoading(false);
              }
            };
            fetchBlogData();
          }}
          className="ml-4 text-[#F15A25] underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!blog) {
    return <div className="max-w-[1220px] mx-auto px-4 py-12">Blog not found</div>;
  }

  return (
    <div className="max-w-[1220px] mx-auto mt-20 pt-5 lg:pt-20 px-3 lg:px-0">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: blog.title,
            description: blog.excerpt,
            image: blog.featuredImage,
            datePublished: blog.date,
            author: {
              '@type': 'Person',
              name: blog.author.name,
            },
            publisher: {
              '@type': 'Organization',
              name: 'Fliday',
              logo: {
                '@type': 'ImageObject',
                url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/logo.png`,
              },
            },
          }),
        }}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - 2/3 width on desktop */}
        <div className="lg:col-span-2">
          {/* Featured Image */}
          <div className="relative rounded-xl overflow-hidden mb-6">
            <Image
              src={blog.featuredImage.replace('/upload/', '/upload/q_auto/') || '/fallback-image.jpg'}
              alt={blog.title}
              width={1220}
              height={400}
              className="object-cover"
              priority
            />
          </div>

          {/* Article Title */}
          <h1 className="lg:text-[40px] text-2xl md:text-4xl font-medium mb-4">{blog.title}</h1>

          {/* Article Meta */}
          <div className="flex flex-col-reverse gap-1.5 mb-8">
            <div className="flex items-center mt-3 mr-4">
              <Image
                src={blog.author.image || '/fallback-author.jpg'}
                alt={blog.author.name}
                width={32}
                height={32}
                className="rounded-full mr-2"
              />
              <span className="text-sm">{blog.author.name}</span>
            </div>

            <div className="flex items-center text-sm text-[#353535]">
              <span className="mr-4 flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f56565"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide-calendar-days"
                >
                  <path d="M8 2v4" />
                  <path d="M16 2v4" />
                  <rect width="18" height="18" x="3" y="4" rx="2" />
                  <path d="M3 10h18" />
                  <path d="M8 14h.01" />
                  <path d="M12 14h.01" />
                  <path d="M16 14h.01" />
                  <path d="M8 18h.01" />
                  <path d="M12 18h.01" />
                  <path d="M16 18h.01" />
                </svg>
                {new Date(blog.date).toLocaleDateString('en-US', {
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
                  stroke="#f56565"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {blog.readTime}
              </span>
            </div>
          </div>

          {/* Table of Contents - Mobile */}
          <div className="lg:hidden mb-8">
            <div className="border rounded-lg p-6">
              <h3 className="font-medium text-lg mb-4">Table of Contents</h3>
              {renderTableOfContents()}
            </div>
          </div>

          {/* Article Content */}
          <div className="prose max-w-none">
            {blog.content.map((section) => (
              <section id={section.id} key={section.id} className="blog-section mb-10">
                <h2 className="text-2xl font-medium mb-4">{section.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(section.content, {
                      allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'div', 'img', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
                      allowedAttributes: {
                        a: ['href', 'target'],
                        img: ['src', 'alt'],
                      },
                    }),
                  }}
                />
              </section>
            ))}
          </div>

          {/* Related Articles */}
          {blog.relatedArticles && blog.relatedArticles.length > 0 && (
            <div className="mt-16">
              <h3 className="text-2xl font-medium mb-6">Related articles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {blog.relatedArticles.map((article) => (
                  <Link key={article.id} href={`/blog/${article.id}`} className="block group">
                    <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                      <div className="relative h-48">
                        <Image
                          src={article.image.replace('/upload/', '/upload/q_auto/') || '/fallback-image.jpg'}
                          alt={article.title}
                          fill
                          className="object-cover rounded-xl"
                        />
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="inline-block w-fit px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600 mb-3">
                          {article.category}
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mb-3">
                          <span className="mr-3">
                            {new Date(article.date).toLocaleDateString('en-US', {
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
                            {article.readTime}
                          </span>
                        </div>
                        <h3 className="text-lg font-medium mb-2 group-hover:text-[#F15A25] transition-colors">
                          {article.title}
                        </h3>
                        <div className="flex items-center mt-4">
                          <Image
                            src={article.authorImage || '/fallback-author.jpg'}
                            alt={article.author}
                            width={24}
                            height={24}
                            className="rounded-full mr-2"
                          />
                          <span className="text-xs">{article.author}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - 1/3 width on desktop */}
        <div className="max-w-[292px]">
          {/* Table of Contents - Desktop */}
          <div className="hidden lg:block sticky top-20 w-full">
            <div className="border border-[#F15A25] rounded-lg p-2 mb-4">
              <h3 className="font-medium text-lg mb-2">Table of Contents</h3>
              {renderTableOfContents()}
            </div>

            {/* Promo Card */}
            <div className="rounded-lg overflow-hidden border border-[#F15A25] w-full">
              <div className="bg-white p-6">
                <h3 className="text-[24px] font-medium text-black">
                  <span className="text-[#F15A25]">Never</span> Pay Roaming Fees Again
                </h3>
                <p className="text-black text-sm mt-2 mb-4">
                  Get your travel eSIM today and stay connected abroad.
                </p>
                <Link
                  href="/destinations"
                  className="inline-block bg-[#F15A25] text-white text-sm px-6 py-2 rounded-full font-medium hover:bg-[#e04e1a] transition-colors"
                >
                  Choose a Destination
                </Link>
              </div>
              <div className="relative">
                <Image
                  src="/blog/promo-card.png"
                  alt="Woman using phone with headphones"
                  width={292}
                  height={200}
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}