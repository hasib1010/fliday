'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Settings,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Bell,
  CreditCard,
  HelpCircle,
  BarChart,
  Globe,
  RefreshCw,
  DollarSign,
  Tag,
  Edit
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [ordersSubmenuOpen, setOrdersSubmenuOpen] = useState(false);
  const [settingsSubmenuOpen, setSettingsSubmenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();

  // Close sidebar on route change or on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pathname]);

  // Auto-expand relevant submenus based on current path
  useEffect(() => {
    if (pathname.startsWith('/admin/orders')) {
      setOrdersSubmenuOpen(true);
    }
    if (pathname.startsWith('/admin/settings')) {
      setSettingsSubmenuOpen(true);
    }
  }, [pathname]);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    try {
      await signOut({ redirect: false });
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const mainNavigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    {
      name: 'Orders & eSIMs',
      href: '#',
      icon: ShoppingBag,
      hasSubmenu: true,
      submenuKey: 'orders',
      submenu: [
        { name: 'All Orders', href: '/admin/orders' },
        { name: 'Top-ups', href: '/admin/topups' },
      ],
    },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Blog', href: '/admin/blog', icon: Edit }, // Add Blog route
    {
      name: 'Settings',
      href: '#',
      icon: Settings,
      hasSubmenu: true,
      submenuKey: 'settings',
      submenu: [
        { name: 'General', href: '/admin/settings' },
      ],
    },
  ];

  const secondaryNavigation = [
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart },
    { name: 'Destinations', href: '/admin/destinations', icon: Globe },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard },
    { name: 'Coupons', href: '/admin/coupons', icon: Tag },
    { name: 'Help Center', href: '/admin/help', icon: HelpCircle },
  ];

  const isActive = (path) => {
    if (path === '#') return false;
    if (path === '/admin/dashboard') return pathname === path;
    return pathname.startsWith(path);
  };

  const toggleSubmenu = (key) => {
    if (key === 'orders') {
      setOrdersSubmenuOpen(!ordersSubmenuOpen);
    } else if (key === 'settings') {
      setSettingsSubmenuOpen(!settingsSubmenuOpen);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-100">


      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-fit h-fit bg-white shadow-lg transition-transform duration-300 transform lg:transform-none lg:relative lg:flex ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <Link href="/" className="flex items-center">
              <Image
                width={80}
                height={80}
                src="/logo.png"
                alt="Company Logo"
                priority
              />
            </Link>
            <button
              className="lg:hidden text-gray-500 hover:text-gray-600"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={24} />
            </button>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 px-3 py-4 overflow-y-auto">
            {/* Main Navigation */}
            <div className="mb-6">
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Main
              </h3>
              <nav className="mt-2 space-y-1">
                {mainNavigation.map((item) => {
                  const Icon = item.icon;
                  const isItemActive = isActive(item.href);
                  const isSubmenuOpen = item.submenuKey === 'orders'
                    ? ordersSubmenuOpen
                    : item.submenuKey === 'settings'
                      ? settingsSubmenuOpen
                      : false;

                  return (
                    <div key={item.name}>
                      {item.hasSubmenu ? (
                        <button
                          onClick={() => toggleSubmenu(item.submenuKey)}
                          className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-md transition-colors ${isItemActive || isSubmenuOpen
                            ? 'bg-[#FFF1ED] text-[#F15A25]'
                            : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                          <div className="flex items-center">
                            <Icon
                              size={20}
                              className={`mr-3 ${isItemActive || isSubmenuOpen ? 'text-[#F15A25]' : 'text-gray-500'
                                }`}
                            />
                            {item.name}
                          </div>
                          <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${isSubmenuOpen ? 'rotate-180' : ''}`}
                          />
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${isItemActive
                            ? 'bg-[#FFF1ED] text-[#F15A25]'
                            : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                          <Icon
                            size={20}
                            className={`mr-3 ${isItemActive ? 'text-[#F15A25]' : 'text-gray-500'
                              }`}
                          />
                          {item.name}
                        </Link>
                      )}

                      {/* Submenu */}
                      {item.hasSubmenu && (
                        <div
                          className={`pl-10 mt-1 space-y-1 overflow-hidden transition-all duration-200 ${isSubmenuOpen ? 'max-h-40' : 'max-h-0'
                            }`}
                        >
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className={`flex items-center py-2 text-sm font-medium rounded-md transition-colors ${isActive(subItem.href)
                                ? 'text-[#F15A25]'
                                : 'text-gray-600 hover:text-[#F15A25]'
                                }`}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>

            {/* Secondary Navigation */}
            <div>
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Coming Soon
              </h3>
              <nav className="mt-2 space-y-1">
                {secondaryNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive(item.href)
                        ? 'bg-[#FFF1ED] text-[#F15A25]'
                        : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <Icon
                        size={18}
                        className={`mr-3 ${isActive(item.href) ? 'text-[#F15A25]' : 'text-gray-500'
                          }`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gray-200 relative overflow-hidden">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'Admin User'}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Users size={18} className="text-gray-500" />
                  </div>
                )}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session?.user?.name || 'Admin User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session?.user?.email || 'admin@example.com'}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1 rounded-full text-gray-500 hover:text-red-600 hover:bg-gray-100"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col ">
        {/* Top navigation */}

        {/* Page content */}
        <main className="flex-1 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}