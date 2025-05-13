'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Check, Loader2, RefreshCw, Mail, Copy, CheckCircle
} from 'lucide-react';
import PropTypes from 'prop-types';
import SetupProcess from '@/components/Home/SetupProcess';
import ESIMPopup from '@/components/ESIMPopup'; // Import the ESIMPopup component

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="max-w-3xl mx-auto px-4 py-16 flex flex-col justify-center items-center h-64 text-center">
    <Loader2 className="w-10 h-10 text-[#F15A25] animate-spin mb-4" />
    <div className="animate-pulse space-y-4">
      <div className="h-6 bg-gray-200 rounded w-48"></div>
      <div className="h-4 bg-gray-200 rounded w-64"></div>
      <div className="h-2 bg-gray-200 rounded-full w-80"></div>
    </div>
  </div>
);

// Error Display Component
const ErrorDisplay = memo(({ error, onRetry }) => (
  <div className="max-w-3xl mx-auto px-4 py-12">
    <div className="bg-red-50 p-6 rounded-lg border border-red-100 max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-red-700 mb-2">Something went wrong</h2>
      <p className="text-red-600 mb-4">{error}</p>
      <div className="flex gap-4">
        <button
          onClick={onRetry}
          className="bg-[#F15A25] hover:bg-[#E04E1A] text-white px-4 py-2 rounded transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
        <a
          href="mailto:support@fliday.com"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded transition-colors"
        >
          Contact Support
        </a>
      </div>
    </div>
  </div>
));

ErrorDisplay.propTypes = {
  error: PropTypes.string.isRequired,
  onRetry: PropTypes.func.isRequired,
};

const ConfirmationContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const orderId = searchParams.get('orderId') || '';

  const [state, setState] = useState({
    orderData: null,
    loading: true,
    error: null,
    retryCount: 0,
    loadingPhase: 'initializing',
    emailSent: false,
    emailSending: false,
    autoEmailSent: false,
    copiedICCID: false,
    copiedSMDP: false,
    copiedActivation: false,
    copiedPIN: false,
    copiedPUK: false,
    copiedAPN: false,
    activeTab: 'qr',
    isPopupOpen: false // New state for popup visibility
  });

  const maxRetries = 5;
  const retryDelay = 3000;

  const formatPrice = useCallback((price) => {
    if (!price) return '0.00';
    return (price / 100).toFixed(2);
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  }, []);

  const formatDataSize = useCallback((bytes) => {
    if (!bytes) return 'N/A';
    const gb = bytes / (1024 * 1024 * 1024);
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, []);

  const formatSmsStatus = useCallback((status) => {
    switch (status) {
      case 0: return 'SMS Not Supported';
      case 1: return 'Supports Mobile and API SMS';
      case 2: return 'Only API SMS Supported';
      default: return 'N/A';
    }
  }, []);

  const formatDataType = useCallback((type) => {
    switch (type) {
      case 1: return 'Fixed Amount';
      case 2: return 'Daily Unlimited (FUP)';
      default: return 'N/A';
    }
  }, []);

  const formatActiveType = useCallback((type) => {
    switch (type) {
      case 1: return 'First Installation';
      case 2: return 'First Network Connection';
      default: return 'N/A';
    }
  }, []);

  // Parse SM-DP+ Address and Activation Code from ac
  const parseActivationCode = useCallback((ac) => {
    if (!ac || typeof ac !== 'string') {
      return { smdpAddress: 'N/A', activationCode: 'N/A' };
    }
    const parts = ac.split('$');
    if (parts.length !== 3 || !parts[1] || !parts[2]) {
      return { smdpAddress: 'N/A', activationCode: ac };
    }
    return {
      smdpAddress: parts[1],
      activationCode: parts[2]
    };
  }, []);

  const fetchOrderData = useCallback(async () => {
    if (!orderId) {
      setState(prev => ({ ...prev, error: 'No order ID provided', loading: false, loadingPhase: 'error' }));
      return;
    }

    if (status !== 'authenticated') {
      setState(prev => ({ ...prev, error: 'Please log in to view order details', loading: false, loadingPhase: 'error' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, loadingPhase: prev.retryCount === 0 ? 'verifying' : 'generating' }));

      const response = await fetch(`/api/orders?orderId=${orderId}`);
      if (!response.ok) {
        throw new Error((await response.json()).error || 'Failed to fetch order');
      }

      const data = await response.json();
      if (!data.success || !data.order) {
        throw new Error('Order not found');
      }

      setState(prev => ({ ...prev, orderData: data.order }));

      if (data.order.esimDetails?.qrCodeUrl && data.order.esimDetails?.iccid) {
        setState(prev => ({ ...prev, loading: false, loadingPhase: 'completed', error: null }));
        return;
      }

      if (data.order.orderStatus === 'failed' || data.order.esimDetails?.esimStatus === 'CANCEL') {
        setState(prev => ({
          ...prev,
          error: data.order.failureReason || 'Order processing failed or eSIM canceled',
          loading: false,
          loadingPhase: 'error'
        }));
        return;
      }

      if (state.retryCount < maxRetries) {
        setTimeout(() => {
          setState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
          fetchOrderData();
        }, retryDelay);
      } else {
        setState(prev => ({
          ...prev,
          error: 'eSIM generation timeout. Please try again later.',
          loading: false,
          loadingPhase: 'error'
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to load order data',
        loading: false,
        loadingPhase: 'error'
      }));
    }
  }, [orderId, status, state.retryCount]);

  const sendPurchaseEmail = useCallback(async () => {
    if (!state.orderData?.orderId || !session?.user?.email) return;

    try {
      setState(prev => ({ ...prev, emailSending: true }));
      const response = await fetch('/api/email/resend-esim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: state.orderData.orderId,
          email: session.user.email,
        }),
      });

      if (!response.ok) throw new Error((await response.json()).error || 'Failed to send email');

      setState(prev => ({ ...prev, emailSent: true }));
      setTimeout(() => setState(prev => ({ ...prev, emailSent: false })), 5000);
    } catch (error) {
      console.error('Email sending failed:', error);
    } finally {
      setState(prev => ({ ...prev, emailSending: false }));
    }
  }, [state.orderData, session?.user?.email]);

  const copyToClipboard = useCallback((text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      setState(prev => ({
        ...prev,
        [`copied${type.charAt(0).toUpperCase() + type.slice(1)}`]: true
      }));
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          [`copied${type.charAt(0).toUpperCase() + type.slice(1)}`]: false
        }));
      }, 2000);
    }).catch(err => console.error('Copy failed:', err));
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchOrderData();
    }
  }, [status, fetchOrderData]);

  useEffect(() => {
    if (
      state.orderData?.esimDetails?.qrCodeUrl &&
      state.orderData?.esimDetails?.iccid &&
      session?.user?.email &&
      !state.autoEmailSent &&
      !state.emailSending &&
      state.loadingPhase === 'completed'
    ) {
      setState(prev => ({ ...prev, autoEmailSent: true }));
      const timer = setTimeout(sendPurchaseEmail, 1000);
      return () => clearTimeout(timer);
    }
  }, [
    state.orderData,
    state.autoEmailSent,
    state.emailSending,
    state.loadingPhase,
    session?.user?.email,
    sendPurchaseEmail
  ]);

  const memoizedOrderDetails = useMemo(() => {
    const { smdpAddress, activationCode } = parseActivationCode(state.orderData?.esimDetails?.ac);
    return {
      formattedPrice: formatPrice(state.orderData?.finalPrice),
      formattedOrderDate: formatDate(state.orderData?.createdAt),
      formattedExpiryDate: formatDate(state.orderData?.esimDetails?.expiredTime),
      formattedDataSize: state.orderData?.dataAmount || formatDataSize(state.orderData?.esimDetails?.totalVolume),
      formattedUsedData: formatDataSize(state.orderData?.esimDetails?.orderUsage),
      packageName: state.orderData?.packageName || 'N/A',
      location: state.orderData?.location || 'N/A',
      duration: state.orderData?.esimDetails?.totalDuration || state.orderData?.duration || 'N/A',
      durationUnit: state.orderData?.esimDetails?.durationUnit || 'DAY',
      currency: state.orderData?.currency || 'USD',
      smsStatus: formatSmsStatus(state.orderData?.esimDetails?.smsStatus),
      dataType: formatDataType(state.orderData?.esimDetails?.dataType),
      activeType: formatActiveType(state.orderData?.esimDetails?.activeType),
      smdpStatus: state.orderData?.esimDetails?.smdpStatus || 'N/A',
      esimStatus: state.orderData?.esimDetails?.esimStatus || 'N/A',
      smdpAddress,
      activationCode
    };
  }, [
    state.orderData,
    formatPrice,
    formatDate,
    formatDataSize,
    formatSmsStatus,
    formatDataType,
    formatActiveType,
    parseActivationCode
  ]);

  if (state.loading || status === 'loading') {
    return <LoadingSkeleton />;
  }

  if (state.error) {
    return <ErrorDisplay error={state.error} onRetry={fetchOrderData} />;
  }

  if (!state.orderData) {
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

  // Handler to open the popup
  const handleSeeInstructions = () => {
    setState(prev => ({ ...prev, isPopupOpen: true }));
  };

  return (
    <div className="max-w-[1220px] mx-auto px-4 my-20 bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-sm mb-8 text-center">
        <div className="bg-[#F15A25] h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="h-12 w-12 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-gray-800">Thank you for your purchase!</h1>
        <p className="text-gray-600 mb-4">Your eSIM is ready. See the details below to get started.</p>
        <p className="text-gray-600 mb-4">Your eSIM order details have been sent to your email address.</p>
        <small>If you don’t see the email, please check your spam folder or click the button below to resend it.</small>

        <div className="mt-6 flex justify-center">
          <button
            onClick={sendPurchaseEmail}
            disabled={state.emailSending || state.emailSent}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${state.emailSent ? 'bg-green-100 text-green-700' :
              state.emailSending ? 'bg-gray-100 text-gray-500' :
                'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
          >
            {state.emailSent ? (
              <>
                <CheckCircle size={16} /> Email Sent Successfully
              </>
            ) : state.emailSending ? (
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

      {state.orderData.esimDetails && state.orderData.esimDetails.qrCodeUrl && (
        <div className="bg-white p-8 rounded-lg shadow-sm mb-8">
          <div className="flex mb-6 max-w-md mx-auto">
            <button
              className={`flex-1 p-3 rounded-l-lg text-center text-sm font-medium transition-colors ${state.activeTab === 'qr' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              onClick={() => setState(prev => ({ ...prev, activeTab: 'qr' }))}
            >
              QR code install
            </button>
            <button
              className={`flex-1 p-3 rounded-r-lg text-center text-sm font-medium transition-colors ${state.activeTab === 'manual' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              onClick={() => setState(prev => ({ ...prev, activeTab: 'manual' }))}
            >
              Manual install
            </button>
          </div>

          {state.activeTab === 'qr' && (
            <div className="flex flex-col items-center max-w-md mx-auto">
              <img
                src={state.orderData.esimDetails.qrCodeUrl}
                alt="eSIM QR Code"
                className="w-48 h-48 mb-4"
                loading="lazy"
              />
              <h3 className="text-lg font-medium text-center mb-1">Install eSIM with QR code</h3>
              <p className="text-sm text-gray-600 text-center mb-4">
                Scan this QR code with your device
              </p>
              <button
                onClick={handleSeeInstructions}
                className="bg-[#F15A25] text-white px-6 py-2 rounded-full text-sm font-medium"
              >
                See Instructions
              </button>
            </div>
          )}

          {state.activeTab === 'manual' && (
            <div className="flex flex-col items-center max-w-md mx-auto">
              <div className="w-full mb-4">
                <p className="text-xs text-gray-500 mb-1">SM-DP+ Address</p>
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <span className="text-sm text-gray-900">{memoizedOrderDetails.smdpAddress}</span>
                  <button
                    onClick={() => copyToClipboard(memoizedOrderDetails.smdpAddress, 'smdp')}
                    className="text-gray-600 hover:text-gray-800 ml-2"
                  >
                    {state.copiedSMDP ? <Check size={18} /> : <Copy size={18} />}
                    <span className="sr-only">Copy</span>
                  </button>
                </div>
              </div>

              <div className="w-full mb-4">
                <p className="text-xs text-gray-500 mb-1">Activation Code</p>
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <span className="text-sm text-gray-900">{memoizedOrderDetails.activationCode}</span>
                  <button
                    onClick={() => copyToClipboard(memoizedOrderDetails.activationCode, 'activation')}
                    className="text-gray-600 hover:text-gray-800 ml-2"
                  >
                    {state.copiedActivation ? <Check size={18} /> : <Copy size={18} />}
                    <span className="sr-only">Copy</span>
                  </button>
                </div>
              </div>

              <div className="w-full mb-4">
                <p className="text-xs text-gray-500 mb-1">ICCID</p>
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <span className="text-sm text-gray-900">{state.orderData.esimDetails.iccid || 'N/A'}</span>
                  <button
                    onClick={() => copyToClipboard(state.orderData.esimDetails.iccid || 'N/A', 'iccid')}
                    className="text-gray-600 hover:text-gray-800 ml-2"
                  >
                    {state.copiedICCID ? <Check size={18} /> : <Copy size={18} />}
                    <span className="sr-only">Copy</span>
                  </button>
                </div>
              </div>

              {state.orderData.esimDetails.pin && (
                <div className="w-full mb-4">
                  <p className="text-xs text-gray-500 mb-1">PIN</p>
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm text-gray-900">{state.orderData.esimDetails.pin}</span>
                    <button
                      onClick={() => copyToClipboard(state.orderData.esimDetails.pin, 'pin')}
                      className="text-gray-600 hover:text-gray-800 ml-2"
                    >
                      {state.copiedPIN ? <Check size={18} /> : <Copy size={18} />}
                      <span className="sr-only">Copy</span>
                    </button>
                  </div>
                </div>
              )}

              {state.orderData.esimDetails.puk && (
                <div className="w-full mb-4">
                  <p className="text-xs text-gray-500 mb-1">PUK</p>
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm text-gray-900">{state.orderData.esimDetails.puk}</span>
                    <button
                      onClick={() => copyToClipboard(state.orderData.esimDetails.puk, 'puk')}
                      className="text-gray-600 hover:text-gray-800 ml-2"
                    >
                      {state.copiedPUK ? <Check size={18} /> : <Copy size={18} />}
                      <span className="sr-only">Copy</span>
                    </button>
                  </div>
                </div>
              )}

              {state.orderData.esimDetails.apn && (
                <div className="w-full mb-6">
                  <p className="text-xs text-gray-500 mb-1">APN</p>
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm text-gray-900">{state.orderData.esimDetails.apn}</span>
                    <button
                      onClick={() => copyToClipboard(state.orderData.esimDetails.apn, 'apn')}
                      className="text-gray-600 hover:text-gray-800 ml-2"
                    >
                      {state.copiedAPN ? <Check size={18} /> : <Copy size={18} />}
                      <span className="sr-only">Copy</span>
                    </button>
                  </div>
                </div>
              )}

              <h3 className="text-base font-medium text-center mb-2">Use these codes to add eSIM</h3>
              <p className="text-xs text-gray-500 text-center mb-4">
                Copy these codes when manually adding eSIM
              </p>
              <button
                onClick={handleSeeInstructions}
                className="bg-[#F15A25] text-white px-6 py-2 rounded-full text-sm font-medium"
              >
                See Instructions
              </button>
            </div>
          )}

          {/* Installation Information */}
          <div className="mt-12 pt-6 border-t border-gray-100 max-w-md mx-auto">
            <h2 className="text-base text-gray-500 font-normal text-center mb-2">What you need to know</h2>
            <h3 className="text-xl font-medium mb-6 text-center">Before installation</h3>

            <div className="border-t border-gray-100 my-4"></div>

            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-[#f05b24] mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#f05b24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15 9L9 15" stroke="#f05b24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 9L15 15" stroke="#f05b24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h4 className="text-base font-medium mb-1 text-center">Don't interrupt installation</h4>
              <p className="text-sm text-gray-500 text-center">
                Ensure stable internet connection for activation
              </p>
            </div>

            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-[#f05b24] mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#f05b24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" stroke="#f05b24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h4 className="text-base font-medium mb-1 text-center">Activate data roaming</h4>
              <p className="text-sm text-gray-500 text-center">
                to start using the internet
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-[#f05b24] mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#f05b24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15 9L9 15" stroke="#f05b24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 9L15 15" stroke="#f05b24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h4 className="text-base font-medium mb-1 text-center">Don't delete the eSIM</h4>
              <p className="text-sm text-gray-500 text-center">
                You can only scan the code once
              </p>
            </div>
          </div>
        </div>
      )}

      <SetupProcess />

      {/* Render the ESIMPopup */}
      {state.orderData?.esimDetails?.qrCodeUrl && (
        <ESIMPopup
          isOpen={state.isPopupOpen}
          onClose={() => setState(prev => ({ ...prev, isPopupOpen: false }))}
          qrCodeSrc={state.orderData.esimDetails.qrCodeUrl}
          platform={state.activeTab === 'manual' ? 'manual' : state.activeTab === 'qr' ? 'ios' : 'android'} // Adjust platform logic
          title="How to install eSIM"
          smdpAddress={memoizedOrderDetails.smdpAddress}
          activationCode={memoizedOrderDetails.activationCode}
          iccid={state.orderData.esimDetails.iccid || 'N/A'}
          pin={state.orderData.esimDetails.pin || 'N/A'}
          puk={state.orderData.esimDetails.puk || 'N/A'}
          apn={state.orderData.esimDetails.apn || 'N/A'}
        />
      )}
    </div>
  );
};

ConfirmationContent.propTypes = {};

export default memo(ConfirmationContent);