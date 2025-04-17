'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Check, Download, ChevronRight, Smartphone,
  HelpCircle, Loader2, RefreshCw, User, Mail, Copy, CheckCircle
} from 'lucide-react';
import SetupProcess from '@/components/Home/SetupProcess';

// Create a client component that uses search params
function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState('initializing'); // initializing, verifying, generating, completed, error
  const [startTime, setStartTime] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [autoEmailSent, setAutoEmailSent] = useState(false);
  const [copiedICCID, setCopiedICCID] = useState(false);
  const maxRetries = 5;
  const retryDelay = 3000; // 3 seconds

  const fetchOrderData = async () => {
    if (!orderId) {
      setError('No order ID provided');
      setLoading(false);
      setLoadingPhase('error');
      return;
    }

    if (!isAuthenticated && !isLoading) {
      setError('You must be logged in to view order details');
      setLoading(false);
      setLoadingPhase('error');
      return;
    }

    if (isLoading) {
      return;
    }

    try {
      setLoading(true);
      // Show a more specific loading message during API call
      setLoadingPhase(retryCount === 0 ? 'verifying' : 'generating');

      const response = await fetch(`/api/orders?orderId=${orderId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch order: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.order) {
        throw new Error('Order not found');
      }

      console.log('Fetched order data:', {
        orderId: data.order.orderId,
        orderStatus: data.order.orderStatus,
        paymentStatus: data.order.paymentStatus,
        failureReason: data.order.failureReason || 'none',
        esimDetails: {
          orderNo: data.order.esimDetails?.orderNo,
          qrCodeUrl: data.order.esimDetails?.qrCodeUrl ? 'exists' : 'missing',
          iccid: data.order.esimDetails?.iccid || 'missing',
          packageListLength: data.order.esimDetails?.packageList?.length || 0,
        },
      });

      // Always update the order data
      setOrderData(data.order);

      // If we have a complete eSIM with QR code, we're done
      if (data.order.esimDetails?.qrCodeUrl && data.order.esimDetails?.iccid) {
        setLoading(false);
        setLoadingPhase('completed');
        setError(null);
        return;
      }

      // Handle different failure cases
      if (data.order.orderStatus === 'failed') {
        if (data.order.esimDetails?.qrCodeUrl && data.order.esimDetails?.iccid) {
          // Special case: has QR code despite failed status
          console.log('Ignoring failed status: valid qrCodeUrl and iccid present');
          setLoading(false);
          setLoadingPhase('completed');
          setError(null);
        } else {
          setError(data.order.failureReason || 'Order processing failed. Please contact support.');
          setLoading(false);
          setLoadingPhase('error');
        }
        return;
      }

      if (
        data.order.orderStatus === 'insufficient_balance' &&
        data.order.failureReason?.includes('insufficient balance')
      ) {
        setError('The admin has insufficient balance, please contact us.');
        setLoading(false);
        setLoadingPhase('error');
        return;
      }

      // If we're still waiting for eSIM generation
      if (
        (!data.order.esimDetails?.qrCodeUrl || !data.order.esimDetails?.iccid) &&
        data.order.orderStatus !== 'failed' &&
        data.order.esimDetails?.esimStatus !== 'CANCEL'
      ) {
        if (!data.order.esimDetails?.orderNo) {
          // Special case: we don't even have an order number yet, might need more time
          if (retryCount < maxRetries) {
            console.log(`No orderNo yet, scheduling retry ${retryCount + 1}/${maxRetries}`);
            setTimeout(() => {
              setRetryCount((prev) => prev + 1);
              fetchOrderData();
            }, retryDelay);
            return;
          } else {
            setError(
              data.order.paymentStatus === 'completed'
                ? 'Your payment was successful, but eSIM processing is incomplete. Please retry or contact support.'
                : 'Order processing incomplete. Please try again later or contact support.'
            );
            setLoading(false);
            setLoadingPhase('error');
            return;
          }
        }

        // We have an order number, so let's check with eSIM Access API
        setLoadingPhase('generating');
        console.log('Querying eSIM profile from eSIM Access API');
        const queryResponse = await fetch('/api/esim/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, orderNo: data.order.esimDetails.orderNo }),
        });

        const queryData = await queryResponse.json();
        if (!queryResponse.ok) {
          console.error('eSIM query failed:', queryData);
          if (queryData.errorCode === '200010' && retryCount < maxRetries) {
            console.log(`Profiles not ready, scheduling retry ${retryCount + 1}/${maxRetries}`);
            setTimeout(() => {
              setRetryCount((prev) => prev + 1);
              fetchOrderData();
            }, retryDelay);
            return;
          }
          throw new Error(queryData.error || 'Failed to query eSIM profile');
        }

        if (queryData.success && queryData.esimDetails?.qrCodeUrl) {
          console.log('eSIM profile fetched:', {
            qrCodeUrl: 'exists',
            iccid: queryData.esimDetails.iccid ? 'exists' : 'missing',
            packageListLength: queryData.esimDetails.packageList?.length || 0,
          });

          // Update our local state with the new eSIM details
          setOrderData((prev) => ({
            ...prev,
            esimDetails: queryData.esimDetails,
            orderStatus: queryData.esimDetails.qrCodeUrl ? 'completed' : prev.orderStatus,
          }));

          setLoading(false);
          setLoadingPhase('completed');
          setError(null);
        } else if (retryCount < maxRetries) {
          // Schedule another retry if we haven't reached the limit
          console.log(`Scheduling retry ${retryCount + 1}/${maxRetries} in ${retryDelay}ms`);
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
            fetchOrderData();
          }, retryDelay);
        } else {
          // We've reached the retry limit but still don't have a QR code
          setError('eSIM generation is taking longer than expected. Please try refreshing in a few minutes or contact support.');
          setLoading(false);
          setLoadingPhase('error');
        }
      } else {
        // We have all the necessary data
        setError(null);
        setLoading(false);
        setLoadingPhase('completed');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err.message || 'Failed to load order data');
      setLoadingPhase('error');
      setLoading(false);
    }
  };

  // Send purchase information to user's email
  const sendPurchaseEmail = async (orderId, userEmail, setEmailSending, setEmailSent) => {
    if (!orderId || !userEmail) return false;

    try {
      setEmailSending(true);

      const response = await fetch('/api/email/resend-esim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          email: userEmail,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setEmailSent(true);
        setTimeout(() => {
          setEmailSent(false);
        }, 5000); // Reset the status after 5 seconds
        return true;
      } else {
        throw new Error(data.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    } finally {
      setEmailSending(false);
    }
  };

  // Add this effect to automatically send email after data loads
  useEffect(() => {
    // Only send the email when:
    // 1. We have order data
    // 2. The order has complete eSIM details (QR code and ICCID)
    // 3. The user is authenticated and has an email
    // 4. The automatic email hasn't been sent yet in this session
    // 5. We're not already in the process of sending an email
    // 6. The page is fully loaded (loadingPhase is 'completed')
    if (
      orderData &&
      orderData.esimDetails?.qrCodeUrl &&
      orderData.esimDetails?.iccid &&
      session?.user?.email &&
      !autoEmailSent &&
      !emailSending &&
      loadingPhase === 'completed'
    ) {
      // Set autoEmailSent immediately to prevent multiple sends
      setAutoEmailSent(true);

      // Add a small delay to ensure the page is fully rendered first
      const timer = setTimeout(() => {
        sendPurchaseEmail(orderData.orderId, session.user.email, setEmailSending, setEmailSent);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [orderData, session, autoEmailSent, emailSending, loadingPhase]);

  const handleResendEmail = () => {
    if (orderData && session?.user?.email && !emailSending) {
      sendPurchaseEmail(orderData.orderId, session.user.email, setEmailSending, setEmailSent);
    }
  };


  // Copy ICCID to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedICCID(true);
        setTimeout(() => setCopiedICCID(false), 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };

  useEffect(() => {
    if (!startTime) {
      setStartTime(Date.now());
    }

    if (!isLoading && isAuthenticated) {
      fetchOrderData();
    }
  }, [orderId, isAuthenticated, isLoading]);

  const handleManualRetry = () => {
    setRetryCount(0);
    setStartTime(Date.now());
    setLoading(true);
    setLoadingPhase('verifying');
    fetchOrderData();
  };

  const formatPrice = (price) => {
    if (!price) return '0.00';
    return typeof price === 'number' ? (price / 100).toFixed(2) : price;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format data size (bytes to GB)
  const formatDataSize = (bytes) => {
    if (!bytes) return 'N/A';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  // Loading state - shows a more detailed and informative loading message
  if (isLoading || loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 flex flex-col justify-center items-center h-64 text-center">
        <Loader2 className="w-10 h-10 text-[#F15A25] animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {loadingPhase === 'initializing' && 'Initializing...'}
          {loadingPhase === 'verifying' && 'Verifying your payment...'}
          {loadingPhase === 'generating' && 'Generating your eSIM...'}
        </h2>
        <p className="text-base text-gray-700 mb-2">
          {loadingPhase === 'generating' ? 'Preparing your QR code for activation' : 'Checking your order status'}
        </p>

        {loadingPhase === 'generating' && (
          <>
            <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5 mt-4 mb-2">
              <div
                className="bg-[#F15A25] h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (retryCount / maxRetries) * 100)}%` }}
              ></div>
            </div>

            <p className="text-sm text-gray-600">
              Attempt {retryCount + 1} of {maxRetries + 1}
            </p>
            <p className="text-sm text-gray-500 mt-3 max-w-md">
              This typically takes 10-30 seconds. Your eSIM details will also be emailed to you once ready.
            </p>

            {retryCount > 1 && (
              <button
                onClick={handleManualRetry}
                className="mt-4 flex items-center text-[#F15A25] gap-1 text-sm font-medium hover:underline"
              >
                <RefreshCw size={16} />
                Retry Now
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-red-50 p-6 rounded-lg border border-red-100 max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Something went wrong</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex gap-4">
            <button
              onClick={handleManualRetry}
              className="bg-[#F15A25] hover:bg-[#E04E1A] text-white px-4 py-2 rounded transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            <a
              href="mailto:support@esim.com"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Order not found state
  if (!orderData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-100 max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-yellow-700 mb-2">Order Not Found</h2>
          <p className="text-yellow-600 mb-4">We couldn't find the order you're looking for.</p>
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

  // Normal successful state - with enhanced ICCID display
  return (
    <div className=" max-w-[1220px] mx-auto px-4 py-12 bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-sm mb-8 text-center">
        <div className="bg-green-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-gray-800">Thank You for Your Order!</h1>
        <p className="text-gray-600 mb-4">Your eSIM order has been received and is ready to use.</p>
        <p className="text-sm text-gray-500">Order ID: {orderData.orderId}</p>

        {/* Email purchase info button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleResendEmail}
            disabled={emailSending || emailSent}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${emailSent
              ? 'bg-green-100 text-green-700'
              : emailSending
                ? 'bg-gray-100 text-gray-500'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
          >
            {emailSent ? (
              <>
                <CheckCircle size={16} /> Email Sent Successfully
              </>
            ) : emailSending ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Sending Email...
              </>
            ) : (
              <>
                <Mail size={16} /> Email My Purchase Details
              </>
            )}
          </button>
        </div>
      </div>

      {orderData.esimDetails && orderData.esimDetails.qrCodeUrl ? (
        <div className="bg-white p-8 rounded-lg shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-6">Your eSIM</h2>
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="w-full md:w-1/2 flex flex-col items-center">
              <div className="border border-gray-200 p-4 rounded-lg mb-4">
                <img
                  src={orderData.esimDetails.qrCodeUrl}
                  alt="eSIM QR Code"
                  className="w-full max-w-xs mx-auto"
                />
              </div>
              <div className="flex flex-col items-center gap-2 w-full">
                <a
                  href={orderData.esimDetails.qrCodeUrl}
                  download={`esim-${orderData.orderId}.png`}
                  className="flex items-center text-[#F15A25] gap-1 text-sm font-medium"
                >
                  <Download size={16} />
                  Download QR Code
                </a>
                {orderData.esimDetails.shortUrl && (
                  <a
                    href={orderData.esimDetails.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="md:text-sm text-xs text-gray-600"
                  >
                    {orderData.esimDetails.shortUrl}
                  </a>
                )}
              </div>
            </div>

            <div className="w-full md:w-1/2">
              {/* eSIM Technical Details */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <h3 className="font-medium text-gray-800 mb-3">eSIM Technical Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">ICCID:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {orderData.esimDetails.iccid}
                      </span>
                      <button
                        onClick={() => copyToClipboard(orderData.esimDetails.iccid)}
                        className="text-gray-500 hover:text-[#F15A25]"
                        title="Copy to clipboard"
                      >
                        {copiedICCID ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  {orderData.esimDetails.imsi && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">IMSI:</span>
                      <span className="text-sm font-mono">{orderData.esimDetails.imsi}</span>
                    </div>
                  )}

                  {orderData.esimDetails.apn && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">APN:</span>
                      <span className="text-sm font-medium">{orderData.esimDetails.apn}</span>
                    </div>
                  )}

                  {orderData.esimDetails.pin && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">PIN:</span>
                      <span className="text-sm font-medium">{orderData.esimDetails.pin}</span>
                    </div>
                  )}

                  {orderData.esimDetails.totalVolume > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Data Allowance:</span>
                      <span className="text-sm font-medium">
                        {formatDataSize(orderData.esimDetails.totalVolume)}
                      </span>
                    </div>
                  )}

                  {orderData.esimDetails.expiredTime && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Expiry Date:</span>
                      <span className="text-sm font-medium">
                        {formatDate(orderData.esimDetails.expiredTime)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Installation Instructions */}
              <h3 className="font-medium text-gray-800 mb-3">Installation Instructions</h3>
              <ol className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="bg-gray-100 rounded-full h-5 w-5 flex items-center justify-center text-gray-500 text-xs mr-2 mt-0.5">
                    1
                  </span>
                  <span>Go to your phone settings</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-gray-100 rounded-full h-5 w-5 flex items-center justify-center text-gray-500 text-xs mr-2 mt-0.5">
                    2
                  </span>
                  <span>Navigate to Mobile Data or Cellular</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-gray-100 rounded-full h-5 w-5 flex items-center justify-center text-gray-500 text-xs mr-2 mt-0.5">
                    3
                  </span>
                  <span>Select Add Data Plan or Add eSIM</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-gray-100 rounded-full h-5 w-5 flex items-center justify-center text-gray-500 text-xs mr-2 mt-0.5">
                    4
                  </span>
                  <span>Scan the QR code provided</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-gray-100 rounded-full h-5 w-5 flex items-center justify-center text-gray-500 text-xs mr-2 mt-0.5">
                    5
                  </span>
                  <span>Follow on-screen instructions to activate</span>
                </li>
              </ol>
              <div className="mt-6">
                <Link
                  href="/support/installation-guide"
                  className="flex items-center text-[#F15A25] gap-1 text-sm font-medium"
                >
                  <HelpCircle size={16} />
                  Need help? View detailed guide
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {orderData.esimDetails?.esimStatus === 'CANCEL'
              ? 'Order Cancelled'
              : 'Your eSIM is being processed'}
          </h2>
          <p className="text-gray-600 mb-6">
            {orderData.esimDetails?.esimStatus === 'CANCEL'
              ? 'Unfortunately, your eSIM order was cancelled. Please contact support for assistance.'
              : 'Your eSIM QR code is being generated and will be available shortly. You will also receive an email with your eSIM details.'}
          </p>
          <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
            {orderData.esimDetails?.esimStatus === 'CANCEL' ? (
              <a
                href="mailto:support@esim.com"
                className="text-[#F15A25] hover:underline font-medium"
              >
                Contact Support
              </a>
            ) : (
              <>
                <div className="flex items-center">
                  <Loader2 className="w-8 h-8 text-[#F15A25] animate-spin mr-3" />
                  <span className="text-gray-600">Generating your eSIM QR code...</span>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Attempt {retryCount + 1} of {maxRetries + 1}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  This may take a few seconds. You'll also receive an email with your eSIM details.
                </p>
                <button
                  onClick={handleManualRetry}
                  className="mt-4 flex items-center text-[#F15A25] gap-1 text-sm font-medium hover:underline"
                >
                  <RefreshCw size={16} />
                  Retry Now
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Order details section */}
      <div className="bg-white p-8 rounded-lg shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-6">Order Details</h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white mr-3">

              <img
                className="h-full w-full object-cover rounded-full"
                src={`/flags/${orderData.location}_flag.jpeg`}
                alt="flag"
              />
            </div>
            <span className="font-medium">{orderData.packageName}</span>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Plan</span>
              <span className="font-medium">{orderData.dataAmount}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Duration</span>
              <span className="font-medium">{orderData.duration}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Location</span>
              <span className="font-medium">{orderData.location}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Order Date</span>
              <span className="font-medium">{formatDate(orderData.createdAt)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium capitalize">{orderData.paymentMethod}</span>
            </div>
            {orderData.couponCode && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Coupon</span>
                <span className="font-medium">{orderData.couponCode}</span>
              </div>
            )}
            {orderData.discountAmount > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Discount</span>
                <span className="font-medium">
                  -{orderData.currency} {formatPrice(orderData.discountAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between py-2 font-semibold">
              <span>Total</span>
              <span>
                {orderData.currency} {formatPrice(orderData.finalPrice) / 100}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* What's Next section */}
      <div className="bg-white p-8 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-6">What's Next?</h2>
        <div className="space-y-6">
          <div className="flex">
            <div className="h-8 w-8 bg-[#F15A25] bg-opacity-10 rounded-full flex items-center justify-center text-[#F15A25] mr-4 flex-shrink-0">
              <Smartphone size={18} />
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-1">Install Your eSIM</h3>
              <p className="text-sm text-gray-600">
                Follow the instructions above to install your eSIM on your device.
              </p>
            </div>
          </div>
          <div className="flex">
            <div className="h-8 w-8 bg-[#F15A25] bg-opacity-10 rounded-full flex items-center justify-center text-[#F15A25] mr-4 flex-shrink-0">
              <HelpCircle size={18} />
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-1">Need Help?</h3>
              <p className="text-sm text-gray-600">
                Our support team is available 24/7 to assist you with any questions.
              </p>
              <a
                href="mailto:support@esim.com"
                className="text-sm text-[#F15A25] font-medium inline-block mt-1"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center">
          <Link
            href="/destinations"
            className="bg-[#F15A25] hover:bg-[#E04E1A] text-white px-6 py-2 rounded-lg transition-colors"
          >
            Browse More Destinations
          </Link>
        </div>
      </div>
      <SetupProcess />
    </div>
  );
}

// Main component with suspense boundary
export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 py-16 flex flex-col justify-center items-center h-64 text-center">
        <Loader2 className="w-10 h-10 text-[#F15A25] animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading...</h2>
        <p className="text-gray-600">Please wait while we fetch your order details</p>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}