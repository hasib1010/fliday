'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navLinks = [
    { href: '/how-it-works', label: 'How it works' },
    { href: '/recharge', label: 'Recharge' },
    { href: '/support', label: 'Support' },
    { href: '/faq', label: 'FAQ' },
    { href: '/blog', label: 'Blog' },
  ];

  // Helper function to check if path starts with a specific route
  const isActiveLink = (href) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className={` }`}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                width={100}
                height={100}
                src="/logo.png"
                alt="Company Logo"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex space-x-8 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-medium text-[.875rem] transition-colors ${
                  isActiveLink(link.href)
                    ? 'text-[#F15A25]'
                    : 'text-black hover:text-[#F15A25]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/destinations"
              className={`rounded-[30px] px-6 py-2 border font-medium text-[.875rem] hover:bg-gray-100 transition-colors ${
                isActiveLink('/destinations')
                  ? 'text-[#F15A25] border-[#F15A25]'
                  : 'text-black border-black hover:text-[#F15A25] hover:border-[#F15A25]'
              }`}
            >
              View Destinations
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-black focus:outline-none"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white shadow-lg rounded-lg mt-2 py-4 px-2 transition-all duration-300 ease-in-out">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-medium text-[.875rem] px-4 py-2 hover:bg-gray-100 rounded-md transition-colors ${
                    isActiveLink(link.href)
                      ? 'text-[#F15A25]'
                      : 'text-black'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/destinations"
                className={`font-medium text-[.875rem] px-4 py-2 border rounded-[30px] text-center hover:bg-gray-100 mx-4 transition-colors ${
                  isActiveLink('/destinations')
                    ? 'text-[#F15A25] border-[#F15A25]'
                    : 'text-black border-black'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                View Destinations
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}