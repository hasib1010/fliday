// app/esim/profile/[orderId]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    Loader2,
    ArrowLeft,
    Signal,
    Calendar,
    BarChart4,
    Clock,
    Smartphone,
    Download,
    Globe,
    RefreshCw,
    Plus,
    AlertCircle,
    XCircle
} from 'lucide-react';
import TopUpHistory from '@/components/TopUpHistory'; // Import the TopUp history component

export default function ESIMProfilePage() {
    const params = useParams();
    const orderId = params.orderId;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId]);

    // Effect to automatically refresh usage data after initial order data is loaded
    useEffect(() => {
        if (order && initialLoad) {
            // Automatically refresh usage data on initial load
            refreshUsageData();
            setInitialLoad(false);
        }
    }, [order, initialLoad]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/orders?orderId=${orderId}`);

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Process the order data to ensure correct data amounts
                const processedOrder = processOrderData(data.order);
                setOrder(processedOrder);
                console.log('Order details loaded successfully');
            } else {
                throw new Error(data.error || 'Failed to fetch order details');
            }
        } catch (err) {
            setError(err.message || 'An error occurred while fetching order details');
            console.error('Error fetching order details:', err);
        } finally {
            setLoading(false);
        }
    };

    // Process order data to ensure correct data amounts
    const processOrderData = (order) => {
        if (!order || !order.esimDetails) return order;

        // Create a copy of the order to avoid mutating the original
        const updatedOrder = { ...order };
        updatedOrder.esimDetails = { ...order.esimDetails };

        // Check if we have a valid totalVolume already set in esimDetails
        // This takes precedence as it comes directly from the provider API
        if (updatedOrder.esimDetails.totalVolume && updatedOrder.esimDetails.totalVolume > 0) {
            console.log(`Using existing total volume: ${updatedOrder.esimDetails.totalVolume}MB`);

            // Ensure orderUsage is reasonable (no greater than totalVolume)
            if (updatedOrder.esimDetails.orderUsage > updatedOrder.esimDetails.totalVolume) {
                updatedOrder.esimDetails.orderUsage = updatedOrder.esimDetails.totalVolume;
            }

            return updatedOrder;
        }

        // If we don't have a valid totalVolume, try to parse it from dataAmount
        if (order.dataAmount) {
            let totalMB = 0;

            // Parse GB format (e.g. "0.1GB" or "1GB")
            const gbMatch = order.dataAmount.match(/(\d+(?:\.\d+)?)\s*GB/i);
            if (gbMatch && gbMatch[1]) {
                totalMB = parseFloat(gbMatch[1]) * 1024; // Convert GB to MB
            } else {
                // Parse MB format (e.g. "100MB")
                const mbMatch = order.dataAmount.match(/(\d+(?:\.\d+)?)\s*MB/i);
                if (mbMatch && mbMatch[1]) {
                    totalMB = parseFloat(mbMatch[1]);
                }
            }

            // If we successfully parsed a data amount, use it
            if (totalMB > 0) {
                console.log(`Parsed total volume from dataAmount: ${totalMB}MB from "${order.dataAmount}"`);

                // Set the total volume to our parsed value
                updatedOrder.esimDetails.totalVolume = totalMB;

                // Ensure orderUsage is reasonable (no greater than totalVolume)
                if (updatedOrder.esimDetails.orderUsage > totalMB) {
                    updatedOrder.esimDetails.orderUsage = totalMB;
                }
            }
        }

        // If we have packageList, we can calculate total from the packages
        // This is especially helpful after top-ups
        if (updatedOrder.esimDetails.packageList && updatedOrder.esimDetails.packageList.length > 0) {
            try {
                // Sum up the volume of all packages (bytes)
                let totalBytes = 0;
                updatedOrder.esimDetails.packageList.forEach(pkg => {
                    if (pkg.volume) {
                        totalBytes += parseInt(pkg.volume, 10);
                    }
                });

                // Convert to MB
                if (totalBytes > 0) {
                    const totalMB = Math.round(totalBytes / 1048576);
                    console.log(`Calculated total volume from packages: ${totalMB}MB`);

                    // Only use this if it's larger than our current value
                    // This ensures we get the most up-to-date value after top-ups
                    if (!updatedOrder.esimDetails.totalVolume || totalMB > updatedOrder.esimDetails.totalVolume) {
                        updatedOrder.esimDetails.totalVolume = totalMB;

                        // Also update the displayed dataAmount to match
                        const gbValue = (totalMB / 1024).toFixed(1);
                        updatedOrder.dataAmount = `${gbValue}GB`;
                    }
                }
            } catch (err) {
                console.error('Error calculating package volumes:', err);
            }
        }

        return updatedOrder;
    };

    const refreshUsageData = async () => {
        if (refreshing) return; // Prevent multiple simultaneous refresh requests

        try {
            setRefreshing(true);
            console.log('Refreshing usage data...');

            const response = await fetch(`/api/esim/refresh-usage?orderId=${orderId}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Update the order data directly with the response data
                // to immediately reflect changes without needing another fetch
                setOrder(prevOrder => {
                    if (!prevOrder) return prevOrder;

                    // Create a new order object with updated values
                    const updatedOrder = { ...prevOrder };

                    // Update esimDetails
                    updatedOrder.esimDetails = { ...prevOrder.esimDetails };

                    // Update usage data
                    if (data.data.dataUsage !== undefined) {
                        updatedOrder.esimDetails.orderUsage = data.data.dataUsage;
                    }

                    // Update total data volume - CRITICAL for top-up scenarios
                    if (data.data.totalData !== undefined) {
                        updatedOrder.esimDetails.totalVolume = data.data.totalData;
                    }

                    // Update status fields
                    if (data.data.smdpStatus) {
                        updatedOrder.esimDetails.smdpStatus = data.data.smdpStatus;
                    }

                    if (data.data.esimStatus) {
                        updatedOrder.esimDetails.esimStatus = data.data.esimStatus;
                    }

                    // Update timestamp
                    if (data.data.lastUpdateTime) {
                        updatedOrder.esimDetails.lastUpdateTime = data.data.lastUpdateTime;
                    }

                    // Update expiration date if changed (e.g., after top-up)
                    if (data.data.expiredTime) {
                        updatedOrder.esimDetails.expiredTime = data.data.expiredTime;
                    }

                    // Update package display label if provided
                    if (data.data.dataAmount) {
                        updatedOrder.dataAmount = data.data.dataAmount;
                    }

                    // Process the updated order to ensure all calculations are correct
                    return processOrderData(updatedOrder);
                });

                console.log('Usage data refreshed successfully:', data.data);
            } else {
                throw new Error(data.error || 'Failed to refresh usage data');
            }
        } catch (err) {
            console.error('Error refreshing usage data:', err);
            // Only set error if it's not an initial automatic refresh
            if (!initialLoad) {
                setError(err.message || 'An error occurred while refreshing usage data');
            }
        } finally {
            setRefreshing(false);
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

    const checkTopUpAvailability = () => {
        // Basic check based on order status
        const orderCompleted = order.orderStatus === 'completed';
        const hasIccid = !!order.esimDetails?.iccid;

        // Advanced check based on eSIM status
        const isActive =
            order.esimDetails?.smdpStatus === 'ENABLED' ||
            order.esimDetails?.esimStatus === 'IN_USE' ||
            !!order.esimDetails?.eid;

        // Check if expired
        const isExpired = timeRemaining.expired;

        // Return true only if all conditions are met
        return orderCompleted && hasIccid && isActive && !isExpired;
    };

    const calculateUsagePercentage = () => {
        if (!order?.esimDetails?.totalVolume) {
            return 0;
        }

        // Handle case where orderUsage might be 0 (not undefined)
        const totalMB = order.esimDetails.totalVolume;
        const usedMB = order.esimDetails.orderUsage || 0;

        // Avoid division by zero and ensure percentage is between 0-100
        if (totalMB === 0) return 0;
        return Math.min(Math.round((usedMB / totalMB) * 100), 100);
    };

    const formatDataAmount = (mbValue) => {
        if (mbValue === undefined || mbValue === null) return 'N/A';

        // Always format in GB for consistency with package display
        return `${(mbValue / 1024).toFixed(2)} GB`;
    };

    const calculateTimeRemaining = () => {
        if (!order?.esimDetails?.expiredTime) {
            return { days: 0, hours: 0, minutes: 0 };
        }

        const now = new Date();
        const expireDate = new Date(order.esimDetails.expiredTime);

        if (now > expireDate) {
            return { days: 0, hours: 0, minutes: 0, expired: true };
        }

        const diffMs = expireDate - now;
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        return { days, hours, minutes, expired: false };
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="w-8 h-8 text-[#F15A25] animate-spin" />
                <span className="ml-2">Loading eSIM details...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
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
                                    Back to My Orders
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">eSIM not found</h3>
                            <div className="mt-2 text-sm text-yellow-700">
                                <p>The requested eSIM profile could not be found.</p>
                            </div>
                            <div className="mt-4">
                                <Link
                                    href="/orders"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#F15A25] hover:bg-[#E04E1A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A25]"
                                >
                                    <ArrowLeft size={16} className="mr-2" />
                                    Back to My Orders
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const usagePercentage = calculateUsagePercentage();
    const timeRemaining = calculateTimeRemaining();

    // Calculate remaining data with protection against negative values
    const totalVolume = order.esimDetails?.totalVolume || 0;
    const usedVolume = order.esimDetails?.orderUsage || 0;
    const remainingData = Math.max(0, totalVolume - usedVolume);
    const allowTopUp = checkTopUpAvailability();
    // Determine if TopUp is possible (only allow for completed orders with valid ICCID)
    const canTopUp = order.orderStatus === 'completed' && order.esimDetails?.iccid;

    return (
        <div className="max-w-[1220px] mx-auto py-20 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center mb-8">
                <Link
                    href="/orders"
                    className="mr-4 text-gray-500 hover:text-gray-700 transition"
                >
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">eSIM Profile</h1>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
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
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">{order.location}</h2>
                                <p className="text-sm text-gray-500">{order.packageName}</p>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={refreshUsageData}
                                disabled={refreshing}
                                className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A25] disabled:opacity-50"
                            >
                                {refreshing ? (
                                    <Loader2 size={16} className="mr-2 animate-spin" />
                                ) : (
                                    <RefreshCw size={16} className="mr-2" />
                                )}
                                {refreshing ? 'Refreshing...' : 'Refresh Usage'}
                            </button>

                            {allowTopUp ? (
                                <Link
                                    href={`/esim/topup?orderId=${order.orderId}&iccid=${order.esimDetails.iccid}&location=${order.location}&esimTranNo=${order.esimDetails.esimTranNo || ''}`}
                                    className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#F15A25] hover:bg-[#E04E1A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A25]"
                                >
                                    <Plus size={16} className="mr-2" />
                                    Top Up
                                </Link>
                            ) : order.esimDetails?.esimStatus === 'GOT_RESOURCE' && !timeRemaining.expired ? (
                                <div className="flex items-center text-sm text-yellow-600">
                                    <AlertCircle size={16} className="mr-2" />
                                    Activate eSIM to enable Top-Up
                                </div>
                            ) : timeRemaining.expired ? (
                                <div className="flex items-center text-sm text-red-600">
                                    <XCircle size={16} className="mr-2" />
                                    eSIM expired, Top-Up unavailable
                                </div>
                            ) : (
                                <div className="flex items-center text-sm text-gray-600">
                                    <Clock size={16} className="mr-2" />
                                    Top-Up currently unavailable
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center">
                            <Globe className="h-6 w-6 text-gray-500 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Data Package</p>
                                <p className="text-lg font-medium text-gray-900">{order.dataAmount} - {order.duration}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <Calendar className="h-6 w-6 text-gray-500 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Active Period</p>
                                <p className="text-lg font-medium text-gray-900">
                                    {order.esimDetails?.activateTime ? formatDate(order.esimDetails.activateTime) : 'Not activated'}
                                    {order.esimDetails?.expiredTime ? ` - ${formatDate(order.esimDetails.expiredTime)}` : ''}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-6">Usage Statistics</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gray-50 rounded-lg p-6">
                            <div className="flex items-center mb-4">
                                <BarChart4 className="h-6 w-6 text-[#F15A25] mr-2" />
                                <h4 className="text-lg font-medium text-gray-900">Data Usage</h4>
                            </div>

                            <div className="relative pt-1">
                                <div className="flex mb-2 items-center justify-between">
                                    <div>
                                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-[#F15A25] bg-orange-100">
                                            {usagePercentage}% Used
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-semibold inline-block text-gray-600">
                                            {formatDataAmount(usedVolume)} / {formatDataAmount(totalVolume)}
                                        </span>
                                    </div>
                                </div>
                                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                                    <div
                                        style={{ width: `${usagePercentage}%` }}
                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#F15A25]"
                                    ></div>
                                </div>
                            </div>

                            <div className="mt-4 text-sm text-gray-600">
                                <p>Data remaining: {formatDataAmount(remainingData)}</p>
                                {order.esimDetails?.lastUpdateTime && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        Last updated: {formatDate(order.esimDetails.lastUpdateTime)}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6">
                            <div className="flex items-center mb-4">
                                <Clock className="h-6 w-6 text-[#F15A25] mr-2" />
                                <h4 className="text-lg font-medium text-gray-900">Time Remaining</h4>
                            </div>

                            {timeRemaining.expired ? (
                                <div className="bg-red-50 border border-red-100 rounded-md p-3 text-red-700">
                                    <p className="text-sm font-medium">This eSIM has expired</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-white p-3 rounded-lg shadow-sm">
                                        <p className="text-3xl font-bold text-[#F15A25]">{timeRemaining.days}</p>
                                        <p className="text-xs text-gray-500 uppercase mt-1">Days</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg shadow-sm">
                                        <p className="text-3xl font-bold text-[#F15A25]">{timeRemaining.hours}</p>
                                        <p className="text-xs text-gray-500 uppercase mt-1">Hours</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg shadow-sm">
                                        <p className="text-3xl font-bold text-[#F15A25]">{timeRemaining.minutes}</p>
                                        <p className="text-xs text-gray-500 uppercase mt-1">Minutes</p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 text-sm text-gray-600">
                                <p>Activation date: {formatDate(order.esimDetails?.activateTime || order.completedAt || order.createdAt)}</p>
                                <p>Expiration date: {formatDate(order.esimDetails?.expiredTime)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add TopUp History Section */}
            <div className="mb-8">
                <TopUpHistory orderId={orderId} />
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-6">eSIM Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start">
                            <Signal className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">ICCID</p>
                                <p className="text-base font-mono">{order.esimDetails?.iccid || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <Signal className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">IMSI</p>
                                <p className="text-base font-mono">{order.esimDetails?.imsi || 'N/A'}</p>
                            </div>
                        </div>

                        {order.esimDetails?.msisdn && (
                            <div className="flex items-start">
                                <Smartphone className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">MSISDN</p>
                                    <p className="text-base font-mono">{order.esimDetails.msisdn}</p>
                                </div>
                            </div>
                        )}

                        {order.esimDetails?.apn && (
                            <div className="flex items-start">
                                <Globe className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">APN</p>
                                    <p className="text-base">{order.esimDetails.apn}</p>
                                </div>
                            </div>
                        )}

                        {order.esimDetails?.esimTranNo && (
                            <div className="flex items-start">
                                <Smartphone className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">eSIM Transaction #</p>
                                    <p className="text-base font-mono">{order.esimDetails.esimTranNo}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                    href="/orders"
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A25]"
                >
                    <ArrowLeft size={16} className="mr-2" />
                    Back to My Orders
                </Link>

                {order.esimDetails?.qrCodeUrl && (
                    <a
                        href={order.esimDetails.qrCodeUrl}
                        target="_blank"
                        download={`esim-${order.orderId}.png`}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#F15A25] hover:bg-[#E04E1A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A25]"
                    >
                        <Download size={16} className="mr-2" />
                        Download QR Code
                    </a>
                )}
            </div>
        </div>
    );
}