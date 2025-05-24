'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signIn, signOut, useSession } from 'next-auth/react';
import { ChevronDown, Info, AlertTriangle, Check, Loader2, CreditCard } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  PaymentRequestButtonElement,
  CardElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

if (!stripeKey) {
  console.error('Missing Stripe publishable key! Ensure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set in .env.local');
}

// Extract country name from package name string
const getCountryName = (packageName) => {
  if (!packageName) return '';
  const countryMatch = packageName.match(/^(.*?)\s*\d+/);
  if (countryMatch && countryMatch[1]) {
    return countryMatch[1].trim();
  }
  return packageName;
};

function CheckoutForm({ packageData, selectedPaymentMethod, taxCountry, couponCode, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [canMakePayment, setCanMakePayment] = useState({ applePay: false, googlePay: false });
  const [isPaymentRequestLoading, setIsPaymentRequestLoading] = useState(true);
  const { data: session } = useSession();

  // Set up Payment Request for Apple Pay and Google Pay
  useEffect(() => {
    if (!stripe || !packageData) {
      console.log('Stripe or package data not ready');
      return;
    }

    const initPaymentRequest = async () => {
      try {
        setIsPaymentRequestLoading(true);
        const priceInCents = Math.round(parseInt(packageData.price) / 100);
        console.log('Setting up payment request with amount (cents):', priceInCents);

        const pr = stripe.paymentRequest({
          country: 'US',
          currency: 'usd',
          total: {
            label: packageData?.name || 'eSIM Package',
            amount: priceInCents,
          },
          requestPayerName: true,
          requestPayerEmail: true,
        });

        // Check availability for both Apple Pay and Google Pay
        const result = await pr.canMakePayment();
        console.log('canMakePayment result:', result);

        const updatedCanMakePayment = {
          applePay: !!result?.applePay,
          googlePay: !!result?.googlePay || !!result, // Fallback to true if any wallet is available
        };

        setCanMakePayment(updatedCanMakePayment);

        if (result) {
          setPaymentRequest(pr);
          pr.on('paymentmethod', async (e) => {
            console.log('Payment method received:', e.paymentMethod);
            setProcessing(true);

            try {
              // Create order
              const orderResponse = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  packageCode: packageData.packageCode,
                  packageName: packageData.name,
                  dataAmount: packageData.dataAmount,
                  duration: packageData.duration,
                  location: packageData.location,
                  price: packageData.price,
                  currency: packageData.currency,
                  paymentMethod: selectedPaymentMethod,
                  couponCode: couponCode || null,
                  status: 'pending_payment',
                }),
              });

              if (!orderResponse.ok) {
                const errorData = await orderResponse.json();
                throw new Error(errorData.error || 'Failed to create order');
              }

              const orderData = await orderResponse.json();
              console.log('Order created:', orderData);

              // Create payment intent
              const intentResponse = await fetch('/api/payment/create-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: orderData.orderId,
                  packageCode: packageData.packageCode,
                  paymentMethod: e.paymentMethod.id,
                  couponCode: couponCode || null,
                  taxCountry: taxCountry,
                }),
              });

              if (!intentResponse.ok) {
                const errorData = await intentResponse.json();
                throw new Error(errorData.error || 'Payment server error');
              }

              const { clientSecret, orderId } = await intentResponse.json();
              console.log('Payment intent created');

              // Confirm the payment
              const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
                clientSecret,
                { payment_method: e.paymentMethod.id },
                { handleActions: false }
              );

              if (confirmError) {
                console.error('Payment confirmation error:', confirmError);
                e.complete('fail');
                onError(confirmError.message);
              } else if (paymentIntent.status === 'requires_action') {
                e.complete('success');
                const { error: actionError } = await stripe.confirmCardPayment(clientSecret);
                if (actionError) {
                  console.error('Error after additional action:', actionError);
                  onError(actionError.message);
                } else {
                  console.log('Payment confirmed after additional action');
                  onSuccess(orderId);
                }
              } else {
                console.log('Payment succeeded');
                e.complete('success');
                onSuccess(orderId);
              }
            } catch (err) {
              console.error('Payment processing error:', err);
              e.complete('fail');
              onError(err.message || 'Payment failed');
            } finally {
              setProcessing(false);
            }
          });
        } else {
          console.log('No payment methods available');
          setCanMakePayment({ applePay: false, googlePay: false });
        }
      } catch (error) {
        console.error('Error setting up payment request:', error);
        setCanMakePayment({ applePay: false, googlePay: false });
      } finally {
        setIsPaymentRequestLoading(false);
      }
    };

    initPaymentRequest();
  }, [stripe, packageData, selectedPaymentMethod, couponCode, taxCountry, onSuccess, onError]);

  // Fallback to credit card if selected payment method is unavailable
  useEffect(() => {
    if (isPaymentRequestLoading) return;
    if (selectedPaymentMethod === 'applepay' && !canMakePayment.applePay) {
      onError('Apple Pay is not available on this device or browser. Please use another payment method.');
    } else if (selectedPaymentMethod === 'googlepay' && !canMakePayment.googlePay) {
      onError('Google Pay is not available on this device or browser. Please use another payment method.');
    }
  }, [selectedPaymentMethod, canMakePayment, isPaymentRequestLoading, onError]);

  // Show loading state while Stripe initializes
  if (!stripe || !elements) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="w-8 h-8 text-[#F15A25] animate-spin mr-3" />
        <span className="text-gray-600">Loading payment options...</span>
      </div>
    );
  }

  // Credit card form
  if (selectedPaymentMethod === 'credit') {
    return (
      <form onSubmit={async (event) => {
        event.preventDefault();
        if (!stripe || !elements || !packageData || !session) {
          console.error('Missing required elements for payment');
          onError('Missing required payment information');
          return;
        }

        setProcessing(true);
        setCardError(null);

        try {
          // Create order
          const orderResponse = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              packageCode: packageData.packageCode,
              packageName: packageData.name,
              dataAmount: packageData.dataAmount,
              duration: packageData.duration,
              location: packageData.location,
              price: packageData.price,
              currency: packageData.currency,
              paymentMethod: 'card',
              couponCode: couponCode || null,
              status: 'pending_payment',
            }),
          });

          const orderData = await orderResponse.json();

          if (!orderResponse.ok) {
            throw new Error(orderData.error || 'Failed to create order');
          }

          console.log('Order created:', orderData);

          // Create payment method
          const cardElement = elements.getElement(CardElement);
          if (!cardElement) {
            throw new Error('Card element not found');
          }

          const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
          });

          if (error) {
            console.error('Error creating payment method:', error);
            setCardError(error.message);
            return;
          }

          console.log('Payment method created:', paymentMethod.id);

          // Create payment intent
          const response = await fetch('/api/payment/create-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: orderData.orderId,
              packageCode: packageData.packageCode,
              paymentMethod: paymentMethod.id,
              couponCode: couponCode || null,
              taxCountry: taxCountry,
            }),
          });

          const intentData = await response.json();

          if (!response.ok) {
            throw new Error(intentData.error || 'Payment server error');
          }

          // Confirm payment
          const { error: confirmError } = await stripe.confirmCardPayment(intentData.clientSecret);

          if (confirmError) {
            console.error('Error confirming payment:', confirmError);
            setCardError(confirmError.message);
          } else {
            console.log('Payment succeeded');
            onSuccess(intentData.orderId);
          }
        } catch (err) {
          console.error('Payment processing error:', err);
          setCardError(err.message || 'Failed to process payment. Please try again.');
          onError(err.message || 'Payment failed');
        } finally {
          setProcessing(false);
        }
      }}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Card details</label>
          <div className="p-3 border border-gray-300 rounded-lg">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': { color: '#aab7c4' },
                  },
                  invalid: { color: '#9e2146' },
                },
                hidePostalCode: true,
              }}
            />
          </div>
          {cardError && <div className="mt-2 text-sm text-red-600">{cardError}</div>}
        </div>

        <button
          type="submit"
          disabled={!stripe || processing || !session}
          className={`w-full mt-6 font-medium py-3 rounded-lg transition-colors flex items-center justify-center ${
            !session
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : processing
              ? 'bg-[#F15A25]/70 text-white cursor-wait'
              : 'bg-[#F15A25] hover:bg-[#E04E1A] text-white'
          }`}
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            'Pay Now'
          )}
        </button>
      </form>
    );
  }

  // Apple Pay / Google Pay
  if (selectedPaymentMethod === 'googlepay' || selectedPaymentMethod === 'applepay') {
    if (isPaymentRequestLoading) {
      return (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-6 h-6 text-[#F15A25] animate-spin mr-2" />
          <span className="text-sm text-gray-600">Setting up {selectedPaymentMethod === 'applepay' ? 'Apple Pay' : 'Google Pay'}...</span>
        </div>
      );
    }

    const isAvailable = selectedPaymentMethod === 'applepay' ? canMakePayment.applePay : canMakePayment.googlePay;

    if (paymentRequest && isAvailable) {
      return (
        <div className="mt-6">
          <PaymentRequestButtonElement
            options={{
              paymentRequest,
              style: {
                paymentRequestButton: {
                  type: selectedPaymentMethod === 'applepay' ? 'buy' : 'pay',
                  theme: 'dark',
                  height: '48px',
                },
              },
            }}
          />
          {processing && (
            <div className="flex justify-center items-center mt-4">
              <Loader2 className="w-5 h-5 text-[#F15A25] animate-spin mr-2" />
              <span className="text-sm text-gray-600">Processing payment...</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
        <p className="text-center text-sm text-yellow-700">
          {selectedPaymentMethod === 'applepay' ? 'Apple Pay' : 'Google Pay'} is not available.
        </p>
        <p className="text-center text-sm text-yellow-700 mt-2">
          {selectedPaymentMethod === 'applepay'
            ? 'Apple Pay requires Safari on macOS/iOS or Chrome on macOS with Touch ID and a configured Apple Pay wallet.'
            : 'Google Pay requires a compatible browser (e.g., Chrome, Edge) and a configured Google Pay wallet.'}
        </p>
        <p className="text-center text-sm text-yellow-700 mt-2">
          Please select another payment method, such as credit card.
        </p>
      </div>
    );
  }

  return null;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageCode = searchParams.get('packageCode') || '';
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';

  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('credit');
  const [couponCode, setCouponCode] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [taxCountry, setTaxCountry] = useState('Bangladesh');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    const fetchPackageData = async () => {
      if (!packageCode) {
        if (!isLoading) {
          setError('No package selected. Please select an eSIM package.');
        }
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/esim/packages?packageCode=${packageCode}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch package: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success || !data.data || data.data.length === 0) {
          throw new Error('Package not found');
        }

        setPackageData(data.data[0]);
        console.log('Package data loaded successfully', data.data[0]);
        setError(null);
      } catch (err) {
        console.error('Error fetching package:', err);
        setError(err.message || 'Failed to load package data');
      } finally {
        setLoading(false);
      }
    };

    fetchPackageData();
  }, [packageCode, isLoading]);

  const formatPrice = (price) => {
    if (!price) return '0.00';
    return typeof price === 'number' ? (price / 10000).toFixed(2) : price;
  };

  const handleGoogleSignIn = async () => {
    const callbackUrl = `/checkout${packageCode ? `?packageCode=${packageCode}` : ''}`;
    await signIn('google', { callbackUrl });
  };

  const handleAppleSignIn = async () => {
    const callbackUrl = `/checkout${packageCode ? `?packageCode=${packageCode}` : ''}`;
    await signIn('apple', { callbackUrl });
  };

  const handleSignOut = async () => {
    const callbackUrl = `/checkout${packageCode ? `?packageCode=${packageCode}` : ''}`;
    await signOut({ redirect: true, callbackUrl });
  };

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
    setError(null); // Clear any previous errors
  };

  const handlePaymentSuccess = (newOrderId) => {
    setPaymentSuccess(true);
    setOrderId(newOrderId);
    setTimeout(() => {
      router.push(`/checkout/confirmation?orderId=${newOrderId}`);
    }, 1500);
  };

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage || 'Payment processing failed. Please try again.');
  };

  useEffect(() => {
    if (!stripePromise && isAuthenticated && packageData) {
      setError('Payment system configuration issue. Please contact support.');
      console.error('Stripe publishable key is missing. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your environment variables.');
    }
  }, [isAuthenticated, packageData]);

  if (isLoading && loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 text-[#F15A25] animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-sm animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-sm animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="h-20 bg-gray-200 rounded w-full mb-6"></div>
            <div className="space-y-4">
              <div className="h-5 bg-gray-200 rounded w-full"></div>
              <div className="h-5 bg-gray-200 rounded w-full"></div>
              <div className="h-5 bg-gray-200 rounded w-full"></div>
              <div className="h-5 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !packageData) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-red-50 p-6 rounded-lg border border-red-100 max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Something went wrong</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/destinations"
            className="bg-[#F15A25] hover:bg-[#E04E1A] text-white px-4 py-2 rounded transition-colors inline-block"
          >
            Back to Destinations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f7f7f8] mx-auto py-20 px-2">
      <div className='max-w-[1220px] mx-auto'>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white py-8 px-3 md:px-8 rounded-lg shadow-sm">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-8 h-8 text-[#F15A25] animate-spin" />
              </div>
            ) : isAuthenticated ? (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Account</h2>
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-[#F15A25] hover:underline"
                  >
                    Sign out
                  </button>
                </div>
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#F15A25] text-white flex items-center justify-center mr-3">
                      {session.user.name ? session.user.name[0].toUpperCase() : session.user.email[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{session.user.name}</p>
                    <p className="text-sm text-gray-600">{session.user.email}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-6">Sign up or log in</h2>
                <div className="flex md:flex-row flex-col gap-2 mb-6 lg:p-2">
                  <button
                    onClick={handleGoogleSignIn}
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="-3 0 262 262" preserveAspectRatio="xMidYMid"><path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4" /><path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853" /><path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05" /><path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335" /></svg>
                    <span className="text-base font-medium text-gray-700">Google</span>
                  </button>
                  <button
                    onClick={handleAppleSignIn}
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="#000000" width="18" height="18" viewBox="-52.01 0 560.035 560.035"><path d="M380.844 297.529c.787 84.752 74.349 112.955 75.164 113.314-.622 1.988-11.754 40.191-38.756 79.652-23.343 34.117-47.568 68.107-85.731 68.811-37.499.691-49.557-22.236-92.429-22.236-42.859 0-56.256 21.533-91.753 22.928-36.837 1.395-64.889-36.891-88.424-70.883-48.093-69.53-84.846-196.475-35.496-282.165 24.516-42.554 68.328-69.501 115.882-70.192 36.173-.69 70.315 24.336 92.429 24.336 22.1 0 63.59-30.096 107.208-25.676 18.26.76 69.517 7.376 102.429 55.552-2.652 1.644-61.159 35.704-60.523 106.559M310.369 89.418C329.926 65.745 343.089 32.79 339.498 0 311.308 1.133 277.22 18.785 257 42.445c-18.121 20.952-33.991 54.487-29.709 86.628 31.421 2.431 63.52-15.967 83.078-39.655" /></svg>
                    <span className="text-base font-medium text-gray-700">Apple</span>
                  </button>
                </div>
                <div className="text-xs text-gray-500 mb-8">
                  We will occasionally send you news about special offers, which you can opt out of at any time by contacting{' '}
                  <a href="mailto:support@fliday.com" className="text-[#F15A25]">
                    support@fliday.com
                  </a>.
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm flex items-start">
                <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <h2 className="text-xl font-semibold mb-6">Select a payment method</h2>
            <div
              className={`border rounded-lg mb-4 cursor-pointer ${selectedPaymentMethod === 'credit' ? 'border-[#F15A25]' : 'border-gray-300'}`}
              onClick={() => handlePaymentMethodSelect('credit')}
            >
              <div className="flex justify-between items-center p-4">
                <div className="flex items-center">
                  <div
                    className={`w-5 h-5 min-w-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      selectedPaymentMethod === 'credit' ? 'border-[#F15A25]' : 'border-gray-300'
                    }`}
                  >
                    {selectedPaymentMethod === 'credit' && <div className="w-2.5 h-2.5 rounded-full bg-[#F15A25]"></div>}
                  </div>
                  <span className="font-medium text-base">Credit or debit card</span>
                </div>
                <div className="grid md:grid-cols-4 grid-cols-2 gap-2">
                  <img src="/visa.svg" alt="Visa" className="h-6" />
                  <img src="/mastercard.svg" alt="Mastercard" className="h-6" />
                  <img src="/amex.svg" alt="American Express" className="h-6" />
                  <img src="/discover.svg" alt="Discover" className="h-6" />
                </div>
              </div>
            </div>
            <div
              className={`border rounded-lg mb-4 p-4 cursor-pointer flex justify-between items-center ${
                selectedPaymentMethod === 'googlepay' ? 'border-[#F15A25]' : 'border-gray-300'
              }`}
              onClick={() => handlePaymentMethodSelect('googlepay')}
            >
              <div className="flex items-center">
                <div
                  className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                    selectedPaymentMethod === 'googlepay' ? 'border-[#F15A25]' : 'border-gray-300'
                  }`}
                >
                  {selectedPaymentMethod === 'googlepay' && <div className="w-2.5 h-2.5 rounded-full bg-[#F15A25]"></div>}
                </div>
                <span className="font-medium">Google Pay</span>
              </div>
              <div className="flex gap-2 items-center">
                <img src="/gpay.png" alt="Google Pay" className="h-7" />
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    selectedPaymentMethod === 'googlepay' ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </div>
            <div
              className={`border rounded-lg mb-4 p-4 cursor-pointer flex justify-between items-center ${
                selectedPaymentMethod === 'applepay' ? 'border-[#F15A25]' : 'border-gray-300'
              }`}
              onClick={() => handlePaymentMethodSelect('applepay')}
            >
              <div className="flex items-center">
                <div
                  className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                    selectedPaymentMethod === 'applepay' ? 'border-[#F15A25]' : 'border-gray-300'
                  }`}
                >
                  {selectedPaymentMethod === 'applepay' && <div className="w-2.5 h-2.5 rounded-full bg-[#F15A25]"></div>}
                </div>
                <span className="font-medium">Apple Pay</span>
              </div>
              <div className="flex gap-2 items-center">
                <svg viewBox="0 0 24 24" width="24" height="24" className="text-black">
                  <path
                    fill="currentColor"
                    d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <span className="text-sm font-medium">Pay</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    selectedPaymentMethod === 'applepay' ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </div>

            {isAuthenticated && packageData && stripePromise && (
              <Elements stripe={stripePromise} key={selectedPaymentMethod}>
                <CheckoutForm
                  packageData={packageData}
                  selectedPaymentMethod={selectedPaymentMethod}
                  taxCountry={taxCountry}
                  couponCode={couponCode}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </Elements>
            )}

            {!isAuthenticated && !isLoading && (
              <p className="text-center text-sm text-gray-500 mt-3">
                Please sign in with Google or Apple to complete your purchase
              </p>
            )}
          </div>

          <div className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Order summary</h2>
            {packageData && (
              <>
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white mr-3">
                    <img className='w-full h-full object-cover rounded-full' src={`/flags/${packageData.location.toLowerCase()}_flag.jpeg`} alt="" />
                  </div>
                  <span className="font-medium">{getCountryName(packageData.name)}</span>
                </div>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan</span>
                    <span className="font-medium">{packageData.dataAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type</span>
                    <span className="font-medium">Data only</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{packageData.duration} Days</span>
                  </div>

                  <div className="border-t pt-4 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-semibold">USD {formatPrice(packageData.price)}</span>
                  </div>
                </div>

                {!showCouponInput ? (
                  <button
                    onClick={() => setShowCouponInput(true)}
                    className="text-[#F15A25] text-sm font-medium hover:underline"
                  >
                    Got a coupon?
                  </button>
                ) : (
                  <div className="flex gap-2 mt-4">
                    <input
                      type="text"
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F15A25] focus:border-transparent"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <button className="bg-[#F15A25] hover:bg-[#E04E1A] text-white px-4 py-2 rounded-lg transition-colors">
                      Apply
                    </button>
                  </div>
                )}

                <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start">
                    <Info className="w-5 h-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-gray-600">
                      <p className="mb-2">Your eSIM will be delivered instantly after purchase via email and in your account.</p>
                      <p>Installation is quick and easy - scan the QR code with your phone.</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-4 py-16 flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 text-[#F15A25] animate-spin" />
        <span className="ml-4 text-lg font-medium text-gray-700">Loading checkout...</span>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}