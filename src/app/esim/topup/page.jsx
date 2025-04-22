'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    Loader2,
    ArrowLeft,
    Globe,
    SignalMedium,
    Clock,
    CreditCard,
    ChevronRight,
    Check
} from 'lucide-react';

// Content component that uses useSearchParams
function TopUpContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const orderId = searchParams.get('orderId');
    const iccid = searchParams.get('iccid');
    const location = searchParams.get('location');
    const esimTranNo = searchParams.get('esimTranNo');

    const [loading, setLoading] = useState(true);
    const [topupPlans, setTopupPlans] = useState([]);
    const [error, setError] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Payment method state
    const [paymentMethod, setPaymentMethod] = useState('stripe');

    useEffect(() => {
        if (iccid || esimTranNo) {
            checkTopUpEligibility();
        }
    }, [iccid, esimTranNo]);

    const checkTopUpEligibility = async () => {
        try {
            setLoading(true);

            // Build query params
            const queryParams = new URLSearchParams();
            if (esimTranNo) {
                queryParams.append('esimTranNo', esimTranNo);
            } else if (iccid) {
                queryParams.append('iccid', iccid);
            }

            const response = await fetch(`/api/esim/check-status?${queryParams.toString()}`);

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                if (!data.canTopUp) {
                    setError(`This eSIM cannot be topped up at this time. Status: ${data.esimDetails.esimStatus}, SMDP Status: ${data.esimDetails.smdpStatus}`);
                    setTopupPlans([]);
                } else {
                    // Proceed with fetching topup plans
                    fetchTopupPlans();
                }
            } else {
                throw new Error(data.error || 'Failed to check eSIM eligibility for top-up');
            }
        } catch (err) {
            setError(err.message || 'An error occurred while checking top-up eligibility');
            console.error('Error checking top-up eligibility:', err);
            setTopupPlans([]);
        } finally {
            setLoading(false);
        }
    };
    
    const fetchTopupPlans = async () => {
        try {
            setLoading(true);

            const queryParams = new URLSearchParams();
            queryParams.append('iccid', iccid);
            if (location) queryParams.append('location', location);
            if (orderId) queryParams.append('orderId', orderId);

            const response = await fetch(`/api/esim/topup-plans?${queryParams.toString()}`);

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // The API should return plans with finalPrice that includes the markup
                // Log to debug what we're receiving
                console.log('Received topup plans:', data.plans);
                
                setTopupPlans(data.plans);
                if (data.plans.length > 0) {
                    // Auto-select the first plan
                    setSelectedPlan(data.plans[0]);
                }
            } else {
                throw new Error(data.error || 'Failed to fetch topup plans');
            }
        } catch (err) {
            setError(err.message || 'An error occurred while fetching topup plans');
            console.error('Error fetching topup plans:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
    };

    const handleSubmit = async () => {
        if (!selectedPlan) {
            setError('Please select a topup plan');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            // When submitting, send the original price (without markup) to the API
            const response = await fetch('/api/esim/topup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId,
                    iccid,
                    packageCode: selectedPlan.packageCode,
                    esimTranNo,
                    price: selectedPlan.price, // Provider's original price (not finalPrice)
                    currency: selectedPlan.currency,
                    paymentMethod,
                    packageName: selectedPlan.name,
                    dataAmount: selectedPlan.dataAmount,
                    duration: selectedPlan.duration,
                    location: selectedPlan.location
                }),
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Redirect to checkout page
                if (data.redirect) {
                    router.push(data.redirect);
                } else {
                    router.push(`/checkout/confirmation?orderId=${orderId}`);
                }
            } else {
                throw new Error(data.error || 'Failed to initiate topup');
            }
        } catch (err) {
            setError(err.message || 'An error occurred while processing your topup');
            console.error('Error processing topup:', err);
        } finally {
            setSubmitting(false);
        }
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
                <span className="ml-2">Loading topup plans...</span>
            </div>
        );
    }

    if (error && topupPlans.length === 0) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center mb-8">
                    <Link
                        href={orderId ? `/esim/profile/${orderId}` : "/orders"}
                        className="mr-4 text-gray-500 hover:text-gray-700 transition"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">TopUp eSIM</h1>
                </div>

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
                                    href={orderId ? `/esim/profile/${orderId}` : "/orders"}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#F15A25] hover:bg-[#E04E1A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A25]"
                                >
                                    <ArrowLeft size={16} className="mr-2" />
                                    Back
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center mb-8">
                <Link
                    href={orderId ? `/esim/profile/${orderId}` : "/orders"}
                    className="mr-4 text-gray-500 hover:text-gray-700 transition"
                >
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">TopUp eSIM</h1>
            </div>

            {/* eSIM Info */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-8 p-6">
                <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                        <img
                            className="h-full w-full object-cover rounded-full"
                            src={`/flags/${location?.substring(0, 2)}_flag.jpeg`}
                            alt="flag"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/flags/placeholder_flag.jpeg'; // Fallback image
                            }}
                        />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">{location || 'International eSIM'}</h2>
                        <p className="text-sm text-gray-500">ICCID: {iccid?.substring(0, 8)}...</p>
                    </div>
                </div>
            </div>

            {error && (
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
                        </div>
                    </div>
                </div>
            )}

            <h2 className="text-3xl font-semibold text-gray-900 mb-4">Select a TopUp Plan</h2>

            {topupPlans.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">No TopUp Plans Available</h3>
                            <div className="mt-2 text-sm text-yellow-700">
                                <p>There are no topup plans available for this eSIM at the moment.</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {topupPlans.map((plan) => (
                        <div
                            key={plan.packageCode}
                            className={`bg-white border rounded-lg p-4 cursor-pointer transition-all ${selectedPlan?.packageCode === plan.packageCode
                                ? 'border-[#F15A25] ring-2 ring-[#F15A25] ring-opacity-50'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                            onClick={() => handlePlanSelect(plan)}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                                    <p className="text-sm text-gray-500">{plan.location}</p>
                                </div>
                                {selectedPlan?.packageCode === plan.packageCode && (
                                    <div className="w-6 h-6 rounded-full bg-[#F15A25] flex items-center justify-center">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 space-y-2">
                                <div className="flex items-center">
                                    <Globe className="h-4 w-4 text-gray-500 mr-2" />
                                    <span className="text-sm">{plan.dataAmount}</span>
                                </div>
                                <div className="flex items-center">
                                    <Clock className="h-4 w-4 text-gray-500 mr-2" />
                                    <span className="text-sm">{plan.duration}</span>
                                </div>
                            </div>

                            <div className="mt-4 flex justify-between items-center">
                                <div className="text-lg font-bold text-[#F15A25]">
                                    {/* Display finalPrice which includes markup from API */}
                                    {formatPrice(plan.finalPrice, plan.currency)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Payment Method Selection */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-8 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>

                <div className="space-y-3">
                    <div
                        className="flex items-center p-3 border rounded-lg cursor-pointer border-[#F15A25] bg-orange-50"
                        onClick={() => setPaymentMethod('stripe')}
                    >
                        <input
                            type="radio"
                            id="stripe"
                            name="paymentMethod"
                            value="stripe"
                            checked={paymentMethod === 'stripe'}
                            onChange={() => setPaymentMethod('stripe')}
                            className="h-4 w-4 text-[#F15A25] focus:ring-[#F15A25] border-gray-300"
                        />
                        <label htmlFor="stripe" className="ml-3 flex flex-grow items-center cursor-pointer">
                            <CreditCard className="w-5 h-5 text-gray-500 mr-2" />
                            <span className="font-medium">Credit/Debit Card</span>
                            <span className="ml-auto text-sm text-gray-500">Powered by Stripe</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Order Summary */}
            {selectedPlan && (
                <div className="bg-white shadow rounded-lg overflow-hidden mb-8 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>

                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">{selectedPlan.name}</span>
                            <span>{formatPrice(selectedPlan.finalPrice, selectedPlan.currency)}</span>
                        </div>
                        <div className="pt-3 border-t border-gray-200 flex justify-between font-bold">
                            <span>Total</span>
                            <span className="text-[#F15A25]">{formatPrice(selectedPlan.finalPrice, selectedPlan.currency)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                    href={orderId ? `/esim/profile/${orderId}` : "/orders"}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A25]"
                >
                    <ArrowLeft size={16} className="mr-2" />
                    Back
                </Link>

                <button
                    onClick={handleSubmit}
                    disabled={!selectedPlan || submitting}
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-[#F15A25] hover:bg-[#E04E1A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A25] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <>
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            Continue to Payment
                            <ChevronRight size={16} className="ml-2" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

// Loading fallback component
function LoadingFallback() {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="w-8 h-8 text-[#F15A25] animate-spin" />
            <span className="ml-2">Loading topup page...</span>
        </div>
    );
}

// Main component with Suspense boundary
export default function TopUpPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <TopUpContent />
        </Suspense>
    );
}