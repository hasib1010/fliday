'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { User, ChevronDown, LogOut, Settings, ShoppingBag, Users, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === '/';
  const isCheckoutPage = pathname === '/checkout';
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isAdmin = session?.user?.role === 'admin';

  // Create refs for the menus and buttons
  const profileMenuRef = useRef(null);
  const profileButtonRef = useRef(null);
  const mobileProfileMenuRef = useRef(null);
  const mobileProfileButtonRef = useRef(null);

  const handleSignOut = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling

    try {
      // Close the menu first
      setIsProfileMenuOpen(false);

      // Navigate to home page first, then perform signout
      router.push('/');

      // Short delay to ensure navigation happens before signout
      setTimeout(async () => {
        await signOut({
          redirect: false,
          callbackUrl: '/'
        });
      }, 100);
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  // Handle menu item click
  const handleMenuItemClick = (e) => {
    // We don't need to immediately close the menu here
    // Let navigation happen naturally which will unmount the component
    // This prevents the issue of buttons not working
  };

  // Add scroll event listener to track scroll position
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check in case the page loads with scroll position
    handleScroll();
    setIsMounted(true);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if we clicked inside the menu or button
      const clickedInDesktopMenu = profileMenuRef.current && profileMenuRef.current.contains(event.target);
      const clickedOnDesktopButton = profileButtonRef.current && profileButtonRef.current.contains(event.target);
      const clickedInMobileMenu = mobileProfileMenuRef.current && mobileProfileMenuRef.current.contains(event.target);
      const clickedOnMobileButton = mobileProfileButtonRef.current && mobileProfileButtonRef.current.contains(event.target);

      // Only close if clicked outside both the menu and the button
      if (isProfileMenuOpen &&
        !clickedInDesktopMenu &&
        !clickedOnDesktopButton &&
        !clickedInMobileMenu &&
        !clickedOnMobileButton) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Close profile menu when opening mobile menu
    if (!isMobileMenuOpen) {
      setIsProfileMenuOpen(false);
    }
  };

  const toggleProfileMenu = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const navLinks = [
    { href: '/how-it-works', label: 'How it works' },
    { href: '/support', label: 'Support' },
    { href: '/faq', label: 'FAQ' },
    { href: '/compatibility', label: 'Compatibility' },
    { href: '/blog', label: 'Blog' },
  ];

  // Helper function to check if path starts with a specific route
  const isActiveLink = (href) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  if (!isMounted) return null;

  // For checkout page, render a simplified navbar with only the logo
  if (isCheckoutPage) {
    return (
      <>
        <nav className="fixed min-w-[300px] w-full top-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
            <div className="flex justify-start items-center h-16">
              {/* Logo centered for checkout page */}
              <div className="flex-shrink-0">
                <Link href="/" className="flex items-center">
                  <div className="relative h-10 w-24"> {/* Fixed dimensions logo container */}
                    <Image
                      src="/logo.png"
                      alt="Company Logo"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </>
    );
  }

  // Regular navbar for all other pages
  return (
    <>
      <nav
        className={`fixed max-h-16 w-full top-0 z-50 transition-colors duration-300 border-b ${isScrolled
            ? 'bg-white border-gray-200'
            : 'bg-transparent border-transparent'
          }`}
      >
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <div className="relative h-10 w-24"> {/* Fixed dimensions logo container */}
                  <Image
                    src="/logo.png"
                    alt="Company Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex space-x-8 items-center">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-medium text-[.875rem] transition-colors ${isActiveLink(link.href)
                      ? 'text-[#F15A25]'
                      : 'text-black hover:text-[#F15A25]'
                    }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/destinations"
                className={`rounded-[30px] px-6 py-2 border font-medium text-[.875rem] hover:bg-gray-100 transition-colors ${isActiveLink('/destinations')
                    ? 'text-[#F15A25] border-[#F15A25]'
                    : 'text-black border-black hover:text-[#F15A25] hover:border-[#F15A25]'
                  }`}
              >
                View Destinations
              </Link>
              {!isAuthenticated && (
                <Link
                  href="/auth/signin"
                  className="font-medium text-[.875rem] px-4 py-2 bg-[#F15A25] text-white rounded-[30px] text-center hover:bg-[#E04E1A] transition-colors"
                >
                  Sign In
                </Link>
              )}

              {/* User Profile or Login */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    id="profile-button"
                    ref={profileButtonRef}
                    onClick={toggleProfileMenu}
                    className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-gray-100 cursor-pointer hover:shadow-sm"
                  >
                    <div className="relative h-8 w-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 hover:border-gray-300 transition-colors duration-200">
                      {session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || 'User'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <User size={20} className="text-gray-500" />
                      )}
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-gray-500 transition-all duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Profile dropdown menu */}
                  {isProfileMenuOpen && (
                    <div
                      id="profile-menu"
                      ref={profileMenuRef}
                      className="absolute right-0 mt-2 w-60  bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200 transition-all duration-200 origin-top-right transform opacity-0 scale-95 animate-fade-in"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {session.user.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {session.user.email}
                        </p>
                      </div>

                      {isAdmin ? (
                        // Admin menu items
                        <div className="py-1">
                          <Link
                            href="/admin/dashboard"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                            onClick={handleMenuItemClick}
                          >
                            <LayoutDashboard size={16} className="mr-3 text-gray-500" />
                            Dashboard
                          </Link>
                          <Link
                            href="/admin/orders"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                            onClick={handleMenuItemClick}
                          >
                            <ShoppingBag size={16} className="mr-3 text-gray-500" />
                            Orders
                          </Link>
                          <Link
                            href="/admin/users"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                            onClick={handleMenuItemClick}
                          >
                            <Users size={16} className="mr-3 text-gray-500" />
                            Users
                          </Link>
                          <Link
                            href="/admin/settings"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                            onClick={handleMenuItemClick}
                          >
                            <Settings size={16} className="mr-3 text-gray-500" />
                            Settings
                          </Link>
                        </div>
                      ) : (
                        // Regular user menu items
                        <div className="py-1">
                          <Link
                            href="/orders"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                            onClick={handleMenuItemClick}
                          >
                            <ShoppingBag size={16} className="mr-3 text-gray-500" />
                            My Orders
                          </Link>
                        </div>
                      )}

                      {/* Common menu items for both admin and regular users */}
                      <div className="py-1 border-t border-gray-100">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-50 w-full text-left transition-colors duration-150"
                        >
                          <LogOut size={16} className="mr-3 text-red-500" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                ""
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-4">
              {/* Add profile button for mobile */}
              {isAuthenticated && (
                <div className="relative">
                  <button
                    id="profile-button-mobile"
                    ref={mobileProfileButtonRef}
                    onClick={toggleProfileMenu}
                    className="flex items-center justify-center rounded-full hover:bg-gray-100 p-1.5 transition-colors"
                  >
                    <div className="relative h-7 w-7 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                      {session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || 'User'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <User size={16} className="text-gray-500" />
                      )}
                    </div>
                  </button>

                  {/* Mobile profile dropdown menu */}
                  {isProfileMenuOpen && (
                    <div
                      id="profile-menu-mobile"
                      ref={mobileProfileMenuRef}
                      className="absolute right-0 mt-2 w-60 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                      onClick={(e) => e.stopPropagation()} // Prevent clicks inside menu from closing it
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {session.user.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {session.user.email}
                        </p>
                      </div>

                      {isAdmin ? (
                        // Admin menu items for mobile
                        <div className="py-1">
                          <Link
                            href="/admin/dashboard"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={handleMenuItemClick}
                          >
                            <LayoutDashboard size={16} className="mr-3 text-gray-500" />
                            Dashboard
                          </Link>
                          <Link
                            href="/admin/orders"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={handleMenuItemClick}
                          >
                            <ShoppingBag size={16} className="mr-3 text-gray-500" />
                            Orders
                          </Link>
                          <Link
                            href="/admin/users"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={handleMenuItemClick}
                          >
                            <Users size={16} className="mr-3 text-gray-500" />
                            Users
                          </Link>
                          <Link
                            href="/admin/settings"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={handleMenuItemClick}
                          >
                            <Settings size={16} className="mr-3 text-gray-500" />
                            Settings
                          </Link>
                        </div>
                      ) : (
                        // Regular user menu items for mobile
                        <div className="py-1">
                          <Link
                            href="/orders"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={handleMenuItemClick}
                          >
                            <ShoppingBag size={16} className="mr-3 text-gray-500" />
                            My Orders
                          </Link>
                        </div>
                      )}

                      {/* Common menu items for mobile */}
                      <div className="py-1 border-t border-gray-100">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                        >
                          <LogOut size={16} className="mr-3 text-red-500" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
            <div className="lg:hidden bg-white shadow-lg rounded-lg mt-2 py-4 px-2 transition-all duration-300 ease-in-out">
              <div className="flex flex-col space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`font-medium text-[.875rem] px-4 py-2 hover:bg-gray-100 rounded-md transition-colors ${isActiveLink(link.href)
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
                  className={`font-medium text-[.875rem] px-4 py-2 border rounded-[30px] text-center hover:bg-gray-100 mx-4 transition-colors ${isActiveLink('/destinations')
                      ? 'text-[#F15A25] border-[#F15A25]'
                      : 'text-black border-black'
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  View Destinations
                </Link>

                {/* Show login button in mobile menu if not authenticated */}
                {!isAuthenticated && (
                  <Link
                    href="/auth/signin"
                    className="font-medium text-[.875rem] px-4 py-2 bg-[#F15A25] text-white rounded-[30px] text-center hover:bg-[#E04E1A] mx-4 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}