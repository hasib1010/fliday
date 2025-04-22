'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';
import {
    Loader2, 
    ArrowLeft, 
    Check,
    CreditCard,
    ChevronRight,
    ShieldCheck
} from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Payment Form Component
function PaymentForm({ topUp, clientSecret, onSuccess }) {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            // Stripe.js has not loaded yet
            return;
        }

        setProcessing(true);
        setError(null);
        setMessage('');

        // Confirm payment
        const result = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/checkout/topup/confirmation?topUpId=${topUp.topUpId}`,
            },
            redirect: 'if_required',
        });

        if (result.error) {
            setError(result.error.message);
            setProcessing(false);
        } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
            setMessage('Payment successful!');
            // Notify parent component
            onSuccess(result.paymentIntent.id);
        } else {
            setMessage('Payment processing. Please wait...');
            // We could have a redirect here, but we'll wait for the onSuccess callback
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />

            {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    {error}
                </div>
            )}

            {message && (
                <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm">
                    {message}
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-1" />
                    Secure payment
                </div>
                <button
                    type="submit"
                    disabled={!stripe || processing}
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-[#F15A25] hover:bg-[#E04E1A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A25] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {processing ? (
                        <>
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            Pay {topUp.currency} {(topUp.finalPrice / 10000).toFixed(2)}
                            <ChevronRight size={16} className="ml-2" />
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

// Content component that uses useSearchParams
function TopUpCheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const topUpId = searchParams.get('topUpId');
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [topUp, setTopUp] = useState(null);
    const [clientSecret, setClientSecret] = useState(null);
    const [succeeded, setSucceeded] = useState(false);
    const [executing, setExecuting] = useState(false);

    useEffect(() => {
        if (topUpId) {
            fetchTopUpDetails();
        } else {
            setError('Missing topUp ID');
            setLoading(false);
        }
    }, [topUpId]);

    const fetchTopUpDetails = async () => {
        try {
            setLoading(true);
            
            const response = await fetch(`/api/checkout/topup?topUpId=${topUpId}`);
            
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                setTopUp(data.topUp);
                setClientSecret(data.clientSecret);
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

    const handlePaymentSuccess = async (paymentIntentId) => {
        try {
            setExecuting(true);
            
            const response = await fetch('/api/esim/topup', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topUpId, paymentIntentId }),
            });
            
            // Get detailed error info from response
            if (!response.ok) {
                const errorText = await response.text();
                console.error('TopUp execution failed:', response.status, errorText);
                throw new Error(`Error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                setSucceeded(true);
                setTimeout(() => {
                    router.push(`/checkout/topup/confirmation?topUpId=${topUpId}`);
                }, 1500);
            } else {
                throw new Error(data.error || 'Failed to execute topUp');
            }
        } catch (err) {
            setError(err.message || 'An error occurred while processing your topUp');
            console.error('Error executing topUp:', err);
        } finally {
            setExecuting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="w-8 h-8 text-[#F15A25] animate-spin" />
                <span className="ml-2">Loading checkout...</span>
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
                    <h1 className="text-3xl font-bold text-gray-900">TopUp Checkout</h1>
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
                    <h1 className="text-3xl font-bold text-gray-900">TopUp Checkout</h1>
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

    if (succeeded) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Payment Successful!</h1>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-md p-6 mb-6 text-center">
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                            <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-medium text-green-800">Your TopUp is being processed</h3>
                        <div className="mt-2 text-base text-green-700">
                            <p>Your payment was successful and your eSIM is being topped up.</p>
                            <p className="mt-1">You will be redirected to the confirmation page shortly.</p>
                        </div>
                        <div className="mt-6">
                            <Loader2 className="w-6 h-6 text-[#F15A25] animate-spin mx-auto" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center mb-8">
                <Link
                    href={`/esim/topup?orderId=${topUp.orderId}&iccid=${topUp.iccid}&location=${topUp.location}`}
                    className="mr-4 text-gray-500 hover:text-gray-700 transition"
                >
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Complete Your TopUp</h1>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Payment Section */}
                <div className="lg:w-2/3">
                    <div className="bg-white shadow rounded-lg overflow-hidden mb-8 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Details</h2>
                        
                        {clientSecret && (
                            <Elements stripe={stripePromise} options={{ clientSecret }}>
                                <PaymentForm 
                                    topUp={topUp} 
                                    clientSecret={clientSecret} 
                                    onSuccess={handlePaymentSuccess} 
                                />
                            </Elements>
                        )}
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:w-1/3">
                    <div className="bg-white shadow rounded-lg overflow-hidden mb-8 p-6 sticky top-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
                        
                        <div className="mb-4 pb-4 border-b border-gray-200">
                            <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                                    <img
                                        className="h-full w-full object-cover rounded-full"
                                        src={`/flags/${topUp.location.substring(0, 2)}_flag.jpeg`}
                                        alt="flag"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/flags/placeholder_flag.jpeg'; // Fallback image
                                        }}
                                    />
                                </div>
                                <div>
                                    <h3 className="font-medium">{topUp.packageName}</h3>
                                    <p className="text-sm text-gray-500">{topUp.location}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-3 mb-4">
                            <div className="flex justify-between text-sm">
                                <span>Data Amount:</span>
                                <span className="font-medium">{topUp.dataAmount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Duration:</span>
                                <span className="font-medium">{topUp.duration}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>ICCID:</span>
                                <span className="font-mono text-xs">{topUp.iccid.substring(0, 8)}...</span>
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-200">
                            <div className="flex justify-between font-bold">
                                <span>Total</span>
                                <span className="text-[#F15A25]">
                                    {topUp.currency} {(topUp.finalPrice / 10000).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Loading fallback component
function LoadingFallback() {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="w-8 h-8 text-[#F15A25] animate-spin" />
            <span className="ml-2">Loading checkout page...</span>
        </div>
    );
}

// Main component with Suspense boundary
export default function TopUpCheckoutPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <TopUpCheckoutContent />
        </Suspense>
    );
}