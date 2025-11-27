'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Users,
  Globe,
  TrendingUp,
  Calendar,
  MapPin,
  Activity,
  RefreshCw,
  Download
} from 'lucide-react';

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 90d, all
  const [analytics, setAnalytics] = useState({
    totalVisitors: 0,
    uniqueVisitors: 0,
    pageViews: 0,
    topCountries: [],
    topPages: [],
    recentVisitors: [],
    visitorsByDate: [],
    deviceStats: { desktop: 0, mobile: 0, tablet: 0 },
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
      fetchAnalytics();
    }
  }, [status, session, router, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?range=${dateRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    // Create CSV export
    const csvData = analytics.topCountries.map(country => 
      `${country.country},${country.visitors},${country.percentage}`
    ).join('\n');
    
    const blob = new Blob([`Country,Visitors,Percentage\n${csvData}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F15A25]"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Track your website visitors and engagement</p>
          </div>
          
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            {/* Date Range Selector */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-[#F15A25] focus:border-[#F15A25]"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>

            <button
              onClick={fetchAnalytics}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
              title="Refresh"
            >
              <RefreshCw size={20} />
            </button>

            <button
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 bg-[#F15A25] text-white rounded-md hover:bg-[#E04E1A]"
            >
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Visitors"
            value={analytics.totalVisitors.toLocaleString()}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Unique Visitors"
            value={analytics.uniqueVisitors.toLocaleString()}
            icon={Activity}
            color="green"
          />
          <StatCard
            title="Page Views"
            value={analytics.pageViews.toLocaleString()}
            icon={TrendingUp}
            color="purple"
          />
          <StatCard
            title="Countries"
            value={analytics.topCountries.length}
            icon={Globe}
            color="orange"
          />
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Countries */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <MapPin size={20} className="mr-2 text-gray-500" />
              Top Countries
            </h2>
            <div className="space-y-3">
              {analytics.topCountries.slice(0, 10).map((country, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{country.flag}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{country.country}</span>
                        <span className="text-sm text-gray-600">{country.visitors}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#F15A25] h-2 rounded-full"
                          style={{ width: `${country.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Pages */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Activity size={20} className="mr-2 text-gray-500" />
              Top Pages
            </h2>
            <div className="space-y-3">
              {analytics.topPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{page.path}</p>
                    <p className="text-xs text-gray-500">{page.views} views</p>
                  </div>
                  <div className="ml-4 text-sm text-gray-600">
                    {((page.views / analytics.pageViews) * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Device Stats */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Device Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DeviceStatCard
              device="Desktop"
              count={analytics.deviceStats.desktop}
              total={analytics.totalVisitors}
            />
            <DeviceStatCard
              device="Mobile"
              count={analytics.deviceStats.mobile}
              total={analytics.totalVisitors}
            />
            <DeviceStatCard
              device="Tablet"
              count={analytics.deviceStats.tablet}
              total={analytics.totalVisitors}
            />
          </div>
        </div>

        {/* Recent Visitors */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Calendar size={20} className="mr-2 text-gray-500" />
            Recent Visitors
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.recentVisitors.map((visitor, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(visitor.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="mr-2">{visitor.flag}</span>
                      {visitor.country}, {visitor.city}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{visitor.page}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{visitor.device}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

function DeviceStatCard({ device, count, total }) {
  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
  
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <p className="text-sm text-gray-600 mb-2">{device}</p>
      <p className="text-xl font-bold text-gray-900 mb-2">{count.toLocaleString()}</p>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-[#F15A25] h-2 rounded-full"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-1">{percentage}%</p>
    </div>
  );
}