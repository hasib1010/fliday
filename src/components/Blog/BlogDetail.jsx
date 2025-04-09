'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Demo blog data that would typically come from a database
const DEMO_BLOG = {
    id: "esim-guide-2025",
    title: "The Ultimate eSIM Guide for Travelers in 2025",
    featuredImage: "/blog/featured-post.png",
    date: "Apr 8, 2025",
    readTime: "8 min read",
    author: {
        name: "Ilias R.",
        image: "/blog/authors/ulas.png"
    },
    category: "eSim",
    // Content is structured as sections with headings and paragraphs
    content: [
        {
            id: "activate-esim",
            heading: "How to activate an eSim?",
            content: `
        <p>Activating your eSIM is easier than you might think. Most modern smartphones (iPhone XS or newer, Google Pixel 3 or newer) support eSIM technology. Once you've purchased your eSIM plan from Filday, you'll receive a QR code via email. Simply go to your phone's settings, select "Mobile Data" or "Cellular," then "Add eSIM" or "Add Cellular Plan" and scan the QR code.</p>
        
        <p>After scanning, your phone will ask you to confirm the activation. Choose a label for your new plan (like "Travel" or "Filday") and decide whether to use it as your primary data line or keep it as secondary. The activation process usually takes less than 5 minutes, and you'll receive a confirmation message once the eSIM is active.</p>
        
        <p>Remember to enable data roaming for your eSIM line, as this is required for the service to work abroad. You can activate your eSIM before your trip, but we recommend doing it while you still have access to reliable Wi-Fi.</p>
      `
        },
        {
            id: "check-balance",
            heading: "How to check your balance?",
            content: `
        <p>Keeping track of your data usage is essential to avoid unexpected charges. With Filday eSIM, there are multiple ways to check your balance. The easiest method is through the Filday app, available for both iOS and Android. After logging in, your current data balance and plan expiration date will be displayed on the dashboard.</p>
        
        <p>If you don't have the app, you can check your balance by dialing *123# from your phone using the eSIM line. This will display your remaining data and validity period. Alternatively, log in to your Filday account on our website to view your usage details.</p>
        
        <p>We also send automatic notifications when you've used 80% and 95% of your data allowance, giving you ample warning before you run out. These notifications are sent via both email and SMS to ensure you're always informed about your usage.</p>
      `
        },
        {
            id: "find-restaurants",
            heading: "How to find restaurants?",
            content: `
        <p>One of the joys of travel is discovering local cuisine. With your Filday eSIM providing reliable internet access, finding great restaurants becomes much easier. We recommend using Google Maps, which works seamlessly with your eSIM data connection. Simply open the app, search for "restaurants near me," and filter by cuisine type, price range, or user ratings.</p>
        
        <p>For a more authentic experience, try apps like TheFork (Europe), Yelp (US and Canada), or Zomato (Asia) that specialize in local restaurant reviews and often offer exclusive discounts. These apps provide menu information, photos, and genuine reviews from other travelers and locals.</p>
        
        <p>Don't forget to check social media platforms like Instagram by searching location tags to see what dishes are popular at specific restaurants. This visual approach can help you discover photogenic and delicious meals that might not be on traditional review platforms.</p>
      `
        },
        {
            id: "find-uber",
            heading: "How to find an Uber?",
            content: `
        <p>Getting around in a foreign city is much easier with ride-sharing services, and your Filday eSIM ensures you always have access to these apps. To use Uber abroad, simply open the app as you would at home - no additional settings are needed. The app will automatically detect your location using GPS and show available drivers nearby.</p>
        
        <p>If Uber isn't available in your destination, don't worry. Your eSIM works with alternative ride-sharing apps like Grab (Southeast Asia), DiDi (Latin America, Australia), Bolt (Europe, Africa), or Careem (Middle East). Before your trip, check which service is popular at your destination and download the appropriate app.</p>
        
        <p>Using ride-sharing with your eSIM connection is not only convenient but often safer than hailing street taxis, as your journey is tracked and you have driver information. You'll also avoid language barrier issues when explaining your destination, as you enter it directly in the app.</p>
      `
        },
        {
            id: "topup-esim",
            heading: "How to top up your eSim?",
            content: `
        <p>When your data balance is running low, topping up your Filday eSIM is simple and fast. The most convenient way is through the Filday app - select your active eSIM, tap "Add Data," and choose from available data packages. Payment can be made using credit/debit cards, PayPal, or Apple Pay/Google Pay, and your new data allowance is added instantly.</p>
        
        <p>You can also top up through our website by logging into your account and navigating to the "My eSIMs" section. Select the eSIM you want to recharge and follow the prompts to add more data. If you're running low on data and can't access these options, we've got you covered with our "Emergency Data" feature - just dial *123*911# to add a small emergency data package that will be charged to your registered payment method.</p>
      `
        },
        {
            id: "esim-troubleshooting",
            heading: "Troubleshooting eSim Issues",
            content: `
        <p>While eSIMs are generally reliable, occasional issues may arise. If your eSIM stops working, first try toggling airplane mode on and off, which often resolves connectivity problems. If that doesn't work, go to your phone's settings, select the eSIM, and check if data roaming is enabled - this is essential for the eSIM to function abroad.</p>
        
        <p>Sometimes, network settings need to be refreshed. You can do this by going to Settings > General > Reset > Reset Network Settings. Note that this will also reset your saved Wi-Fi passwords. If you're in an area with poor coverage, try manually selecting a different network provider through your phone's carrier selection menu.</p>
        
        <p>For persistent issues, contact our 24/7 support team through the Filday app or via email at support@filday.com. Our technical specialists can remotely diagnose and often fix eSIM issues without you needing to do anything beyond keeping your phone turned on.</p>
      `
        }
    ],
    relatedArticles: [
        {
            id: 1,
            title: "10 Countries Where Filday eSIM Saves You the Most Money",
            image: "/blog/post-1.png",
            date: "Mar 24, 2025",
            readTime: "6 min read",
            author: "Ilias R.",
            authorImage: "/blog/authors/ulas.png",
            category: "eSim"
        },
        {
            id: 2,
            title: "How to Use Your Phone Abroad Without Breaking the Bank",
            image: "/blog/post-1.png",
            date: "Apr 2, 2025",
            readTime: "5 min read",
            author: "Ilias R.",
            authorImage: "/blog/authors/ulas.png",
            category: "Guides"
        }
    ]
};

export default function BlogDetail({ params }) {
    const [blog, setBlog] = useState(DEMO_BLOG);
    const [activeSection, setActiveSection] = useState('');
    const [showAllHeadings, setShowAllHeadings] = useState(false);

    // In a real app, fetch blog data based on params.slug
    // useEffect(() => {
    //     const fetchBlogData = async () => {
    //         try {
    //             const response = await fetch(`/api/blogs/${params.slug}`);
    //             const data = await response.json();
    //             setBlog(data);
    //             if (data.content && data.content.length > 0) {
    //                 setActiveSection(data.content[0].id);
    //             }
    //         } catch (error) {
    //             console.error('Error fetching blog data:', error);
    //         }
    //     };
    //     
    //     fetchBlogData();
    // }, [params.slug]);

    // Set initial active section
    useEffect(() => {
        if (blog.content && blog.content.length > 0) {
            setActiveSection(blog.content[0].id);
        }
    }, [blog]);

    // Handle scrolling and section highlighting
    useEffect(() => {
        const handleScroll = () => {
            const sections = document.querySelectorAll('.blog-section');
            if (sections.length === 0) return;

            let currentSection = sections[0].id;

            sections.forEach(section => {
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

    // Scroll to section when clicking on TOC link
    const scrollToSection = (sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) {
            window.scrollTo({
                top: section.offsetTop - 100,
                behavior: 'smooth'
            });
            setActiveSection(sectionId);
        }
    };

    // Function to render table of contents
    const renderTableOfContents = () => {
        if (!blog.content || blog.content.length === 0) return null;

        const visibleItems = showAllHeadings
            ? blog.content
            : blog.content.slice(0, 4);

        return (
            <>
                <ul className="space-y-2">
                    {visibleItems.map((section) => (
                        <li key={section.id}>
                            <button
                                onClick={() => scrollToSection(section.id)}
                                className={`text-left text-sm hover:text-[#F15A25] transition-colors ${activeSection === section.id ? 'text-[#F15A25] font-medium' : 'text-gray-700'
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

    // If blog is not loaded yet (would happen in a real app)
    if (!blog) {
        return <div className="max-w-[1220px] mx-auto px-4 py-12">Loading...</div>;
    }

    return (
        <div className="max-w-[1220px] mx-auto  mt-20 pt-5 lg:pt-20  px-3 lg:px-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - 2/3 width on desktop */}
                <div className="lg:col-span-2">
                    {/* Featured Image */}
                    <div className="relative rounded-xl overflow-hidden mb-6 ">
                        <img
                            src={blog.featuredImage}
                            alt={blog.title}

                           
                        />
                    </div>

                    {/* Article Title */}
                    <h1 className="lg:text-[40px]  text-2xl    md:text-4xl font-medium mb-4">{blog.title}</h1>

                    {/* Article Meta */}
                    <div className="flex flex-col-reverse gap-1.5 mb-8">
                        <div className="flex items-center mt-3 mr-4">
                            <Image
                                src={blog.author.image}
                                alt={blog.author.name}
                                width={32}
                                height={32}
                                className="rounded-full mr-2"
                              
                            />
                            <span className="text-sm">{blog.author.name}</span>
                        </div>

                        <div className="flex items-center text-sm text-[#353535]">
                            <span className="mr-4 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f56565" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-calendar-days">
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
                                {blog.date}
                            </span>
                            <span className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="#f56565">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                                <div dangerouslySetInnerHTML={{ __html: section.content }} />
                            </section>
                        ))}
                    </div>

                    {/* Related Articles */}
                    {blog.relatedArticles && blog.relatedArticles.length > 0 && (
                        <div className="mt-16">
                            <h3 className="text-2xl font-medium mb-6">Related articles</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {blog.relatedArticles.map(article => (
                                    <Link key={article.id} href={`/blog/${article.id}`} className="block group">
                                        <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                                            <div className="relative h-48">
                                                <Image
                                                    src={article.image}
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
                                                    <span className="mr-3">{article.date}</span>
                                                    <span className="flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        {article.readTime}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-medium mb-2 group-hover:text-[#F15A25] transition-colors">
                                                    {article.title}
                                                </h3>
                                                <div className="flex items-center mt-4">
                                                    <Image
                                                        src={article.authorImage}
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
                <div className="w-[292px]">
                    {/* Table of Contents - Desktop */}
                    <div className="hidden lg:block sticky top-3 w-full">
                        <div className="border border-[#F15A25] rounded-lg p-2 mb-4">
                            <h3 className="font-medium text-lg mb-2">Table of Contents</h3>
                            {renderTableOfContents()}
                        </div>

                        {/* Promo Card */}
                        <div className="rounded-lg overflow-hidden border border-[#F15A25] w-full">
                            <div className="bg-white p-6">
                                <h3 className="text-[24px] font-medium text-black"><span className='text-[#F15A25]'>Never</span> Pay Roaming Fees Again</h3>
                                <p className="text-black text-sm mt-2 mb-4">Get your travel eSIM today and stay connected abroad.</p>
                                <Link href="/destinations" className="inline-block bg-[#F15A25] text-white text-sm px-6 py-2 rounded-full font-medium hover:bg-[#e04e1a] transition-colors">
                                    Choose a Destination
                                </Link>
                            </div>
                            <div className="relative ">
                                <img
                                    src="/blog/promo-card.png"
                                    alt="Woman using phone with headphones"
                                   
                                    className=" "
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}