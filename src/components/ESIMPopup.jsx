import React, { useState } from 'react';

const ESIMPopup = ({
  isOpen = false,
  onClose,
  qrCodeSrc = 'https://via.placeholder.com/200',
  platform = 'ios',
  title = 'How to install eSIM',
  smdpAddress = 'N/A',
  activationCode = 'N/A',
  iccid = 'N/A',
  pin = 'N/A',
  puk = 'N/A',
  apn = 'N/A'
}) => {
  const [activeTab, setActiveTab] = useState(platform);

  // Platform-specific instructions
  const instructions = {
    ios: [
      { step: 'Go to ⚙️ Settings', icon: '⚙️' },
      { step: 'Select "Cellular/Mobile Data"', icon: '📱' },
      { step: 'Choose "Add Cellular Plan"', icon: '➕' },
      { step: 'Scan the QR code below', icon: '📷' }
    ],
    android: [
      { step: 'Go to ⚙️ Settings', icon: '⚙️' },
      { step: 'Select "Connections"', icon: '🔗' },
      { step: 'Tap "SIM Card Manager"', icon: '📇' },
      { step: 'Choose "Add Mobile Plan"', icon: '➕' },
      { step: 'Scan the QR code below', icon: '📷' }
    ],
    manual: [
      { step: 'Go to ⚙️ Settings on your device', icon: '⚙️' },
      { step: 'Navigate to "Cellular" or "Mobile Network" settings', icon: '📱' },
      { step: 'Select "Add Cellular Plan" or "Add Mobile Plan"', icon: '➕' },
      { step: 'Choose "Use Manual Entry"', icon: '✍️' },
      { step: 'Enter SM-DP+ Address and Activation Code', icon: '🔑' },
      { step: 'Save and activate the eSIM', icon: '✅' }
    ]
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900/50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="relative p-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-3 text-center font-medium text-sm ${
              activeTab === 'ios' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'
            } transition-colors duration-200`}
          >
            iOS
          </button>
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-3 text-center font-medium text-sm ${
              activeTab === 'android' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'
            } transition-colors duration-200`}
          >
            Android
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-3 text-center font-medium text-sm ${
              activeTab === 'manual' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'
            } transition-colors duration-200`}
          >
            Manual
          </button>
        </div>

        {/* Instructions */}
        <div className="p-6">
          <div className="space-y-4">
            {instructions[activeTab].map((item, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-200 text-gray-800 rounded-full flex items-center justify-center font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 text-base flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>
                    {item.step}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Manual Installation Data (visible only for 'manual' tab) */}
          {activeTab === 'manual' && (
            <div className="mt-6 space-y-3 h-[200px] overflow-y-auto">
              <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                <span className="text-sm font-medium text-gray-700">SM-DP+ Address:</span>
                <span className="text-sm font-semibold text-gray-900">{smdpAddress}</span>
              </div>
              <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                <span className="text-sm font-medium text-gray-700">Activation Code:</span>
                <span className="text-sm font-semibold text-gray-900">{activationCode}</span>
              </div>
              <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                <span className="text-sm font-medium text-gray-700">ICCID:</span>
                <span className="text-sm font-semibold text-gray-900">{iccid}</span>
              </div>
              {pin && (
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                  <span className="text-sm font-medium text-gray-700">PIN:</span>
                  <span className="text-sm font-semibold text-gray-900">{pin}</span>
                </div>
              )}
              {puk && (
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                  <span className="text-sm font-medium text-gray-700">PUK:</span>
                  <span className="text-sm font-semibold text-gray-900">{puk}</span>
                </div>
              )}
              {apn && (
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                  <span className="text-sm font-medium text-gray-700">APN:</span>
                  <span className="text-sm font-semibold text-gray-900">{apn}</span>
                </div>
              )}
            </div>
          )}

          {/* QR Code Section */}
          {(activeTab === 'ios' || activeTab === 'android') && (
            <div className="mt-6 text-center">
              <img
                src={qrCodeSrc}
                alt="eSIM QR Code"
                className="mx-auto w-40 h-40 rounded-lg border border-gray-300"
              />
              <p className="mt-2 text-sm font-medium text-gray-700">
                Scan this QR code to install your eSIM
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ESIMPopup;