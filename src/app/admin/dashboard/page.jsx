'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  BarChart, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  ArrowUp, 
  ArrowDown,
  Globe,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

// Admin layout component with sidebar
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    activeEsims: 0,
    recentOrders: [],
    revenueChange: 0,
    orderChange: 0,
    userChange: 0,
    topDestinations: []
  });

  useEffect(() => {
    // Check authentication and admin status
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/');
      return;
    }

    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchDashboardData();
    }
  }, [status, session, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 10000); // Divide by 10000 since 10000 = $1.00
  };

  // Loading state
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F15A25]"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Orders Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Orders</p>
                <h3 className="text-2xl font-bold mt-1">{stats.totalOrders}</h3>
                <div className="flex items-center mt-2">
                  {stats.orderChange >= 0 ? (
                    <span className="text-green-500 flex items-center text-xs">
                      <ArrowUp size={14} className="mr-1" /> {stats.orderChange}%
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center text-xs">
                      <ArrowDown size={14} className="mr-1" /> {Math.abs(stats.orderChange)}%
                    </span>
                  )}
                  <span className="text-gray-500 text-xs ml-1">vs last month</span>
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <ShoppingBag size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
          
          {/* Revenue Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
                <h3 className="text-2xl font-bold mt-1">{formatCurrency(stats.totalRevenue)}</h3>
                <div className="flex items-center mt-2">
                  {stats.revenueChange >= 0 ? (
                    <span className="text-green-500 flex items-center text-xs">
                      <ArrowUp size={14} className="mr-1" /> {stats.revenueChange}%
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center text-xs">
                      <ArrowDown size={14} className="mr-1" /> {Math.abs(stats.revenueChange)}%
                    </span>
                  )}
                  <span className="text-gray-500 text-xs ml-1">vs last month</span>
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign size={24} className="text-green-600" />
              </div>
            </div>
          </div>
          
          {/* Users Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Users</p>
                <h3 className="text-2xl font-bold mt-1">{stats.totalUsers}</h3>
                <div className="flex items-center mt-2">
                  {stats.userChange >= 0 ? (
                    <span className="text-green-500 flex items-center text-xs">
                      <ArrowUp size={14} className="mr-1" /> {stats.userChange}%
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center text-xs">
                      <ArrowDown size={14} className="mr-1" /> {Math.abs(stats.userChange)}%
                    </span>
                  )}
                  <span className="text-gray-500 text-xs ml-1">vs last month</span>
                </div>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Users size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
          
          {/* Active eSIMs Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium">Active eSIMs</p>
                <h3 className="text-2xl font-bold mt-1">{stats.activeEsims}</h3>
                <div className="flex items-center mt-2">
                  <span className="text-gray-500 text-xs">Currently active</span>
                </div>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Globe size={24} className="text-orange-600" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Orders & Top Destinations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Recent Orders</h2>
            </div>
            <div className="p-6">
              {stats.recentOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.recentOrders.map((order) => (
                        <tr key={order.orderId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                            <Link href={`/admin/orders/${order.orderId}`}>
                              {order.orderId}
                            </Link>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${order.orderStatus === 'completed' ? 'bg-green-100 text-green-800' : 
                                order.orderStatus === 'pending_payment' ? 'bg-yellow-100 text-yellow-800' : 
                                order.orderStatus === 'processing' ? 'bg-blue-100 text-blue-800' : 
                                'bg-red-100 text-red-800'}`}>
                              {order.orderStatus.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(order.finalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent orders</p>
              )}
              <div className="mt-4 text-center">
                <Link href="/admin/orders" className="text-[#F15A25] text-sm hover:underline">
                  View all orders
                </Link>
              </div>
            </div>
          </div>
          
          {/* Top Destinations */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Top Destinations</h2>
            </div>
            <div className="p-6">
              {stats.topDestinations.length > 0 ? (
                <div className="space-y-4">
                  {stats.topDestinations.map((destination, index) => (
                    <div key={destination.location} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-800">{index + 1}</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{destination.location}</p>
                          <p className="text-sm text-gray-500">{destination.count} orders</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{destination.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Sales Chart - Coming Soon */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Sales Overview</h2>
            <select className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#F15A25] focus:border-[#F15A25] p-2.5">
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
            </select>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <BarChart size={48} className="text-gray-400" />
              </div>
              <p className="text-gray-500">Sales chart coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}