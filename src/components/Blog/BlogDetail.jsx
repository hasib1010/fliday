'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function BlogDetail({ params }) {
    const [activeSection, setActiveSection] = useState('section1');

    // Handle scrolling and section highlighting
    useEffect(() => {
        const handleScroll = () => {
            const sections = document.querySelectorAll('.blog-section');
            let currentSection = 'section1';

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
        }
    };

    const tableOfContents = [
        { id: 'section1', title: 'How to activate an eSim?' },
        { id: 'section2', title: 'How to check your balance?' },
        { id: 'section3', title: 'How to find restaurants?' },
        { id: 'section4', title: 'How to find an Uber?' }
    ];

    const relatedArticles = [
        {
            id: 1,
            title: "How Filday esim helps you save mobile data",
            image: "/blog/post-1.png",
            date: "Mar 24, 2025",
            readTime: "6 min read",
            author: "Ilias R.",
            authorImage: "/blog/authors/ulas.png",
            category: "eSim"
        },
        {
            id: 2,
            title: "How Filday esim helps you save mobile data",
            image: "/blog/post-1.png",
            date: "Mar 24, 2025",
            readTime: "6 min read",
            author: "Ilias R.",
            authorImage: "/blog/authors/ulas.png",
            category: "Guides"
        }
    ];

    return (
        <div className="max-w-[1220px] mx-auto px-4 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - 2/3 width on desktop */}
                <div className="lg:col-span-2">
                    {/* Featured Image */}
                    <div className="relative rounded-xl overflow-hidden lg:w-[753px] mb-6 h-[400px]">
                        <Image
                            src="/blog/featured-post.png"
                            alt="Blog featured image"
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>

                    {/* Article Title */}
                    <h1 className="text-3xl md:text-4xl font-medium mb-4">How Filday esim helps you save mobile data</h1>

                    {/* Article Meta */}
                    <div className="flex flex-col-reverse  gap-1.5 mb-8">
                        <div className="flex items-center mr-4">
                            <Image
                                src="/blog/authors/ulas.png"
                                alt="Author"
                                width={32}
                                height={32}
                                className="rounded-full mr-2"
                            />
                            <span className="text-sm">Ilias R.</span>
                        </div>

                        <div className="flex items-center text-sm text-[#353535]">
                            <span className="mr-4 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f56565" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-days-icon lucide-calendar-days"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" />
                                </svg>Mar 24, 2025</span>
                            <span className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="#f56565">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                6 min read
                            </span>
                        </div>
                    </div>

                    {/* Table of Contents - Mobile */}
                    <div className="lg:hidden mb-8">
                        <div className="border rounded-lg p-6">
                            <h3 className="font-medium text-lg mb-4">Table of Contents</h3>
                            <ul className="space-y-2">
                                {tableOfContents.map(item => (
                                    <li key={item.id}>
                                        <button
                                            onClick={() => scrollToSection(item.id)}
                                            className={`text-left text-sm hover:text-[#F15A25] transition-colors ${activeSection === item.id ? 'text-[#F15A25] font-medium' : 'text-gray-700'
                                                }`}
                                        >
                                            {item.title}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Article Content */}
                    <div className="prose max-w-none">
                        {/* Section 1 */}
                        <section id="section1" className="blog-section mb-10">
                            <h2 className="text-2xl font-medium mb-4">How to activate an eSim?</h2>
                            <p className="mb-4">
                                Deciding on what clothes to bring on your trip can be a headache. You want to bring enough to stay comfortable but not overdo it. The trick is planning ahead and bringing clothes you can mix and match. This way, you'll be ready for anything the weekend throws at you and won't overstuff your bag.
                            </p>
                            <p className="mb-4">
                                Of course, this packing list is more of a helping suggestion than a hard rule. Everyone has different needs, so don't feel limited by the list. If you're someone who likes to pack light, that's great! But if you'd rather bring extra pieces for comfort, it's totally fine, too. These suggestions might also change depending on where you're going, what you'll be doing, or your style, so feel free to adjust them to suit your plans.
                            </p>
                            <p className="mb-4">
                                If you realize you're missing something or simply don't want to pack it, you can always shop locally while you're there. Plus you might find something unique and bring home a memorable souvenir.
                            </p>
                        </section>

                        {/* Section 2 */}
                        <section id="section2" className="blog-section mb-10">
                            <h2 className="text-2xl font-medium mb-4">How to check your balance?</h2>
                            <p className="mb-4">
                                Deciding on what clothes to bring on your trip can be a headache. You want to bring enough to stay comfortable but not overdo it. The trick is planning ahead and bringing clothes you can mix and match. This way, you'll be ready for anything the weekend throws at you and won't overstuff your bag.
                            </p>
                            <p className="mb-4">
                                Of course, this packing list is more of a helping suggestion than a hard rule. Everyone has different needs, so don't feel limited by the list. If you're someone who likes to pack light, that's great! But if you'd rather bring extra pieces for comfort, it's totally fine, too. These suggestions might also change depending on where you're going, what you'll be doing, or your style, so feel free to adjust them to suit your plans.
                            </p>
                            <p className="mb-4">
                                If you realize you're missing something or simply don't want to pack it, you can always shop locally while you're there. Plus you might find something unique and bring home a memorable souvenir.
                            </p>
                        </section>

                        {/* Section 3 */}
                        <section id="section3" className="blog-section mb-10">
                            <h2 className="text-2xl font-medium mb-4">How to find restaurants?</h2>
                            <p className="mb-4">
                                Deciding on what clothes to bring on your trip can be a headache. You want to bring enough to stay comfortable but not overdo it. The trick is planning ahead and bringing clothes you can mix and match. This way, you'll be ready for anything the weekend throws at you and won't overstuff your bag.
                            </p>
                            <p className="mb-4">
                                Of course, this packing list is more of a helping suggestion than a hard rule. Everyone has different needs, so don't feel limited by the list. If you're someone who likes to pack light, that's great! But if you'd rather bring extra pieces for comfort, it's totally fine, too. These suggestions might also change depending on where you're going, what you'll be doing, or your style, so feel free to adjust them to suit your plans.
                            </p>
                            <p className="mb-4">
                                If you realize you're missing something or simply don't want to pack it, you can always shop locally while you're there. Plus you might find something unique and bring home a memorable souvenir.
                            </p>
                        </section>

                        {/* Section 4 */}
                        <section id="section4" className="blog-section mb-10">
                            <h2 className="text-2xl font-medium mb-4">How to find an Uber?</h2>
                            <p className="mb-4">
                                Deciding on what clothes to bring on your trip can be a headache. You want to bring enough to stay comfortable but not overdo it. The trick is planning ahead and bringing clothes you can mix and match. This way, you'll be ready for anything the weekend throws at you and won't overstuff your bag.
                            </p>
                            <p className="mb-4">
                                Of course, this packing list is more of a helping suggestion than a hard rule. Everyone has different needs, so don't feel limited by the list. If you're someone who likes to pack light, that's great! But if you'd rather bring extra pieces for comfort, it's totally fine, too. These suggestions might also change depending on where you're going, what you'll be doing, or your style, so feel free to adjust them to suit your plans.
                            </p>
                            <p className="mb-4">
                                If you realize you're missing something or simply don't want to pack it, you can always shop locally while you're there. Plus you might find something unique and bring home a memorable souvenir.
                            </p>
                        </section>
                    </div>

                    {/* Related Articles */}
                    <div className="mt-16">
                        <h3 className="text-2xl font-medium mb-6">Related articles</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {relatedArticles.map(article => (
                                <Link key={article.id} href={`/blog/${article.id}`} className="block group">
                                    <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                                        <div className="relative h-48">
                                            <Image
                                                src={article.image}
                                                alt={article.title}
                                                fill
                                                className="object-cover"
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

                    {/* Divider */}
                    <div className="border-t border-gray-200 my-12"></div>
                </div>

                {/* Sidebar - 1/3 width on desktop */}
                <div className="lg:col-span-1">
                    {/* Table of Contents - Desktop */}
                    <div className="hidden lg:block sticky top-24 w-[292px]">
                        <div className="border border-[#F15A25] rounded-lg p-2 mb-4">
                            <h3 className="font-medium text-lg mb-4">Table of Contents</h3>
                            <ul className="space-y-2">
                                {tableOfContents.map(item => (
                                    <li key={item.id}>
                                        <button
                                            onClick={() => scrollToSection(item.id)}
                                            className={`text-left text-sm hover:text-[#F15A25] transition-colors ${activeSection === item.id ? 'text-[#F15A25] font-medium' : 'text-gray-700'
                                                }`}
                                        >
                                            {item.title}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Promo Card */}
                        <div className="rounded-lg overflow-hidden border border-[#F15A25] h-[607px] w-[292px]">
                            <div className="bg-white p-6">
                                <h3 className="text-xl font-medium text-black">Never Pay Roaming Fees Again</h3>
                                <p className="text-black text-sm mt-2 mb-4">Get your travel eSIM today and stay connected abroad.</p>
                                <Link href="/destinations" className="inline-block bg-[#F15A25] text-white text-sm px-6 py-2 rounded-full font-medium hover:bg-[#e04e1a] transition-colors">
                                    Choose a Destination
                                </Link>
                            </div>
                            <div className=" relative">
                                <img
                                    src="/blog/promo-card.png"
                                    alt="Woman using phone with headphones"
                                    fill
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