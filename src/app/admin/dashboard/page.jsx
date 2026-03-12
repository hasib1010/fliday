'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  ShoppingBag,
  Users,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Globe,
  Activity,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState('all');
  const [stats, setStats] = useState({
    selectedRange: 'all',
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    activeEsims: 0,
    recentOrders: [],
    revenueChange: 0,
    orderChange: 0,
    userChange: 0,
    topDestinations: [],
    averageOrderValue: 0,
    paidOrdersInRange: 0,
    paidTopUpsInRange: 0,
    isAllTime: true,
  });

  useEffect(() => {
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
  }, [status, session, router, selectedRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/dashboard?range=${selectedRange}`);

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
      currency: 'USD',
    }).format((amount || 0) / 10000);
  };

  const rangeLabel = stats.isAllTime ? 'all time' : `last ${selectedRange} days`;

  const renderChange = (value) => {
    if (stats.isAllTime) {
      return (
        <div className="flex items-center mt-2">
          <span className="text-gray-500 text-xs">All time</span>
        </div>
      );
    }

    const isPositive = value >= 0;

    return (
      <div className="flex items-center mt-2">
        {isPositive ? (
          <span className="text-green-600 flex items-center text-xs font-medium">
            <ArrowUp size={14} className="mr-1" />
            {value}%
          </span>
        ) : (
          <span className="text-red-600 flex items-center text-xs font-medium">
            <ArrowDown size={14} className="mr-1" />
            {Math.abs(value)}%
          </span>
        )}
        <span className="text-gray-500 text-xs ml-1">
          vs previous {selectedRange} days
        </span>
      </div>
    );
  };

  const getStatusBadge = (statusValue) => {
    if (statusValue === 'completed') return 'bg-green-100 text-green-700';
    if (statusValue === 'pending_payment') return 'bg-yellow-100 text-yellow-700';
    if (statusValue === 'processing') return 'bg-blue-100 text-blue-700';
    return 'bg-red-100 text-red-700';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-8 w-40 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 w-64 bg-gray-200 rounded"></div>
              </div>
              <div className="h-10 w-40 bg-gray-200 rounded-xl"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 w-20 bg-gray-200 rounded mb-3"></div>
                  <div className="h-3 w-28 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 h-80"></div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 h-80"></div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 h-72"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
              Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Track performance, monitor transactions, and review growth for {rangeLabel}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
              <Activity className="w-4 h-4 text-[#F15A25]" />
              <select
                value={selectedRange}
                onChange={(e) => setSelectedRange(e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none"
              >
                <option value="all">All time</option>
                <option value="15">Last 15 days</option>
                <option value="30">Last 30 days</option>
                <option value="60">Last 60 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Orders</p>
                <h3 className="text-3xl font-semibold text-gray-900 mt-2">
                  {stats.totalOrders}
                </h3>
                {renderChange(stats.orderChange)}
              </div>
              <div className="bg-blue-50 p-3 rounded-2xl">
                <ShoppingBag size={22} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Revenue</p>
                <h3 className="text-3xl font-semibold text-gray-900 mt-2">
                  {formatCurrency(stats.totalRevenue)}
                </h3>
                {renderChange(stats.revenueChange)}
              </div>
              <div className="bg-green-50 p-3 rounded-2xl">
                <DollarSign size={22} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  {stats.isAllTime ? 'Users' : 'New Users'}
                </p>
                <h3 className="text-3xl font-semibold text-gray-900 mt-2">
                  {stats.totalUsers}
                </h3>
                {renderChange(stats.userChange)}
              </div>
              <div className="bg-purple-50 p-3 rounded-2xl">
                <Users size={22} className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Active eSIMs</p>
                <h3 className="text-3xl font-semibold text-gray-900 mt-2">
                  {stats.activeEsims}
                </h3>
                <div className="flex items-center mt-2">
                  <span className="text-gray-500 text-xs">Currently active</span>
                </div>
              </div>
              <div className="bg-orange-50 p-3 rounded-2xl">
                <Globe size={22} className="text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Avg. Order Value</p>
                <h3 className="text-3xl font-semibold text-gray-900 mt-2">
                  {formatCurrency(stats.averageOrderValue)}
                </h3>
                <div className="flex items-center mt-2">
                  <span className="text-gray-500 text-xs">
                    {stats.paidOrdersInRange + stats.paidTopUpsInRange} paid transactions
                  </span>
                </div>
              </div>
              <div className="bg-[#FFF1ED] p-3 rounded-2xl">
                <CreditCard size={22} className="text-[#F15A25]" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <p className="text-sm font-medium text-gray-500 mb-2">Paid Orders</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-semibold text-gray-900">
                {stats.paidOrdersInRange}
              </h3>
              <span className="text-xs text-gray-500 capitalize">{rangeLabel}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <p className="text-sm font-medium text-gray-500 mb-2">Paid Top-ups</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-semibold text-gray-900">
                {stats.paidTopUpsInRange}
              </h3>
              <span className="text-xs text-gray-500 capitalize">{rangeLabel}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Latest orders and top-ups across the platform
                </p>
              </div>
              <Link
                href="/admin/orders"
                className="text-sm font-medium text-[#F15A25] hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="p-6">
              {stats.recentOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentOrders.map((order) => (
                        <tr
                          key={order.orderId}
                          className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/70 transition-colors"
                        >
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-[#F15A25]">
                            <Link href={`/admin/orders/${order.orderId}`}>
                              {order.orderId}
                            </Link>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusBadge(
                                order.orderStatus
                              )}`}
                            >
                              {order.orderStatus.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                            {formatCurrency(order.finalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No recent transactions</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Orders and top-ups will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Top Destinations</h2>
              <p className="text-sm text-gray-500 mt-1">
                Best-performing destinations for {rangeLabel}
              </p>
            </div>

            <div className="p-6">
              {stats.topDestinations.length > 0 ? (
                <div className="space-y-5">
                  {stats.topDestinations.map((destination, index) => (
                    <div key={destination.code || destination.location}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center min-w-0">
                          <div className="h-8 w-8 rounded-full bg-[#FFF1ED] text-[#F15A25] flex items-center justify-center text-sm font-semibold flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="ml-3 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {destination.location}
                            </p>
                            <p className="text-xs text-gray-500">
                              {destination.count} transactions
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {destination.percentage}%
                        </span>
                      </div>

                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-[#F15A25] h-2 rounded-full transition-all"
                          style={{ width: `${destination.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Globe className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No destination data</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Completed transactions will populate this section.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Sales Overview</h2>
              <p className="text-sm text-gray-500 mt-1">
                Revenue and transaction trends visualization
              </p>
            </div>

            <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <BarChart3 className="w-4 h-4" />
              Range: {rangeLabel}
            </div>
          </div>

          <div className="h-72 rounded-2xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
            <div className="text-center max-w-sm px-6">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                  <BarChart3 size={28} className="text-gray-400" />
                </div>
              </div>
              <p className="text-gray-700 font-medium">Sales chart coming soon</p>
              <p className="text-sm text-gray-500 mt-2">
                Your dashboard now supports all-time and custom time range analytics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}