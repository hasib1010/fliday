'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function PrivacyPolicy() {
  const [lastUpdated] = useState('May 19, 2025');
  
  // Scroll to section when URL hash changes
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const element = document.getElementById(hash.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
     
      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: {lastUpdated}</p>

          {/* Table of Contents */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Contents</h2>
            <ul className="space-y-2">
              <li>
                <a href="#introduction" className="text-[#F15A25] hover:underline">1. Introduction</a>
              </li>
              <li>
                <a href="#information-collection" className="text-[#F15A25] hover:underline">2. Information We Collect</a>
              </li>
              <li>
                <a href="#information-use" className="text-[#F15A25] hover:underline">3. How We Use Your Information</a>
              </li>
              <li>
                <a href="#information-sharing" className="text-[#F15A25] hover:underline">4. How We Share Your Information</a>
              </li>
              <li>
                <a href="#security" className="text-[#F15A25] hover:underline">5. Data Security</a>
              </li>
              <li>
                <a href="#rights" className="text-[#F15A25] hover:underline">6. Your Rights</a>
              </li>
              <li>
                <a href="#international" className="text-[#F15A25] hover:underline">7. International Data Transfers</a>
              </li>
              <li>
                <a href="#retention" className="text-[#F15A25] hover:underline">8. Data Retention</a>
              </li>
              <li>
                <a href="#changes" className="text-[#F15A25] hover:underline">9. Changes to This Privacy Policy</a>
              </li>
              <li>
                <a href="#contact" className="text-[#F15A25] hover:underline">10. Contact Us</a>
              </li>
            </ul>
          </div>

          {/* Introduction */}
          <section id="introduction" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                Welcome to Fliday eSIM ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our website and while using our eSIM services.
              </p>
              <p>
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our eSIM mobile data services. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site or use our services.
              </p>
              <p>
                We reserve the right to make changes to this Privacy Policy at any time and for any reason. We will alert you about any changes by updating the "Last updated" date of this Privacy Policy. You are encouraged to periodically review this Privacy Policy to stay informed of updates.
              </p>
            </div>
          </section>

          {/* Information We Collect */}
          <section id="information-collection" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            <div className="text-gray-700 space-y-4">
              <h3 className="text-xl font-medium text-gray-800 mt-6 mb-2">Personal Information</h3>
              <p>
                We may collect personal information that you voluntarily provide to us when you register for an account, express an interest in obtaining information about us or our products and services, participate in activities on the website, or otherwise contact us.
              </p>
              <p>
                The personal information we collect may include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Name and contact information (email address, phone number)</li>
                <li>Billing and payment information</li>
                <li>Account credentials</li>
                <li>Device information (IMEI number, eSIM compatibility)</li>
                <li>Usage data and travel destinations</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mt-6 mb-2">Automatically Collected Information</h3>
              <p>
                When you access our website or use our services, we may automatically collect certain information, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Device information (browser type, operating system, device type)</li>
                <li>IP address and location information</li>
                <li>Usage patterns and preferences</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section id="information-use" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                We may use the information we collect for various purposes, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Providing, maintaining, and improving our services</li>
                <li>Processing transactions and sending related information</li>
                <li>Managing your account and providing customer support</li>
                <li>Sending administrative information, updates, and promotional communications</li>
                <li>Personalizing your experience and delivering content relevant to your interests</li>
                <li>Monitoring and analyzing usage and trends to improve our website and services</li>
                <li>Detecting, preventing, and addressing technical issues or fraudulent activities</li>
                <li>Complying with legal obligations</li>
              </ul>
            </div>
          </section>

          {/* How We Share Your Information */}
          <section id="information-sharing" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. How We Share Your Information</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                We may share your information in the following situations:
              </p>
              <ul className="list-disc pl-6 space-y-4">
                <li>
                  <strong className="text-gray-800">With Service Providers:</strong> We may share your information with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf, such as mobile network operators that provide the actual eSIM connectivity.
                </li>
                <li>
                  <strong className="text-gray-800">Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.
                </li>
                <li>
                  <strong className="text-gray-800">With Your Consent:</strong> We may disclose your personal information for any other purpose with your consent.
                </li>
                <li>
                  <strong className="text-gray-800">Legal Requirements:</strong> We may disclose your information where we are legally required to do so in order to comply with applicable law, governmental requests, judicial proceedings, court orders, or legal processes.
                </li>
              </ul>
            </div>
          </section>

          {/* Data Security */}
          <section id="security" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
              </p>
              <p>
                We are committed to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Using encryption for data transmission and storage where appropriate</li>
                <li>Regularly reviewing and updating our security practices</li>
                <li>Restricting access to personal information to authorized personnel only</li>
                <li>Conducting periodic risk assessments and security audits</li>
              </ul>
            </div>
          </section>

          {/* Your Rights */}
          <section id="rights" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                Depending on your location, you may have certain rights regarding your personal information, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>The right to access the personal information we have about you</li>
                <li>The right to request that we correct or update any personal information we have about you</li>
                <li>The right to request that we delete any personal information we have about you</li>
                <li>The right to object to the processing of your personal information</li>
                <li>The right to request restriction of processing of your personal information</li>
                <li>The right to data portability</li>
                <li>The right to withdraw consent</li>
              </ul>
              <p className="mt-4">
                If you wish to exercise any of these rights, please contact us using the contact information provided below.
              </p>
            </div>
          </section>

          {/* International Data Transfers */}
          <section id="international" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. International Data Transfers</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                Our services are global by nature and your information may be transferred to, stored, and processed in countries where our servers, service providers, or partners are located or operate. By using our services or providing us with any information, you consent to the transfer to, and processing, usage, sharing, and storage of your information in countries where:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>The privacy laws may not be as comprehensive as those in your country</li>
                <li>The data protection laws may differ from those in your jurisdiction</li>
              </ul>
              <p className="mt-4">
                We take appropriate safeguards to ensure that your personal information remains protected in accordance with this Privacy Policy.
              </p>
            </div>
          </section>

          {/* Data Retention */}
          <section id="retention" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our policies.
              </p>
              <p>
                When we no longer need to process your personal information for the purposes set out in this Privacy Policy, we will delete or anonymize your information from our systems.
              </p>
            </div>
          </section>

          {/* Changes to This Privacy Policy */}
          <section id="changes" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to This Privacy Policy</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                We may update this Privacy Policy from time to time. The updated version will be indicated by an updated "Last updated" date and the updated version will be effective as soon as it is accessible.
              </p>
              <p>
                If we make material changes to this Privacy Policy, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Policy frequently to be informed of how we are protecting your information.
              </p>
            </div>
          </section>

          {/* Contact Us */}
          <section id="contact" className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Us</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                If you have questions or comments about this Privacy Policy, you may email us at:
              </p>
              <p className="font-medium text-[#F15A25]">
                privacy@fliday.com
              </p>
              <p className="mt-4">
                Or write to us at:
              </p>
              <div className="mt-2">
                <p>Fliday eSIM</p>
                <p>123 Global Street</p>
                <p>Dhaka, Bangladesh</p>
              </div>
            </div>
          </section>
        </div>

        {/* Back to Top Button */}
        <div className="text-center mt-8">
          <a 
            href="#" 
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#F15A25] hover:bg-[#E04E1A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A25]"
          >
            Back to Top
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Fliday eSIM</h3>
              <p className="text-gray-400">
                Global connectivity made simple with digital eSIM technology.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
                <li><Link href="/careers" className="text-gray-400 hover:text-white">Careers</Link></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-white">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/cookies" className="text-gray-400 hover:text-white">Cookie Policy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/faq" className="text-gray-400 hover:text-white">FAQ</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white">Contact Us</Link></li>
                <li><Link href="/help" className="text-gray-400 hover:text-white">Help Center</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© {new Date().getFullYear()} Fliday eSIM. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}