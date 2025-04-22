'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, 
  RefreshCw, 
  User, 
  Mail, 
  Calendar, 
  ShoppingBag,
  Check,
  AlertTriangle,
  UserCheck,
  Shield,
  UserX
} from 'lucide-react';

// Admin layout component with sidebar
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminUserDetail({ params }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [user, setUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [newRole, setNewRole] = useState('');
  const [confirmAction, setConfirmAction] = useState(false);
  const userId = params?.userId;

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

    if (status === 'authenticated' && session?.user?.role === 'admin' && userId) {
      fetchUserDetails();
    }
  }, [status, session, router, userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }
      
      const data = await response.json();
      setUser(data.user);
      setUserOrders(data.orders || []);
      setNewRole(data.user.role);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async () => {
    if (newRole === user.role || !confirmAction) {
      return; // No change or not confirmed
    }

    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: newRole
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user role');
      }
      
      // Refresh user details
      await fetchUserDetails();
      setConfirmAction(false);
    } catch (error) {
      console.error('Error updating user role:', error);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 10000); // Divide by 10000 since 10000 = $1.00
  };

  // Total spent by user
  const totalSpent = userOrders.reduce((total, order) => {
    return total + (order.finalPrice || 0);
  }, 0);

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

  // User not found
  if (!user) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center p-6">
          <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
          <p className="text-gray-600 mb-6">The user you're looking for does not exist or you don't have permission to view it.</p>
          <Link
            href="/admin/users"
            className="flex items-center text-[#F15A25] hover:underline"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Users
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
              href="/admin/users"
              className="mr-4 p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold">User Details</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={fetchUserDetails}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </button>
          </div>
        </div>
        
        {/* User profile and actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* User profile */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start gap-6">
                <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-100">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <User size={40} className="text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-1">{user.name}</h2>
                  <div className="flex items-center mb-2">
                    <Mail size={16} className="text-gray-400 mr-2" />
                    <p className="text-gray-600">{user.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                      {user.provider}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* User information */}
            <div className="p-6">
              <h3 className="text-md font-semibold mb-4">User Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">User ID</p>
                  <p className="font-medium text-sm break-all">{user._id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Provider ID</p>
                  <p className="font-medium text-sm break-all">{user.providerId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Joined</p>
                  <p className="font-medium">{formatDate(user.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Last Login</p>
                  <p className="font-medium">{formatDate(user.lastLogin)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                  <p className="font-medium">{user.phoneNumber || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* User actions panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* User stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-md font-semibold mb-4">User Stats</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                  <p className="text-2xl font-bold">{userOrders.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Spent</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalSpent)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Active eSIMs</p>
                  <p className="text-2xl font-bold">{userOrders.filter(order => 
                    order.orderStatus === 'completed' && 
                    order.esimDetails && 
                    order.esimDetails.esimStatus !== 'expired'
                  ).length}</p>
                </div>
              </div>
            </div>
            
            {/* Update role */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-md font-semibold mb-4">Update User Role</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    id="role"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#F15A25] focus:border-[#F15A25] sm:text-sm"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                {/* Warning and confirmation */}
                {newRole !== user.role && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertTriangle size={20} className="text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          Are you sure you want to change this user's role from <strong>{user.role}</strong> to <strong>{newRole}</strong>?
                        </p>
                        <div className="mt-2">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-[#F15A25] focus:ring-[#F15A25]"
                              checked={confirmAction}
                              onChange={(e) => setConfirmAction(e.target.checked)}
                            />
                            <span className="ml-2 text-sm text-yellow-700">Yes, I confirm this change</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={updateUserRole}
                  disabled={updating || newRole === user.role || !confirmAction}
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#F15A25] hover:bg-[#E04E1A] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <>
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      {newRole === 'admin' ? (
                        <>
                          <Shield size={16} className="mr-2" />
                          Promote to Admin
                        </>
                      ) : (
                        <>
                          <UserX size={16} className="mr-2" />
                          Remove Admin Rights
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* User orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold">User Orders</h2>
          </div>
          
          {userOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Package
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userOrders.map((order) => (
                    <tr key={order.orderId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        <Link href={`/admin/orders/${order.orderId}`}>
                          {order.orderId}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.packageName} ({order.location})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(order.finalPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${order.orderStatus === 'completed' ? 'bg-green-100 text-green-800' : 
                            order.orderStatus === 'pending_payment' ? 'bg-yellow-100 text-yellow-800' : 
                            order.orderStatus === 'processing' ? 'bg-blue-100 text-blue-800' : 
                            'bg-red-100 text-red-800'}`}>
                          {order.orderStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          href={`/admin/orders/${order.orderId}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <ShoppingBag size={40} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Orders Yet</h3>
              <p className="text-gray-500">This user hasn't placed any orders yet.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}