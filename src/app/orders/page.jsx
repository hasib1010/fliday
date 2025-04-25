'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
    Loader2, Search, RefreshCw, Eye, Download,
    Smartphone, ArrowUpRight, Clock, CheckCircle, XCircle, AlertCircle,
    User2Icon,
    HouseWifi
} from 'lucide-react';

export default function MyOrdersPage() {
    const { data: session, status } = useSession();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [completedOrders, setCompletedOrders] = useState([]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchOrders();
        } else if (status === 'unauthenticated') {
            window.location.href = '/api/auth/signin';
        }
    }, [status]);

    // Filter orders when search term changes
    useEffect(() => {
        if (completedOrders.length > 0) {
            const filtered = completedOrders.filter(order =>
                order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.packageName.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredOrders(filtered);
        }
    }, [searchTerm, completedOrders]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/user/orders');

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Store all orders
                setOrders(data.orders);
                
                // Filter only completed orders
                const onlyCompleted = data.orders.filter(order => order.orderStatus === 'completed');
                setCompletedOrders(onlyCompleted);
                setFilteredOrders(onlyCompleted);
                
                console.log(`Filtered ${onlyCompleted.length} completed orders out of ${data.orders.length} total orders`);
            } else {
                throw new Error(data.error || 'Failed to fetch orders');
            }
        } catch (err) {
            setError(err.message || 'An error occurred while fetching your orders');
            console.error('Error fetching orders:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatPrice = (price) => {
        if (!price) return '0.00';
        return typeof price === 'number' ? (price / 100).toFixed(2) : price;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'processing':
                return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'failed':
                return 'text-red-600 bg-red-50 border-red-200';
            case 'pending_payment':
                return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle size={16} />;
            case 'processing':
                return <Clock size={16} />;
            case 'failed':
                return <XCircle size={16} />;
            case 'pending_payment':
                return <AlertCircle size={16} />;
            default:
                return <AlertCircle size={16} />;
        }
    };

    if (status === 'loading') {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="w-8 h-8 text-[#F15A25] animate-spin" />
                <span className="ml-2">Loading...</span>
            </div>
        );
    }

    return (
        <div className="max-w-[1220px] mx-auto my-20 px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">My eSIMs</h1>
                <p className="mt-2 text-sm text-gray-500">
                    View and manage all your active eSIM packages
                </p>
            </div>

            {/* Search and filter */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-80">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#F15A25] focus:border-[#F15A25] sm:text-sm"
                        placeholder="Search eSIMs by ID, location, or package"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={fetchOrders}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A25]"
                >
                    <RefreshCw size={16} className="mr-2" />
                    Refresh
                </button>
            </div>

            {/* Error message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                    <div className="flex">
                        <XCircle className="h-5 w-5 text-red-400 mr-2" />
                        <div className="text-sm text-red-700">{error}</div>
                    </div>
                </div>
            )}

            {/* Loading indicator */}
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 text-[#F15A25] animate-spin" />
                    <span className="ml-2">Loading your eSIMs...</span>
                </div>
            ) : (
                <>
                    {filteredOrders.length === 0 ? (
                        <div className="bg-white shadow rounded-lg p-6 text-center">
                            <div className="mx-auto h-12 w-12 text-gray-400">
                                <Smartphone className="h-full w-full" />
                            </div>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No active eSIMs found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm
                                    ? "No eSIMs match your search criteria. Try a different search term."
                                    : "You don't have any active eSIMs yet."}
                            </p>
                            <div className="mt-6">
                                <Link
                                    href="/destinations"
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#F15A25] hover:bg-[#E04E1A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A25]"
                                >
                                    Browse Destinations
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredOrders.map((order) => (
                                <div key={order.orderId} className="bg-white shadow-md rounded-lg overflow-hidden">
                                    <div className="p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                            Order ID: <span className="font-mono">{order.orderId.substring(0, 8)}...</span>
                                        </h3>
                                        <div className="flex items-center mb-2">
                                            <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                                                <img
                                                    className="h-full w-full object-cover rounded-full"
                                                    src={`/flags/${order.location.substring(0, 2)}_flag.jpeg`}
                                                    alt="flag"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = '/flags/placeholder_flag.jpeg'; // Fallback image
                                                    }}
                                                />
                                            </div>
                                            <p className="text-sm text-gray-500">Location: {order.location}</p>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-2">Package: {order.dataAmount} - {order.duration}</p>
                                        <p className="text-sm text-gray-500 mb-2">Date: {formatDate(order.createdAt)}</p>
                                        <p className="text-sm font-medium text-gray-900 mb-3">
                                            Price: {order.currency} {formatPrice(order.finalPrice/100)}
                                        </p>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.orderStatus)} mb-3`}>
                                            {getStatusIcon(order.orderStatus)}
                                            <span className="ml-1 capitalize">Active</span>
                                        </span>
                                        <div className="flex justify-between mt-5 space-x-2">
                                            <Link
                                                href={`/checkout/confirmation?orderId=${order.orderId}`}
                                                className="text-[#F15A25] hover:text-[#E04E1A] inline-flex items-center"
                                            >
                                                <Eye size={18} />
                                                <span className="hidden sm:inline ml-1">View</span>
                                            </Link>

                                            {order.esimDetails?.qrCodeUrl && (
                                                <a
                                                    href={order.esimDetails.qrCodeUrl}
                                                    target='_blank'
                                                    download={`esim-${order.orderId}.png`}
                                                    className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                                                >
                                                    <Download size={18} />
                                                    <span className="hidden sm:inline ml-1">QR</span>
                                                </a>
                                            )}

                                            <Link
                                                href={`/esim/${order.orderId}`}
                                                className="text-green-600 hover:text-green-800 inline-flex items-center"
                                            >
                                                <Smartphone size={18} />
                                                <span className="hidden sm:inline ml-1">Install</span>
                                            </Link>
                                            
                                            <Link
                                                href={`/esim/profile/${order.orderId}`}
                                                className="text-green-600 hover:text-green-800 inline-flex items-center"
                                            >
                                                <HouseWifi size={18} />
                                                <span className="hidden sm:inline ml-1">Check Use</span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}