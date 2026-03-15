'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Check, Loader2, RefreshCw, Mail, Copy, CheckCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import SetupProcess from '@/components/Home/SetupProcess';
import ESIMPopup from '@/components/ESIMPopup';

// ── Skeleton ──────────────────────────────────────────────────────────────────
const LoadingSkeleton = ({ phase }) => (
  <div className="max-w-3xl mx-auto px-4 py-16 flex flex-col justify-center items-center text-center">
    <Loader2 className="w-10 h-10 text-[#F15A25] animate-spin mb-4" />
    <p className="text-gray-600 font-medium">
      {phase === 'pending_payment' && 'Waiting for payment confirmation…'}
      {phase === 'processing' && 'Payment confirmed — provisioning your eSIM…'}
      {phase === 'verifying' && 'Verifying your order…'}
      {phase === 'generating' && 'Generating your eSIM profile…'}
      {phase === 'initializing' && 'Loading your order…'}
      {!['pending_payment', 'processing', 'verifying', 'generating', 'initializing'].includes(phase) && 'Loading…'}
    </p>
    <p className="text-sm text-gray-400 mt-2">This may take up to 30 seconds. Please don't close this page.</p>
    <div className="mt-6 w-64 h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full bg-[#F15A25] rounded-full animate-pulse" style={{ width: '60%' }} />
    </div>
  </div>
);

// ── Error display ─────────────────────────────────────────────────────────────
const ErrorDisplay = memo(({ error, onRetry }) => (
  <div className="max-w-3xl mx-auto px-4 py-12">
    <div className="bg-red-50 p-6 rounded-lg border border-red-100 max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-red-700 mb-2">Something went wrong</h2>
      <p className="text-red-600 mb-4">{error}</p>
      <div className="flex gap-4">
        <button onClick={onRetry} className="bg-[#F15A25] hover:bg-[#E04E1A] text-white px-4 py-2 rounded transition-colors flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
        <a href="mailto:support@fliday.com" className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded transition-colors">
          Contact Support
        </a>
      </div>
    </div>
  </div>
));
ErrorDisplay.propTypes = { error: PropTypes.string.isRequired, onRetry: PropTypes.func.isRequired };

// ── Main component ────────────────────────────────────────────────────────────
const ConfirmationContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();
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
    isPopupOpen: false,
  });

  const MAX_RETRIES = 20;   // 20 × 3 s = 60 s total wait
  const RETRY_DELAY = 3000;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const formatPrice = useCallback((price) => {
    if (!price) return '0.00';
    return (price / 10000).toFixed(2);
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try { return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return 'N/A'; }
  }, []);

  const formatDataSize = useCallback((bytes) => {
    if (!bytes) return 'N/A';
    const gb = bytes / (1024 ** 3);
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 ** 2)).toFixed(1)} MB`;
  }, []);

  const parseActivationCode = useCallback((ac) => {
    if (!ac || typeof ac !== 'string') return { smdpAddress: 'N/A', activationCode: 'N/A' };
    const parts = ac.split('$');
    if (parts.length !== 3 || !parts[1] || !parts[2]) return { smdpAddress: 'N/A', activationCode: ac };
    return { smdpAddress: parts[1], activationCode: parts[2] };
  }, []);

  // ── Fetch / poll ─────────────────────────────────────────────────────────────
  const fetchOrderData = useCallback(async () => {
    if (!orderId) {
      setState(prev => ({ ...prev, error: 'No order ID provided', loading: false, loadingPhase: 'error' }));
      return;
    }
    if (authStatus !== 'authenticated') {
      setState(prev => ({ ...prev, error: 'Please log in to view order details', loading: false, loadingPhase: 'error' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, loadingPhase: prev.retryCount === 0 ? 'verifying' : 'generating' }));

      // 1 — Fetch order from our DB
      const orderRes = await fetch(`/api/orders?orderId=${orderId}`);
      if (!orderRes.ok) throw new Error((await orderRes.json()).error || 'Failed to fetch order');
      const { success, order } = await orderRes.json();
      if (!success || !order) throw new Error('Order not found');

      // 2 — Order is still waiting for payment (webhook hasn't fired yet)
      if (order.orderStatus === 'pending_payment') {
        setState(prev => ({ ...prev, loading: true, loadingPhase: 'pending_payment' }));
        scheduleRetry();
        return;
      }

      // 3 — Payment confirmed, eSIM is being provisioned
      if (order.orderStatus === 'processing') {
        setState(prev => ({ ...prev, loading: true, loadingPhase: 'processing' }));
        scheduleRetry();
        return;
      }

      // 4 — Hard failure 
      if (order.orderStatus === 'failed') {
        // If payment was completed but eSIM provisioning failed,
        // show a specific message (customer was charged)
        const wasPaid = order.paymentStatus === 'completed' || order.paymentStatus === 'refunded';
        let errorMessage = order.failureReason || 'Order processing failed. Please contact support.';

        if (wasPaid && order.paymentStatus === 'refunded') {
          errorMessage = 'Your payment has been refunded. ' + errorMessage;
        } else if (wasPaid) {
          errorMessage = errorMessage + ' Your payment was received — please contact support and we will resolve this immediately.';
        }

        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false,
          loadingPhase: 'error',
        }));
        return;
      }


      // 5 — Completed with QR code — we're done!
      if (order.esimDetails?.qrCodeUrl && order.esimDetails?.iccid) {
        setState(prev => ({ ...prev, orderData: order, loading: false, loadingPhase: 'completed', error: null }));
        return;
      }

      // 6 — Completed but no QR yet — try querying provider (orderNo must exist)
      if (order.esimDetails?.orderNo) {
        const queryRes = await fetch('/api/esim/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, orderNo: order.esimDetails.orderNo }),
        });

        if (queryRes.ok) {
          const queryData = await queryRes.json();
          if (queryData.success && queryData.esimDetails) {
            // Re-fetch updated order
            const updated = await fetch(`/api/orders?orderId=${orderId}`);
            if (updated.ok) {
              const { order: updatedOrder } = await updated.json();
              if (updatedOrder?.esimDetails?.qrCodeUrl) {
                setState(prev => ({ ...prev, orderData: updatedOrder, loading: false, loadingPhase: 'completed', error: null }));
                return;
              }
            }
          }
        }
      }

      // 7 — Still no QR — keep retrying
      scheduleRetry();

    } catch (err) {
      console.error('Fetch error:', err);
      setState(prev => ({ ...prev, error: err.message || 'Failed to load order data', loading: false, loadingPhase: 'error' }));
    }
  }, [orderId, authStatus, state.retryCount]);

  const scheduleRetry = useCallback(() => {
    setState(prev => {
      if (prev.retryCount >= MAX_RETRIES) {
        return {
          ...prev,
          error: 'eSIM provisioning is taking longer than expected. Please check your email or contact support.',
          loading: false,
          loadingPhase: 'error',
        };
      }
      return { ...prev, retryCount: prev.retryCount + 1 };
    });
  }, []);

  useEffect(() => {
    if (authStatus === 'authenticated' && orderId) fetchOrderData();
  }, [authStatus, orderId]);

  useEffect(() => {
    if (state.retryCount > 0 && state.retryCount <= MAX_RETRIES && orderId) {
      const timer = setTimeout(fetchOrderData, RETRY_DELAY);
      return () => clearTimeout(timer);
    }
  }, [state.retryCount]);

  // ── Auto-send email ──────────────────────────────────────────────────────────
  const sendPurchaseEmail = useCallback(async () => {
    if (!state.orderData?.orderId || !session?.user?.email) return;
    try {
      setState(prev => ({ ...prev, emailSending: true }));
      const res = await fetch('/api/email/resend-esim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: state.orderData.orderId, email: session.user.email }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to send email');
      setState(prev => ({ ...prev, emailSent: true }));
      setTimeout(() => setState(prev => ({ ...prev, emailSent: false })), 5000);
    } catch (err) {
      console.error('Email error:', err);
    } finally {
      setState(prev => ({ ...prev, emailSending: false }));
    }
  }, [state.orderData, session?.user?.email]);

  useEffect(() => {
    if (state.orderData?.esimDetails?.qrCodeUrl && session?.user?.email && !state.autoEmailSent && !state.emailSending && state.loadingPhase === 'completed') {
      setState(prev => ({ ...prev, autoEmailSent: true }));
      const t = setTimeout(sendPurchaseEmail, 1000);
      return () => clearTimeout(t);
    }
  }, [state.orderData, state.autoEmailSent, state.emailSending, state.loadingPhase, session?.user?.email]);

  // ── Copy to clipboard ────────────────────────────────────────────────────────
  const copyToClipboard = useCallback((text, type) => {
    if (!text || text === 'N/A') return;
    const el = document.createElement('input');
    el.value = text; el.style.position = 'fixed'; el.style.opacity = '0';
    document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
    const key = `copied${type.toUpperCase()}`;
    setState(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setState(prev => ({ ...prev, [key]: false })), 2000);
  }, []);

  // ── Memoized details ─────────────────────────────────────────────────────────
  const details = useMemo(() => {
    const { smdpAddress, activationCode } = parseActivationCode(state.orderData?.esimDetails?.ac);
    return {
      formattedPrice: formatPrice(state.orderData?.finalPrice),
      formattedDate: formatDate(state.orderData?.createdAt),
      formattedExpiry: formatDate(state.orderData?.esimDetails?.expiredTime),
      dataSize: state.orderData?.dataAmount || formatDataSize(state.orderData?.esimDetails?.totalVolume),
      packageName: state.orderData?.packageName || 'N/A',
      location: state.orderData?.location || 'N/A',
      smdpAddress,
      activationCode,
    };
  }, [state.orderData, formatPrice, formatDate, formatDataSize, parseActivationCode]);

  // ── Render ───────────────────────────────────────────────────────────────────
  if (state.loading || authStatus === 'loading') return <LoadingSkeleton phase={state.loadingPhase} />;
  if (state.error) return <ErrorDisplay error={state.error} onRetry={() => { setState(prev => ({ ...prev, retryCount: 0, error: null, loading: true })); fetchOrderData(); }} />;
  if (!state.orderData) return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-100 max-w-md mx-auto">
        <h2 className="text-xl font-semibold text-yellow-700 mb-2">Order Not Found</h2>
        <p className="text-yellow-600 mb-4">We couldn't find this order.</p>
        <Link href="/destinations" className="bg-[#F15A25] hover:bg-[#E04E1A] text-white px-4 py-2 rounded transition-colors inline-block">Back to Destinations</Link>
      </div>
    </div>
  );

  const { orderData: order } = state;

  return (
    <div className="max-w-[1220px] mx-auto px-4 my-20">
      {/* Success header */}
      <div className="bg-white p-8 rounded-lg shadow-sm mb-8 text-center">
        <div className="bg-[#F15A25] h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="h-12 w-12 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-gray-800">Thank you for your purchase!</h1>
        <p className="text-gray-600 mb-4">Your eSIM is ready. See the details below to get started.</p>
        <p className="text-gray-600 mb-2">Order details have been sent to your email address.</p>
        <small className="text-gray-400">If you don't see the email, check your spam folder or resend below.</small>
        <div className="mt-6 flex justify-center">
          <button
            onClick={sendPurchaseEmail}
            disabled={state.emailSending || state.emailSent}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${state.emailSent ? 'bg-green-100 text-green-700' :
              state.emailSending ? 'bg-gray-100 text-gray-500' :
                'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
          >
            {state.emailSent ? <><CheckCircle size={16} /> Email Sent</> :
              state.emailSending ? <><Loader2 size={16} className="animate-spin" /> Sending…</> :
                <><Mail size={16} /> Email My Purchase Details</>}
          </button>
        </div>
      </div>

      {/* QR + manual install */}
      {order.esimDetails?.qrCodeUrl && (
        <div className="bg-white p-8 rounded-lg shadow-sm mb-8">
          {/* Tab switcher */}
          <div className="flex mb-6 max-w-md mx-auto">
            {['qr', 'manual'].map(tab => (
              <button key={tab}
                className={`flex-1 p-3 text-center text-sm font-medium transition-colors ${tab === 'qr' ? 'rounded-l-lg' : 'rounded-r-lg'} ${state.activeTab === tab ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                onClick={() => setState(prev => ({ ...prev, activeTab: tab }))}
              >
                {tab === 'qr' ? 'QR code install' : 'Manual install'}
              </button>
            ))}
          </div>

          {state.activeTab === 'qr' && (
            <div className="flex flex-col items-center max-w-md mx-auto">
              <img src={order.esimDetails.qrCodeUrl} alt="eSIM QR Code" className="w-48 h-48 mb-4" loading="lazy" />
              <h3 className="text-lg font-medium text-center mb-1">Scan this QR code with your device</h3>
              <p className="text-sm text-gray-600 text-center mb-4">Open your phone settings and scan to install</p>
              <button onClick={() => setState(prev => ({ ...prev, isPopupOpen: true }))} className="bg-[#F15A25] text-white px-6 py-2 rounded-full text-sm font-medium">
                See Instructions
              </button>
            </div>
          )}

          {state.activeTab === 'manual' && (
            <div className="flex flex-col items-center max-w-md mx-auto">
              {[
                { label: 'SM-DP+ Address', value: details.smdpAddress, key: 'smdp' },
                { label: 'Activation Code', value: details.activationCode, key: 'activation' },
                { label: 'ICCID', value: order.esimDetails.iccid || 'N/A', key: 'iccid' },
                ...(order.esimDetails.pin ? [{ label: 'PIN', value: order.esimDetails.pin, key: 'pin' }] : []),
                ...(order.esimDetails.puk ? [{ label: 'PUK', value: order.esimDetails.puk, key: 'puk' }] : []),
                ...(order.esimDetails.apn ? [{ label: 'APN', value: order.esimDetails.apn, key: 'apn' }] : []),
              ].map(({ label, value, key }) => (
                <div key={key} className="w-full mb-4">
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm text-gray-900 break-all">{value}</span>
                    <button onClick={() => copyToClipboard(value, key)} className="text-gray-600 hover:text-gray-800 ml-2 flex-shrink-0">
                      {state[`copied${key.toUpperCase()}`] ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={() => setState(prev => ({ ...prev, isPopupOpen: true }))} className="bg-[#F15A25] text-white px-6 py-2 rounded-full text-sm font-medium mt-2">
                See Instructions
              </button>
            </div>
          )}

          {/* Before installation tips */}
          <div className="mt-12 pt-6 border-t border-gray-100 max-w-md mx-auto">
            <h3 className="text-xl font-medium mb-6 text-center">Before installation</h3>
            {[
              { icon: '✗', title: "Don't interrupt installation", desc: 'Ensure stable internet connection for activation' },
              { icon: '✓', title: 'Activate data roaming', desc: 'To start using the internet' },
              { icon: '✗', title: "Don't delete the eSIM", desc: 'You can only scan the code once' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center mb-8">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 border-2 ${icon === '✓' ? 'border-[#f05b24] text-[#f05b24]' : 'border-[#f05b24] text-[#f05b24]'}`}>
                  <span className="text-lg font-bold">{icon}</span>
                </div>
                <h4 className="text-base font-medium mb-1 text-center">{title}</h4>
                <p className="text-sm text-gray-500 text-center">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <SetupProcess />

      {order.esimDetails?.qrCodeUrl && (
        <ESIMPopup
          isOpen={state.isPopupOpen}
          onClose={() => setState(prev => ({ ...prev, isPopupOpen: false }))}
          qrCodeSrc={order.esimDetails.qrCodeUrl}
          platform={state.activeTab === 'manual' ? 'manual' : 'ios'}
          title="How to install eSIM"
          smdpAddress={details.smdpAddress}
          activationCode={details.activationCode}
          iccid={order.esimDetails.iccid || 'N/A'}
          pin={order.esimDetails.pin || 'N/A'}
          puk={order.esimDetails.puk || 'N/A'}
          apn={order.esimDetails.apn || 'N/A'}
        />
      )}
    </div>
  );
};

export default memo(ConfirmationContent);