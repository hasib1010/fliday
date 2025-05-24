'use client';

import { useState } from 'react';

export default function TermsOfService() {
  const [lastUpdated] = useState('May 24, 2025');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service for Fliday</h1>
          <p className="text-gray-600 mb-8">Effective Date: {lastUpdated}</p>

          <div className="text-gray-700 space-y-8">
            <p>
              Welcome to Fliday! By accessing or using our website and services, you agree to the following terms:
            </p>

            {/* 1. Use of Services */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Use of Services</h2>
              <p>
                You agree to use our services only for lawful purposes. You must be 18 years or older to purchase an eSIM.
              </p>
            </section>

            {/* 2. Account Responsibilities */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Account Responsibilities</h2>
              <p>
                If you create an account, you're responsible for keeping your login credentials secure.
              </p>
            </section>

            {/* 3. Purchases and Payments */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Purchases and Payments</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>All purchases are final.</li>
                <li>You are responsible for reviewing eSIM compatibility before purchase.</li>
                <li>Refunds are only issued if the eSIM cannot be activated due to technical issues verified by our team.</li>
              </ul>
            </section>

            {/* 4. Intellectual Property */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Intellectual Property</h2>
              <p>
                All content on fliday.com (logos, text, graphics) is our property and may not be used without permission.
              </p>
            </section>

            {/* 5. Service Availability */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Service Availability</h2>
              <p>
                We strive for 24/7 availability, but we cannot guarantee uninterrupted access due to maintenance or third-party service disruptions.
              </p>
            </section>

            {/* 6. Termination */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Termination</h2>
              <p>
                We reserve the right to terminate accounts or access if you violate these terms.
              </p>
            </section>

            {/* 7. Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
              <p>
                Fliday is not liable for indirect, incidental, or consequential damages resulting from the use or inability to use our services.
              </p>
            </section>

            {/* 8. Governing Law */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Governing Law</h2>
              <p>
                These terms are governed by the laws of the State of Wyoming, USA.
              </p>
            </section>

            {/* 9. Contact Us */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contact Us</h2>
              <p>
                Questions? Contact us at:{' '}
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