'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TermsOfService() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: {lastUpdated}</p>

          {/* Table of Contents */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Contents</h2>
            <ul className="space-y-2">
              <li>
                <a href="#acceptance" className="text-[#F15A25] hover:underline">1. Acceptance of Terms</a>
              </li>
              <li>
                <a href="#services" className="text-[#F15A25] hover:underline">2. Description of Services</a>
              </li>
              <li>
                <a href="#eligibility" className="text-[#F15A25] hover:underline">3. Eligibility and Account Registration</a>
              </li>
              <li>
                <a href="#usage" className="text-[#F15A25] hover:underline">4. Acceptable Use</a>
              </li>
              <li>
                <a href="#payment" className="text-[#F15A25] hover:underline">5. Payment Terms</a>
              </li>
              <li>
                <a href="#termination" className="text-[#F15A25] hover:underline">6. Termination</a>
              </li>
              <li>
                <a href="#warranties" className="text-[#F15A25] hover:underline">7. Warranties and Disclaimers</a>
              </li>
              <li>
                <a href="#liability" className="text-[#F15A25] hover:underline">8. Limitation of Liability</a>
              </li>
              <li>
                <a href="#indemnification" className="text-[#F15A25] hover:underline">9. Indemnification</a>
              </li>
              <li>
                <a href="#governing-law" className="text-[#F15A25] hover:underline">10. Governing Law</a>
              </li>
              <li>
                <a href="#changes" className="text-[#F15A25] hover:underline">11. Changes to These Terms</a>
              </li>
              <li>
                <a href="#contact" className="text-[#F15A25] hover:underline">12. Contact Us</a>
              </li>
            </ul>
          </div>

          {/* Acceptance of Terms */}
          <section id="acceptance" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                Welcome to Fliday eSIM ("we," "our," or "us"). By accessing or using our website, mobile applications, or eSIM services (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Services.
              </p>
              <p>
                We may update these Terms from time to time. The updated version will be indicated by a revised "Last updated" date, and we will notify you of material changes by posting a notice on our website or sending you a notification.
              </p>
            </div>
          </section>

          {/* Description of Services */}
          <section id="services" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Services</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                Fliday eSIM provides digital eSIM connectivity services, enabling users to access mobile data networks globally. Our Services include purchasing, activating, and managing eSIM plans through our website or mobile applications.
              </p>
              <p>
                We reserve the right to modify, suspend, or discontinue any part of the Services at any time with or without notice.
              </p>
            </div>
          </section>

          {/* Eligibility and Account Registration */}
          <section id="eligibility" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Eligibility and Account Registration</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                To use our Services, you must be at least 18 years old or the age of majority in your jurisdiction. By registering for an account, you represent that you meet these eligibility requirements.
              </p>
              <p>
                You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>
            </div>
          </section>

          {/* Acceptable Use */}
          <section id="usage" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                You agree to use the Services only for lawful purposes and in accordance with these Terms. You shall not:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Services in any way that violates applicable laws or regulations</li>
                <li>Attempt to interfere with, compromise, or disrupt the Services or servers</li>
                <li>Use the Services to transmit malicious code, spam, or other harmful content</li>
                <li>Engage in any activity that restricts or inhibits other users' use of the Services</li>
                <li>Attempt to gain unauthorized access to any portion of the Services</li>
              </ul>
            </div>
          </section>

          {/* Payment Terms */}
          <section id="payment" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Payment Terms</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                Certain Services require payment. All fees are stated in the applicable currency and are non-refundable unless otherwise specified. You agree to pay all charges incurred by your account in accordance with the pricing terms provided at the time of purchase.
              </p>
              <p>
                We may use third-party payment processors to handle transactions. You agree to provide accurate payment information and authorize us to charge your chosen payment method for all fees.
              </p>
            </div>
          </section>

          {/* Termination */}
          <section id="termination" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Termination</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                We may suspend or terminate your access to the Services at our sole discretion, with or without notice, for any reason, including if we believe you have violated these Terms.
              </p>
              <p>
                You may terminate your account at any time by contacting us. Upon termination, your right to use the Services will cease, but these Terms will continue to apply to any prior use.
              </p>
            </div>
          </section>

          {/* Warranties and Disclaimers */}
          <section id="warranties" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Warranties and Disclaimers</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                The Services are provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
              </p>
              <p>
                We do not guarantee that the Services will be uninterrupted, secure, or error-free, or that they will meet your expectations. Network availability may vary based on location and third-party providers.
              </p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section id="liability" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                To the fullest extent permitted by law, Fliday eSIM and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or use, arising from or related to your use of the Services.
              </p>
              <p>
                Our total liability to you for all claims arising from the Services shall not exceed the amount you paid us for the Services in the six months prior to the claim.
              </p>
            </div>
          </section>

          {/* Indemnification */}
          <section id="indemnification" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Indemnification</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                You agree to indemnify, defend, and hold harmless Fliday eSIM, its affiliates, officers, directors, employees, and agents from any claims, liabilities, damages, or expenses (including reasonable attorneys' fees) arising from your use of the Services, violation of these Terms, or infringement of any third-party rights.
              </p>
            </div>
          </section>

          {/* Governing Law */}
          <section id="governing-law" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Governing Law</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                These Terms shall be governed by and construed in accordance with the laws of Bangladesh, without regard to its conflict of law principles. Any disputes arising under these Terms shall be resolved in the courts of Dhaka, Bangladesh.
              </p>
            </div>
          </section>

          {/* Changes to These Terms */}
          <section id="changes" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to These Terms</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                We may update these Terms from time to time. The updated version will be indicated by an updated "Last updated" date, and the updated version will be effective as soon as it is accessible.
              </p>
              <p>
                If we make material changes to these Terms, we may notify you by prominently posting a notice or sending you a notification. Your continued use of the Services after such changes constitutes your acceptance of the revised Terms.
              </p>
            </div>
          </section>

          {/* Contact Us */}
          <section id="contact" className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                If you have questions or comments about these Terms, you may email us at:
              </p>
              <p className="font-medium text-[#F15A25]">
                support@fliday.com
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
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6. Wii 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}