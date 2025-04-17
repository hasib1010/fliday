'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  Loader2, Download, Copy, Check, ChevronRight, 
  HelpCircle, Smartphone, ArrowLeft 
} from 'lucide-react';

export default function ESIMInstallPage() {
  const { orderId } = useParams();
  const { data: session, status } = useSession();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedICCID, setCopiedICCID] = useState(false);
  const [copiedAC, setCopiedAC] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && orderId) {
      fetchOrderData();
    } else if (status === 'unauthenticated') {
      window.location.href = '/api/auth/signin';
    }
  }, [status, orderId]);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/orders?orderId=${orderId}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.order) {
        // Check if the order has eSIM details
        if (!data.order.esimDetails || !data.order.esimDetails.qrCodeUrl) {
          throw new Error('This order does not have eSIM details yet');
        }
        
        setOrderData(data.order);
      } else {
        throw new Error(data.error || 'Failed to fetch order details');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching order details');
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(
      () => {
        if (type === 'iccid') {
          setCopiedICCID(true);
          setTimeout(() => setCopiedICCID(false), 2000);
        } else if (type === 'ac') {
          setCopiedAC(true);
          setTimeout(() => setCopiedAC(false), 2000);
        }
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
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

  // Format data size (bytes to GB)
  const formatDataSize = (bytes) => {
    if (!bytes) return 'N/A';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#F15A25] animate-spin" />
        <span className="ml-2">Loading eSIM details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
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
                <div className="-mx-2 -my-1.5 flex">
                  <button
                    type="button"
                    onClick={fetchOrderData}
                    className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Try Again
                  </button>
                  <Link
                    href="/orders"
                    className="ml-3 bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Back to Orders
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Order Not Found</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>We couldn't find the order you're looking for.</p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <Link
                    href="/orders"
                    className="bg-yellow-50 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    Back to Orders
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center mb-6">
        <Link href="/orders" className="text-gray-500 hover:text-gray-700 flex items-center">
          <ArrowLeft size={16} className="mr-1" />
          Back to Orders
        </Link>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div className="bg-[#F15A25] px-6 py-4">
          <h1 className="text-xl font-bold text-white">eSIM Installation Guide</h1>
          <p className="text-white text-opacity-90">
            {orderData.location} - {orderData.packageName}
          </p>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Scan QR Code</h2>
            <div className="flex flex-col md:flex-row items-start gap-6">
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
                      className="text-sm text-gray-600"
                    >
                      {orderData.esimDetails.shortUrl}
                    </a>
                  )}
                </div>
              </div>
              
              <div className="w-full md:w-1/2">
                <h3 className="font-medium text-gray-900 mb-3">Instructions</h3>
                <ol className="space-y-3 text-sm text-gray-600 list-decimal pl-4">
                  <li className="pl-1">Go to your phone <strong>Settings</strong></li>
                  <li className="pl-1">Navigate to <strong>Mobile Data</strong> or <strong>Cellular</strong></li>
                  <li className="pl-1">Select <strong>Add Data Plan</strong> or <strong>Add eSIM</strong></li>
                  <li className="pl-1">Choose <strong>Scan QR Code</strong> option</li>
                  <li className="pl-1">Point your camera at the QR code shown here</li>
                  <li className="pl-1">Follow the on-screen instructions to complete installation</li>
                  <li className="pl-1">After installation, enable your new eSIM plan</li>
                </ol>
                <div className="mt-4 bg-blue-50 border border-blue-100 rounded-md p-3 text-sm text-blue-800">
                  <p className="font-medium">Note: Make sure your device supports eSIM technology and is unlocked.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Manual Installation</h2>
            <p className="text-sm text-gray-600 mb-4">
              If QR code scanning doesn't work, you can manually enter these details:
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              {orderData.esimDetails.ac && (
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Activation Code (SM-DP+ Address):</span>
                    <button 
                      onClick={() => copyToClipboard(orderData.esimDetails.ac, 'ac')}
                      className="text-[#F15A25] hover:text-[#E04E1A] flex items-center text-sm"
                    >
                      {copiedAC ? <Check size={14} /> : <Copy size={14} />}
                      <span className="ml-1">{copiedAC ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-200 font-mono text-sm break-all">
                    {orderData.esimDetails.ac}
                  </div>
                </div>
              )}
              
              {orderData.esimDetails.iccid && (
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">ICCID:</span>
                    <button 
                      onClick={() => copyToClipboard(orderData.esimDetails.iccid, 'iccid')}
                      className="text-[#F15A25] hover:text-[#E04E1A] flex items-center text-sm"
                    >
                      {copiedICCID ? <Check size={14} /> : <Copy size={14} />}
                      <span className="ml-1">{copiedICCID ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-200 font-mono text-sm">
                    {orderData.esimDetails.iccid}
                  </div>
                </div>
              )}
              
              {orderData.esimDetails.apn && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">APN:</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-gray-200 font-mono text-sm">
                    {orderData.esimDetails.apn}
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-yellow-50 border border-yellow-100 rounded-md p-3 text-sm text-yellow-800">
              <p className="font-medium mb-1">Manual Installation Steps:</p>
              <ol className="list-decimal pl-4">
                <li className="mb-1">Go to your phone Settings {'>'} Mobile Data/Cellular</li>
                <li className="mb-1">Select "Add Data Plan" or "Add eSIM"</li>
                <li className="mb-1">Choose "Enter Details Manually" option</li>
                <li className="mb-1">Enter the Activation Code/SM-DP+ address exactly as shown</li>
                <li className="mb-1">Follow on-screen instructions to complete setup</li>
              </ol>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Technical Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-1">Data Package</p>
                <p className="text-base">{orderData.dataAmount}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-1">Validity</p>
                <p className="text-base">{orderData.duration}</p>
              </div>
              
              {orderData.esimDetails.totalVolume > 0 && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-700 mb-1">Data Allowance</p>
                  <p className="text-base">{formatDataSize(orderData.esimDetails.totalVolume)}</p>
                </div>
              )}
              
              {orderData.esimDetails.expiredTime && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-700 mb-1">Expiry Date</p>
                  <p className="text-base">{formatDate(orderData.esimDetails.expiredTime)}</p>
                </div>
              )}
              
              {orderData.esimDetails.pin && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-700 mb-1">PIN Code</p>
                  <p className="text-base font-mono">{orderData.esimDetails.pin}</p>
                </div>
              )}
              
              {orderData.esimDetails.puk && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-700 mb-1">PUK Code</p>
                  <p className="text-base font-mono">{orderData.esimDetails.puk}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Need Help?</h2>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <Smartphone className="h-5 w-5 text-[#F15A25]" />
              </div>
              <div className="ml-3">
                <h3 className="text-base font-medium text-gray-900">Device Compatibility</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Make sure your device supports eSIM technology. Most recent iPhones, Samsung Galaxy, Google Pixel and other premium devices support eSIM.
                </p>
                <Link
                  href="/support/compatible-devices"
                  className="mt-2 flex items-center text-[#F15A25] gap-1 text-sm font-medium"
                >
                  Check device compatibility
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <HelpCircle className="h-5 w-5 text-[#F15A25]" />
              </div>
              <div className="ml-3">
                <h3 className="text-base font-medium text-gray-900">Installation Guides</h3>
                <p className="mt-1 text-sm text-gray-600">
                  We have detailed step-by-step installation guides for different devices.
                </p>
                <div className="mt-2 space-y-2">
                  <Link
                    href="/support/installation-guide/iphone"
                    className="flex items-center text-[#F15A25] gap-1 text-sm font-medium"
                  >
                    iPhone Guide
                    <ChevronRight size={16} />
                  </Link>
                  <Link
                    href="/support/installation-guide/android"
                    className="flex items-center text-[#F15A25] gap-1 text-sm font-medium"
                  >
                    Android Guide
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-center">
              <Link
                href="/support/contact"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#F15A25] hover:bg-[#E04E1A]"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}