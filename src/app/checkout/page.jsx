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

function CheckoutForm({ packageData, selectedPaymentMethod, taxCountry, couponCode, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const { data: session } = useSession();
  const [stripeLoaded, setStripeLoaded] = useState(false);

  useEffect(() => {
    if (stripe && elements) {
      setStripeLoaded(true);
      console.log('Stripe successfully initialized');
    }
  }, [stripe, elements]);

  useEffect(() => {
    if (stripe && packageData && stripeLoaded) {
      console.log('Setting up payment request for wallet payments');
      try {
        const formattedAmount = packageData.price ? Math.round(parseInt(packageData.price)) : 0;
        console.log('Payment amount:', formattedAmount);

        const pr = stripe.paymentRequest({
          country: 'US',
          currency: 'usd',
          total: {
            label: packageData?.name || 'eSIM Package',
            amount: formattedAmount,
          },
          requestPayerName: true,
          requestPayerEmail: true,
        });

        pr.canMakePayment().then((result) => {
          if (result) {
            console.log('Browser supports payment request', result);
            setPaymentRequest(pr);
          } else {
            console.log('Browser does not support payment request');
          }
        }).catch((err) => {
          console.error('Error checking payment request support:', err);
        });

        pr.on('paymentmethod', async (e) => {
          console.log('Payment method received from wallet payment', e.paymentMethod.id);
          setProcessing(true);

          try {
            // Create temporary order
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
                paymentMethod: selectedPaymentMethod === 'applepay' ? 'applepay' : 'googlepay',
                taxCountry: taxCountry,
                couponCode: couponCode || null,
                status: 'pending_payment',
              }),
            });

            if (!orderResponse.ok) {
              const errorData = await orderResponse.json();
              throw new Error(errorData.error || 'Failed to create order');
            }

            const orderData = await orderResponse.json();
            console.log('Temporary order created', orderData);

            // Create payment intent
            const response = await fetch('/api/payment/create-intent', {
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

            if (!response.ok) throw new Error('Payment server error');

            const { clientSecret, orderId } = await response.json();
            console.log('Payment intent created successfully');

            const { error, paymentIntent } = await stripe.confirmCardPayment(
              clientSecret,
              { payment_method: e.paymentMethod.id },
              { handleActions: false }
            );

            if (error) {
              console.error('Error confirming payment', error);
              e.complete('fail');
              onError(error.message);
            } else if (paymentIntent.status === 'requires_action') {
              console.log('Payment requires additional action');
              e.complete('success');
              const { error } = await stripe.confirmCardPayment(clientSecret);
              if (error) {
                console.error('Error after additional action', error);
                onError(error.message);
              } else {
                console.log('Payment confirmed after additional action');
                onSuccess(orderId);
              }
            } else {
              console.log('Payment succeeded', paymentIntent);
              e.complete('success');
              onSuccess(orderId);
            }
          } catch (err) {
            console.error('Payment processing error', err);
            e.complete('fail');
            onError(err.message || 'Payment failed');
          } finally {
            setProcessing(false);
          }
        });
      } catch (error) {
        console.error('Error setting up payment request:', error);
      }
    }
  }, [stripe, packageData, couponCode, taxCountry, selectedPaymentMethod, stripeLoaded, onSuccess, onError]);

  const handleCardSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !packageData || !session) {
      console.error('Missing required elements for payment', {
        stripe: !!stripe,
        elements: !!elements,
        packageData: !!packageData,
        session: !!session,
      });
      onError('Missing required payment information');
      return;
    }

    setProcessing(true);

    try {
      console.log('Processing card payment');
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
          paymentMethod: 'credit',
          taxCountry: taxCountry,
          couponCode: couponCode || null,
          status: 'pending_payment',
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        console.error('Order creation failed:', orderData);
        throw new Error(orderData.error || 'Failed to create order');
      }

      console.log('Temporary order created', orderData);

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      console.log('Creating payment method');
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        console.error('Error creating payment method', error);
        setCardError(error.message);
        setProcessing(false);
        return;
      }

      console.log('Payment method created successfully', paymentMethod.id);

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
        console.error('Payment intent creation failed:', intentData);
        throw new Error(intentData.error || 'Payment server error');
      }

      console.log('Payment intent created successfully');

      console.log('Confirming card payment');
      const { error: confirmError } = await stripe.confirmCardPayment(intentData.clientSecret);

      if (confirmError) {
        console.error('Error confirming payment', confirmError);
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
  };

  if (!stripeLoaded) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="w-8 h-8 text-[#F15A25] animate-spin mr-3" />
        <span className="text-gray-600">Loading payment options...</span>
      </div>
    );
  }

  if (selectedPaymentMethod === 'credit') {
    return (
      <form onSubmit={handleCardSubmit}>
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
          className={`w-full mt-6 font-medium py-3 rounded-lg transition-colors flex items-center justify-center ${!session
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
  } else if ((selectedPaymentMethod === 'googlepay' || selectedPaymentMethod === 'applepay') && paymentRequest) {
    return (
      <div className="mt-6">
        <PaymentRequestButtonElement
          options={{
            paymentRequest,
            style: { paymentRequestButton: { theme: 'dark', height: '48px' } },
          }}
        />
        <p className="text-center text-sm text-gray-500 mt-3">
          {selectedPaymentMethod === 'applepay' ? 'Pay with Apple Pay' : 'Pay with Google Pay'}
        </p>
      </div>
    );
  } else if (selectedPaymentMethod === 'googlepay' || selectedPaymentMethod === 'applepay') {
    return (
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
        <p className="text-center text-sm text-yellow-700">
          {selectedPaymentMethod === 'applepay' ? 'Apple Pay' : 'Google Pay'} is not available in your browser or device.
          Please select another payment method.
        </p>
      </div>
    );
  }

  return null;
}

// Create a client component that uses search params
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
    <div className=" bg-[#f7f7f8] mx-auto py-12 px-4 sm:px-6 lg:px-8 ">
      <div className='max-w-[1220px] mx-auto'>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-sm">
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
                <div className="flex gap-3 mb-6">
                  <button
                    onClick={handleGoogleSignIn}
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Continue with Google</span>
                  </button>
                  <button
                    onClick={handleAppleSignIn}
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Continue with Apple</span>
                  </button>
                </div>
                <div className="text-xs text-gray-500 mb-8">
                  We will occasionally send you news about special offers, which you can opt out of at any time by contacting{' '}
                  <a href="mailto:support@esim.com" className="text-[#F15A25]">
                    support@esim.com
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
                    className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${selectedPaymentMethod === 'credit' ? 'border-[#F15A25]' : 'border-gray-300'
                      }`}
                  >
                    {selectedPaymentMethod === 'credit' && <div className="w-2.5 h-2.5 rounded-full bg-[#F15A25]"></div>}
                  </div>
                  <span className="font-medium">Credit or debit card</span>
                </div>
                <div className="flex gap-2">
                  <img src="/visa.svg" alt="Visa" className="h-6" />
                  <img src="/mastercard.svg" alt="Mastercard" className="h-6" />
                  <img src="/amex.svg" alt="American Express" className="h-6" />
                  <img src="/discover.svg" alt="Discover" className="h-6" />
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${selectedPaymentMethod === 'credit' ? 'rotate-180' : ''
                      }`}
                  />
                </div>
              </div>
            </div>
            <div
              className={`border rounded-lg mb-4 p-4 cursor-pointer flex justify-between items-center ${selectedPaymentMethod === 'googlepay' ? 'border-[#F15A25]' : 'border-gray-300'
                }`}
              onClick={() => handlePaymentMethodSelect('googlepay')}
            >
              <div className="flex items-center">
                <div
                  className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${selectedPaymentMethod === 'googlepay' ? 'border-[#F15A25]' : 'border-gray-300'
                    }`}
                >
                  {selectedPaymentMethod === 'googlepay' && <div className="w-2.5 h-2.5 rounded-full bg-[#F15A25]"></div>}
                </div>
                <span className="font-medium">Google Pay</span>
              </div>
              <div className="flex gap-2 items-center">
                <img src="/gpay.svg" alt="Google Pay" className="h-6" />
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${selectedPaymentMethod === 'googlepay' ? 'rotate-180' : ''
                    }`}
                />
              </div>
            </div>
            <div
              className={`border rounded-lg mb-4 p-4 cursor-pointer flex justify-between items-center ${selectedPaymentMethod === 'applepay' ? 'border-[#F15A25]' : 'border-gray-300'
                }`}
              onClick={() => handlePaymentMethodSelect('applepay')}
            >
              <div className="flex items-center">
                <div
                  className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${selectedPaymentMethod === 'applepay' ? 'border-[#F15A25]' : 'border-gray-300'
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
                  className={`w-5 h-5 text-gray-400 transition-transform ${selectedPaymentMethod === 'applepay' ? 'rotate-180' : ''
                    }`}
                />
              </div>
            </div>

            {isAuthenticated && packageData && (
              <Elements stripe={stripePromise}>
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
                    <img className='w-full h-full object-cover rounded-full' src={`/flags/${packageData.location}_flag.jpeg`} alt="" /> 
                  </div>
                  <span className="font-medium">{packageData.name}</span>
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
                    <span className="font-medium">{packageData.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax country</span>
                    <button
                      className="font-medium text-[#F15A25] hover:underline cursor-pointer focus:outline-none"
                      onClick={() => setTaxCountry('Bangladesh')} // Simplified for demo
                    >
                      {taxCountry}
                    </button>
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

// Main component with suspense boundary
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