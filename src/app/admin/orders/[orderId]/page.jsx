'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    ArrowLeft,
    RefreshCw,
    Check,
    X,
    Clock,
    Globe,
    Download,
    ChevronDown,
    ChevronUp,
    Send,
    User,
    DollarSign,
    Calendar,
    Tag
} from 'lucide-react';

// Admin layout component with sidebar
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminOrderDetail({ params }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [order, setOrder] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [statusNote, setStatusNote] = useState('');
    const [showFullDetails, setShowFullDetails] = useState(false);
    const unwrappedParams = use(params);
    const orderId = unwrappedParams?.orderId;

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

        if (status === 'authenticated' && session?.user?.role === 'admin' && orderId) {
            fetchOrderDetails();
        }
    }, [status, session, router, orderId]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/orders/${orderId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch order details');
            }

            const data = await response.json();
            setOrder(data);
            setNewStatus(data.orderStatus);
        } catch (error) {
            console.error('Error fetching order details:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async () => {
        if (newStatus === order.orderStatus) {
            return; // No change
        }

        try {
            setUpdating(true);
            const response = await fetch(`/api/admin/orders/${orderId}/status`, {
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
                throw new Error('Failed to update order status');
            }

            // Refresh order details
            await fetchOrderDetails();
            setStatusNote('');
        } catch (error) {
            console.error('Error updating order status:', error);
        } finally {
            setUpdating(false);
        }
    };

    const downloadQRCode = () => {
        if (order?.esimDetails?.qrCodeUrl) {
            window.open(order.esimDetails.qrCodeUrl, '_blank');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount / 100); // Assuming amount is in cents
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    // Order status badge color
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'pending_payment':
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

    // Order not found
    if (!order) {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center justify-center p-6">
                    <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
                    <p className="text-gray-600 mb-6">The order you're looking for does not exist or you don't have permission to view it.</p>
                    <Link
                        href="/admin/orders"
                        className="flex items-center text-[#F15A25] hover:underline"
                    >
                        <ArrowLeft size={16} className="mr-2" />
                        Back to Orders
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
                            href="/admin/orders"
                            className="mr-4 p-2 rounded-full hover:bg-gray-100"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-2xl font-bold">Order Details</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchOrderDetails}
                            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                        >
                            <RefreshCw size={16} className="mr-2" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Order summary and actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Order summary */}
                    <div className="lg:col-span-2 bg-white rounded-lg shadow">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-lg font-semibold mb-1">Order #{order.orderId}</h2>
                                    <p className="text-sm text-gray-500">
                                        Placed on {formatDate(order.createdAt)}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                                        {order.orderStatus.replace('_', ' ')}
                                    </span>
                                    <span className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                                        Payment: {order.paymentStatus}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Package details */}
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-md font-semibold mb-4 flex items-center">
                                <Globe size={18} className="mr-2 text-gray-500" />
                                eSIM Package Details
                            </h3>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Package Name</p>
                                        <p className="font-medium">{order.packageName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Location</p>
                                        <p className="font-medium">{order.location}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Data Amount</p>
                                        <p className="font-medium">{order.dataAmount}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Duration</p>
                                        <p className="font-medium">{order.duration}</p>
                                    </div>
                                </div>
                            </div>

                            {/* eSIM details if available */}
                            {order.esimDetails && (
                                <div className="mt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-semibold">eSIM Details</h4>
                                        <button
                                            onClick={() => setShowFullDetails(!showFullDetails)}
                                            className="text-[#F15A25] text-sm flex items-center"
                                        >
                                            {showFullDetails ? (
                                                <>
                                                    Show Less <ChevronUp size={16} className="ml-1" />
                                                </>
                                            ) : (
                                                <>
                                                    Show More <ChevronDown size={16} className="ml-1" />
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4 mt-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500 mb-1">ICCID</p>
                                                <p className="font-medium">{order.esimDetails.iccid || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 mb-1">Transaction ID</p>
                                                <p className="font-medium">{order.esimDetails.transactionId || 'N/A'}</p>
                                            </div>
                                            {order.esimDetails.qrCodeUrl && (
                                                <div className="md:col-span-2">
                                                    <p className="text-sm text-gray-500 mb-2">QR Code</p>
                                                    <div className="flex gap-4 items-center">
                                                        <div className="bg-white p-2 border border-gray-200 rounded-lg h-32 w-32 relative">
                                                            <img
                                                                src={order.esimDetails.qrCodeUrl}
                                                                alt="eSIM QR Code" 
                                                                className="object-contain"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={downloadQRCode}
                                                            className="flex items-center px-3 py-2 bg-[#F15A25] text-white rounded-md hover:bg-[#E04E1A] transition-colors text-sm"
                                                        >
                                                            <Download size={16} className="mr-2" />
                                                            Download QR Code
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Extended eSIM details */}
                                        {showFullDetails && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">IMSI</p>
                                                    <p className="font-medium">{order.esimDetails.imsi || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">MSISDN</p>
                                                    <p className="font-medium">{order.esimDetails.msisdn || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Status</p>
                                                    <p className="font-medium">{order.esimDetails.esimStatus || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Activation Time</p>
                                                    <p className="font-medium">{order.esimDetails.activateTime ? formatDate(order.esimDetails.activateTime) : 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Expiry Time</p>
                                                    <p className="font-medium">{order.esimDetails.expiredTime || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Usage</p>
                                                    <p className="font-medium">{order.esimDetails.orderUsage ? `${order.esimDetails.orderUsage} MB` : 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">PIN</p>
                                                    <p className="font-medium">{order.esimDetails.pin || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">PUK</p>
                                                    <p className="font-medium">{order.esimDetails.puk || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">APN</p>
                                                    <p className="font-medium">{order.esimDetails.apn || 'N/A'}</p>
                                                </div>
                                            </div>
                                        )}
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
                                    <p className="text-sm">{formatCurrency(order.originalPrice)}</p>
                                </div>
                                <div className="flex justify-between">
                                    <p className="text-sm text-gray-600">Markup</p>
                                    <p className="text-sm">{formatCurrency(order.markupAmount)}</p>
                                </div>
                                {order.discountAmount > 0 && (
                                    <div className="flex justify-between">
                                        <p className="text-sm text-gray-600">Discount</p>
                                        <p className="text-sm text-green-600">-{formatCurrency(order.discountAmount)}</p>
                                    </div>
                                )}
                                {order.couponCode && (
                                    <div className="flex justify-between">
                                        <p className="text-sm text-gray-600">Coupon Code</p>
                                        <p className="text-sm">{order.couponCode}</p>
                                    </div>
                                )}
                                <div className="border-t border-gray-200 pt-3 flex justify-between">
                                    <p className="font-medium">Total</p>
                                    <p className="font-medium">{formatCurrency(order.finalPrice)}</p>
                                </div>
                                <div className="flex justify-between text-sm text-gray-500">
                                    <p>Payment Method</p>
                                    <p className="capitalize">{order.paymentMethod}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order actions panel */}
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
                                    <p className="font-medium">{order.userName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Email</p>
                                    <p className="font-medium">{order.userEmail || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">User ID</p>
                                    <p className="font-medium text-sm">{order.userId || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <Link
                                    href={`/admin/users/${order.userId}`}
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
                                Update Order Status
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
                                        <option value="pending_payment">Pending Payment</option>
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

                                <button
                                    onClick={updateOrderStatus}
                                    disabled={updating || newStatus === order.orderStatus}
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

                        {/* Timeline */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-md font-semibold mb-4 flex items-center">
                                <Calendar size={18} className="mr-2 text-gray-500" />
                                Order Timeline
                            </h3>

                            <div className="space-y-4">
                                {/* Show timeline events if available */}
                                {(order.timeline && order.timeline.length > 0) ? (
                                    <div className="relative">
                                        <div className="absolute top-0 bottom-0 left-3 w-0.5 bg-gray-200"></div>
                                        <ul className="space-y-6 relative">
                                            {order.timeline.map((event, index) => (
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
                                ) : (
                                    <p className="text-sm text-gray-500">No timeline events available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional order information (payment details, etc.) */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-md font-semibold mb-4">Additional Information</h3>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <tbody className="divide-y divide-gray-200">
                                <tr>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">Payment Intent ID</td>
                                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{order.paymentIntentId || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">Tax Country</td>
                                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{order.taxCountry || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">Package Code</td>
                                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{order.packageCode || 'N/A'}</td>
                                </tr>
                                {order.failureReason && (
                                    <tr>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">Failure Reason</td>
                                        <td className="px-4 py-3 text-sm text-red-500">{order.failureReason}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">Created At</td>
                                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                                </tr>
                                {order.updatedAt && (
                                    <tr>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">Last Updated</td>
                                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(order.updatedAt)}</td>
                                    </tr>
                                )}
                                {order.completedAt && (
                                    <tr>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">Completed At</td>
                                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(order.completedAt)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}