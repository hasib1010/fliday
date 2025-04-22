'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    Loader2, 
    ArrowLeft, 
    Check,
    XCircle,
    Clock,
    Eye,
    Download,
    ChevronRight,
    ExternalLink
} from 'lucide-react';

// Create a wrapper component to handle the search params
function TopUpConfirmationContent() {
    const searchParams = useSearchParams();
    const topUpId = searchParams.get('topUpId');
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [topUp, setTopUp] = useState(null);
    const [order, setOrder] = useState(null);
    const [isExecuting, setIsExecuting] = useState(false);

    useEffect(() => {
        if (topUpId) {
            fetchTopUpDetails();
        } else {
            setError('Missing TopUp ID');
            setLoading(false);
        }
    }, [topUpId]);

    const fetchTopUpDetails = async () => {
        try {
            setLoading(true);
            
            const response = await fetch(`/api/topup/details?topUpId=${topUpId}`);
            
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                setTopUp(data.topUp);
                setOrder(data.order);
                
                // If topUp is pending but payment is complete, try to execute it
                if (data.topUp.topUpStatus === 'pending' && data.topUp.paymentStatus === 'completed') {
                    executeTopUp(data.topUp.topUpId, data.topUp.paymentIntentId);
                }
            } else {
                throw new Error(data.error || 'Failed to fetch topUp details');
            }
        } catch (err) {
            setError(err.message || 'An error occurred while fetching topUp details');
            console.error('Error fetching topUp details:', err);
        } finally {
            setLoading(false);
        }
    };

    const executeTopUp = async (topUpId, paymentIntentId) => {
        try {
            setIsExecuting(true);
            
            const response = await fetch('/api/esim/topup', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topUpId,
                    paymentIntentId
                }),
            });
            
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Refresh the page data after execution
                fetchTopUpDetails();
            } else {
                throw new Error(data.error || 'Failed to execute topUp');
            }
        } catch (err) {
            console.error('Error executing topUp:', err);
            // Don't set an error here, as we just want to silently retry
        } finally {
            setIsExecuting(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatPrice = (price, currency = 'USD') => {
        // Convert from provider's price format (10000 = $1.00) to actual dollars
        const priceValue = price / 10000;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(priceValue);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="w-8 h-8 text-[#F15A25] animate-spin" />
                <span className="ml-2">Loading confirmation...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center mb-8">
                    <Link
                        href="/orders"
                        className="mr-4 text-gray-500 hover:text-gray-700 transition"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">TopUp Confirmation</h1>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <XCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>{error}</p>
                            </div>
                            <div className="mt-4">
                                <Link
                                    href="/orders"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#F15A25] hover:bg-[#E04E1A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A25]"
                                >
                                    <ArrowLeft size={16} className="mr-2" />
                                    Back to Orders
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!topUp) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center mb-8">
                    <Link
                        href="/orders"
                        className="mr-4 text-gray-500 hover:text-gray-700 transition"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">TopUp Confirmation</h1>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">TopUp Not Found</h3>
                            <div className="mt-2 text-sm text-yellow-700">
                                <p>The requested TopUp could not be found.</p>
                            </div>
                            <div className="mt-4">
                                <Link
                                    href="/orders"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#F15A25] hover:bg-[#E04E1A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A25]"
                                >
                                    <ArrowLeft size={16} className="mr-2" />
                                    Back to Orders
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <Check className="h-6 w-6 text-green-500" />;
            case 'pending':
                return <Clock className="h-6 w-6 text-yellow-500" />;
            case 'processing':
                return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />;
            case 'failed':
                return <XCircle className="h-6 w-6 text-red-500" />;
            default:
                return <Clock className="h-6 w-6 text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'text-green-800 bg-green-50 border-green-200';
            case 'pending':
                return 'text-yellow-800 bg-yellow-50 border-yellow-200';
            case 'processing':
                return 'text-blue-800 bg-blue-50 border-blue-200';
            case 'failed':
                return 'text-red-800 bg-red-50 border-red-200';
            default:
                return 'text-gray-800 bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center mb-8">
                <Link
                    href="/orders"
                    className="mr-4 text-gray-500 hover:text-gray-700 transition"
                >
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">TopUp Confirmation</h1>
            </div>

            {/* TopUp Status */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
                <div className="p-6 flex items-start">
                    <div className="mr-4">
                        {getStatusIcon(topUp.topUpStatus)}
                    </div>
                    <div>
                        <div className="flex items-center">
                            <h2 className="text-xl font-semibold text-gray-900">
                                TopUp {
                                    topUp.topUpStatus === 'completed' ? 'Completed' : 
                                    topUp.topUpStatus === 'processing' ? 'Processing' : 
                                    topUp.topUpStatus === 'failed' ? 'Failed' : 
                                    'Pending'
                                }
                            </h2>
                            <span className={`ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(topUp.topUpStatus)}`}>
                                {topUp.topUpStatus}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                            {topUp.topUpStatus === 'completed' ? 
                                `Your eSIM has been successfully topped up on ${formatDate(topUp.completedAt || topUp.createdAt)}` : 
                                topUp.topUpStatus === 'processing' ? 
                                'Your eSIM is currently being topped up. This process may take a few minutes.' : 
                                topUp.topUpStatus === 'failed' ? 
                                `Your TopUp could not be completed: ${topUp.failureReason || 'Unknown error'}` : 
                                'Your TopUp is pending processing. Please wait a moment.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* TopUp Details */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">TopUp Details</h2>
                </div>
                <div className="p-6">
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">TopUp ID</dt>
                            <dd className="mt-1 text-sm text-gray-900 font-mono">{topUp.topUpId}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Package</dt>
                            <dd className="mt-1 text-sm text-gray-900">{topUp.packageName}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Location</dt>
                            <dd className="mt-1 text-sm text-gray-900">{topUp.location}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Data Amount</dt>
                            <dd className="mt-1 text-sm text-gray-900">{topUp.dataAmount}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Duration</dt>
                            <dd className="mt-1 text-sm text-gray-900">{topUp.duration}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Order Date</dt>
                            <dd className="mt-1 text-sm text-gray-900">{formatDate(topUp.createdAt)}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Payment Status</dt>
                            <dd className="mt-1 text-sm">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(topUp.paymentStatus)}`}>
                                    {topUp.paymentStatus}
                                </span>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                            <dd className="mt-1 text-sm text-gray-900 font-semibold">
                                {formatPrice(topUp.finalPrice, topUp.currency)}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* Related eSIM Details */}
            {order && (
                <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Related eSIM</h2>
                    </div>
                    <div className="p-6">
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">ICCID</dt>
                                <dd className="mt-1 text-sm text-gray-900 font-mono">{order.esimDetails?.iccid || 'N/A'}</dd>
                            </div>
                            {order.esimDetails?.expiredTime && (
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">New Expiry Date</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{formatDate(order.esimDetails.expiredTime)}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                    href="/orders"
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A25]"
                >
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Orders
                </Link>
                
                {order && (
                    <Link
                        href={`/esim/profile/${order.orderId}`}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#F15A25] hover:bg-[#E04E1A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A25]"
                    >
                        <Eye size={16} className="mr-2" />
                        View eSIM Profile
                    </Link>
                )}
            </div>
        </div>
    );
}

// Loading fallback component
function LoadingFallback() {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="w-8 h-8 text-[#F15A25] animate-spin" />
            <span className="ml-2">Loading page...</span>
        </div>
    );
}

// Main component with Suspense boundary
export default function TopUpConfirmationPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <TopUpConfirmationContent />
        </Suspense>
    );
}