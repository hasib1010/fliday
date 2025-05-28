'use client';

import { useState, useEffect } from 'react';

export default function PrivacyPolicy() {
  const [lastUpdated] = useState('May 24, 2025');
  
  return (
    <div className="min-h-screen   mt-20">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy for Fliday</h1>
          <p className="text-gray-600 mb-8">Effective Date: {lastUpdated}</p>

          <div className="text-gray-700 space-y-8">
            <p>
              Fliday ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website (<strong>fliday.com</strong>) or use our services.
            </p>

            {/* 1. Information We Collect */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-800">Personal Data:</h3>
                  <p>Name, email address, billing information, and any other information you provide during checkout or account creation.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Usage Data:</h3>
                  <p>IP address, browser type, pages visited, and other analytics data.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">eSIM Data:</h3>
                  <p>Device compatibility, order information, and activation details.</p>
                </div>
              </div>
            </section>

            {/* 2. How We Use Your Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Process transactions and deliver eSIM services</li>
                <li>Communicate with you regarding orders or customer support</li>
                <li>Improve our website and services</li>
                <li>Send marketing emails (you can opt-out anytime)</li>
              </ul>
            </section>

            {/* 3. Sharing Your Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Sharing Your Information</h2>
              <p className="mb-3">We do not sell your information. We may share it with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Payment processors (e.g., Stripe, PayPal)</li>
                <li>eSIM suppliers (to fulfill your order)</li>
                <li>Service providers (hosting, analytics)</li>
              </ul>
            </section>

            {/* 4. Data Security */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <p>We use industry-standard security measures (SSL encryption, secure servers) to protect your data.</p>
            </section>

            {/* 5. Your Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Your Rights</h2>
              <p>
                You can request to access, correct, or delete your personal information by contacting us at{' '}
                <a href="mailto:support@fliday.com" className="text-[#F15A25] hover:underline">
                  support@fliday.com
                </a>.
              </p>
            </section>

            {/* 6. Cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookies</h2>
              <p>We use cookies to improve user experience and analyze traffic. You can disable cookies in your browser settings.</p>
            </section>

            {/* 7. Changes to This Policy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Changes to This Policy</h2>
              <p>We may update this policy from time to time. Any changes will be posted on this page with a new effective date.</p>
            </section>

            {/* 8. Contact Us */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, contact us at:{' '}
                <a href="mailto:support@fliday.com" className="text-[#F15A25] hover:underline">
                  support@fliday.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}