'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  RefreshCw, 
  Check, 
  X, 
  Clock, 
  Globe, 
  User,
  DollarSign,
  Calendar,
  Tag,
  Wifi,
  Database,
  Send,
  Clock3
} from 'lucide-react';

// Admin layout component with sidebar
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminTopUpDetail({ params }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [topUp, setTopUp] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [confirmAction, setConfirmAction] = useState(false);
  const topUpId = params?.topUpId;

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

    if (status === 'authenticated' && session?.user?.role === 'admin' && topUpId) {
      fetchTopUpDetails();
    }
  }, [status, session, router, topUpId]);

  const fetchTopUpDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/topups/${topUpId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch top-up details');
      }
      
      const data = await response.json();
      setTopUp(data);
      setNewStatus(data.topUpStatus);
    } catch (error) {
      console.error('Error fetching top-up details:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTopUpStatus = async () => {
    if (newStatus === topUp.topUpStatus || !confirmAction) {
      return; // No change or not confirmed
    }

    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/orders/${topUpId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          note: statusNote
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update top-up status');
      }
      
      // Refresh top-up details
      await fetchTopUpDetails();
      setStatusNote('');
      setConfirmAction(false);
    } catch (error) {
      console.error('Error updating top-up status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 10000); // Divide by 10000 since 10000 = $1.00
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatDataUsage = (bytesUsed, totalBytes) => {
    if (bytesUsed === undefined || bytesUsed === null) return 'N/A';
    
    // Convert to MB
    const mbUsed = bytesUsed / (1024 * 1024);
    const mbTotal = totalBytes / (1024 * 1024);
    
    // Format with appropriate units
    let formattedUsed, formattedTotal;
    
    if (mbUsed >= 1024) {
      formattedUsed = (mbUsed / 1024).toFixed(2) + ' GB';
    } else {
      formattedUsed = mbUsed.toFixed(2) + ' MB';
    }
    
    if (mbTotal >= 1024) {
      formattedTotal = (mbTotal / 1024).toFixed(2) + ' GB';
    } else {
      formattedTotal = mbTotal.toFixed(2) + ' MB';
    }
    
    return `${formattedUsed} of ${formattedTotal}`;
  };

  // Top-up status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Payment status badge color
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  // Top-up not found
  if (!topUp) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center p-6">
          <h1 className="text-2xl font-bold mb-4">Top-up Not Found</h1>
          <p className="text-gray-600 mb-6">The top-up you're looking for does not exist or you don't have permission to view it.</p>
          <Link
            href="/admin/topups"
            className="flex items-center text-[#F15A25] hover:underline"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Top-ups
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header with back button */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <Link
              href="/admin/topups"
              className="mr-4 p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold">Top-up Details</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={fetchTopUpDetails}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </button>
          </div>
        </div>
        
        {/* Top-up summary and actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Top-up summary */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Top-up #{topUp.topUpId}</h2>
                  <p className="text-sm text-gray-500">
                    Placed on {formatDate(topUp.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(topUp.topUpStatus)}`}>
                    {topUp.topUpStatus}
                  </span>
                  <span className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(topUp.paymentStatus)}`}>
                    Payment: {topUp.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Package details */}
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-md font-semibold mb-4 flex items-center">
                <Globe size={18} className="mr-2 text-gray-500" />
                Top-up Package Details
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Package Name</p>
                    <p className="font-medium">{topUp.packageName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Location</p>
                    <p className="font-medium">{topUp.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Data Amount</p>
                    <p className="font-medium">{topUp.dataAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Duration</p>
                    <p className="font-medium">{topUp.duration}</p>
                  </div>
                </div>
              </div>
              
              {/* eSIM details */}
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">eSIM Details</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">ICCID</p>
                      <p className="font-medium font-mono">{topUp.iccid}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Transaction ID</p>
                      <p className="font-medium font-mono">{topUp.transactionId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Original Order ID</p>
                      <p className="font-medium">
                        <Link href={`/admin/orders/${topUp.orderId}`} className="text-blue-600 hover:underline">
                          {topUp.orderId}
                        </Link>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">eSIM Transaction Number</p>
                      <p className="font-medium">{topUp.esimTranNo || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Provider response details if available */}
              {topUp.providerResponse && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-2">Provider Response</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Expiry Date</p>
                        <p className="font-medium">{topUp.providerResponse.expiredTime || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Total Volume</p>
                        <p className="font-medium">
                          {topUp.providerResponse.totalVolume 
                            ? `${(topUp.providerResponse.totalVolume / (1024 * 1024 * 1024)).toFixed(2)} GB` 
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Total Duration</p>
                        <p className="font-medium">
                          {topUp.providerResponse.totalDuration 
                            ? `${topUp.providerResponse.totalDuration} days` 
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Usage</p>
                        <p className="font-medium">
                          {formatDataUsage(
                            topUp.providerResponse.orderUsage,
                            topUp.providerResponse.totalVolume
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Price details */}
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-md font-semibold mb-4 flex items-center">
                <DollarSign size={18} className="mr-2 text-gray-500" />
                Price Details
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <p className="text-sm text-gray-600">Original Price</p>
                  <p className="text-sm">{formatCurrency(topUp.originalPrice)}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-sm text-gray-600">Markup</p>
                  <p className="text-sm">{formatCurrency(topUp.markupAmount)}</p>
                </div>
                {topUp.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Discount</p>
                    <p className="text-sm text-green-600">-{formatCurrency(topUp.discountAmount)}</p>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <p className="font-medium">Total</p>
                  <p className="font-medium">{formatCurrency(topUp.finalPrice)}</p>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <p>Payment Method</p>
                  <p className="capitalize">{topUp.paymentMethod}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Top-up actions panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Customer info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-md font-semibold mb-4 flex items-center">
                <User size={18} className="mr-2 text-gray-500" />
                Customer Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Name</p>
                  <p className="font-medium">{topUp.userName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="font-medium">{topUp.userEmail || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">User ID</p>
                  <p className="font-medium text-sm">{topUp.userId || 'N/A'}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  href={`/admin/users/${topUp.userId}`}
                  className="text-[#F15A25] text-sm hover:underline flex items-center"
                >
                  View Customer Profile
                </Link>
              </div>
            </div>
            
            {/* Update status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-md font-semibold mb-4 flex items-center">
                <Tag size={18} className="mr-2 text-gray-500" />
                Update Top-up Status
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#F15A25] focus:border-[#F15A25] sm:text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                    Note (optional)
                  </label>
                  <textarea
                    id="note"
                    rows={3}
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Add a note about this status change"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#F15A25] focus:border-[#F15A25] sm:text-sm"
                  />
                </div>
                
                {newStatus !== topUp.topUpStatus && (
                  <div className="flex items-center">
                    <input
                      id="confirm-action"
                      type="checkbox"
                      checked={confirmAction}
                      onChange={(e) => setConfirmAction(e.target.checked)}
                      className="h-4 w-4 text-[#F15A25] focus:ring-[#F15A25] border-gray-300 rounded"
                    />
                    <label htmlFor="confirm-action" className="ml-2 block text-sm text-gray-700">
                      I confirm this status change
                    </label>
                  </div>
                )}
                
                <button
                  onClick={updateTopUpStatus}
                  disabled={updating || newStatus === topUp.topUpStatus || !confirmAction}
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#F15A25] hover:bg-[#E04E1A] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <>
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Send size={16} className="mr-2" />
                      Update Status
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Data usage panel if available */}
            {topUp.providerResponse && topUp.providerResponse.orderUsage !== undefined && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-md font-semibold mb-4 flex items-center">
                  <Database size={18} className="mr-2 text-gray-500" />
                  Data Usage
                </h3>
                
                {/* Usage progress bar */}
                <div className="mb-4">
                  {topUp.providerResponse.totalVolume && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ 
                          width: `${Math.min(100, (topUp.providerResponse.orderUsage / topUp.providerResponse.totalVolume) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>
                      {topUp.providerResponse.orderUsage 
                        ? `${(topUp.providerResponse.orderUsage / (1024 * 1024)).toFixed(2)} MB used` 
                        : '0 MB used'}
                    </span>
                    <span>
                      {topUp.providerResponse.totalVolume 
                        ? `${(topUp.providerResponse.totalVolume / (1024 * 1024 * 1024)).toFixed(2)} GB total` 
                        : 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Usage Percentage</p>
                    <p className="text-xl font-bold">
                      {topUp.providerResponse.totalVolume
                        ? `${((topUp.providerResponse.orderUsage / topUp.providerResponse.totalVolume) * 100).toFixed(1)}%`
                        : 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Time Remaining</p>
                    <p className="text-xl font-bold flex items-center">
                      <Clock3 size={16} className="mr-2 text-gray-400" />
                      {topUp.providerResponse.expiredTime
                        ? (() => {
                            const expiryDate = new Date(topUp.providerResponse.expiredTime);
                            const now = new Date();
                            const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                            return diffDays > 0 ? `${diffDays} days` : 'Expired';
                          })()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Additional top-up information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-md font-semibold mb-4">Additional Information</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">Payment Intent ID</td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{topUp.paymentIntentId || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">Original Order ID</td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    <Link href={`/admin/orders/${topUp.orderId}`} className="text-blue-600 hover:underline">
                      {topUp.orderId}
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">Package Code</td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{topUp.packageCode || 'N/A'}</td>
                </tr>
                {topUp.failureReason && (
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">Failure Reason</td>
                    <td className="px-4 py-3 text-sm text-red-500">{topUp.failureReason}</td>
                  </tr>
                )}
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">Created At</td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(topUp.createdAt)}</td>
                </tr>
                {topUp.updatedAt && (
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">Last Updated</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(topUp.updatedAt)}</td>
                  </tr>
                )}
                {topUp.completedAt && (
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">Completed At</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(topUp.completedAt)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Timeline */}
        {topUp.timeline && topUp.timeline.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h3 className="text-md font-semibold mb-4 flex items-center">
              <Calendar size={18} className="mr-2 text-gray-500" />
              Top-up Timeline
            </h3>
            
            <div className="relative">
              <div className="absolute top-0 bottom-0 left-3 w-0.5 bg-gray-200"></div>
              <ul className="space-y-6 relative">
                {topUp.timeline.map((event, index) => (
                  <li key={index} className="pl-8 relative">
                    <div className="absolute left-0 top-1 h-6 w-6 rounded-full flex items-center justify-center">
                      {event.type === 'status_change' ? (
                        <Clock size={20} className="text-blue-500" />
                      ) : event.status === 'completed' ? (
                        <Check size={20} className="text-green-500" />
                      ) : event.status === 'failed' ? (
                        <X size={20} className="text-red-500" />
                      ) : (
                        <Clock size={20} className="text-gray-500" />
                      )}
                    </div>
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-gray-500">{formatDate(event.timestamp)}</p>
                    {event.note && (
                      <p className="text-sm text-gray-600 mt-1">{event.note}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}