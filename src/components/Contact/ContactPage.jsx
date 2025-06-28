'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Mail, Phone, MessageSquare, Send, MapPin } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Update the handleSubmit function in your existing ContactPage component
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(false);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Success
      setSubmitSuccess(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);

    } catch (error) {
      console.error('Contact form error:', error);
      setSubmitError(true);

      // Reset error message after 5 seconds
      setTimeout(() => {
        setSubmitError(false);
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-24 pb-16">
      {/* Hero Section */}
      <div className="bg-[#FFF8F6] py-2">
        <div className="max-w-[1220px] mx-auto px-4 lg:px-0">
          <div className="text-center">
            <h1 className="text-3xl lg:text-[40px] font-medium mb-4">Contact Us</h1>
            <p className="text-gray-600 max-w-2xl mx-auto lg:text-lg">
              Have questions about our eSIM services? We're here to help! Reach out to our team and we'll get back to you as soon as possible.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1220px] mx-auto px-4 lg:px-0 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Contact Form - 3 columns on large screens */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:p-8">
              <h2 className="text-2xl font-medium mb-6">Send Us a Message</h2>

              {submitSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.3334 4L6.00002 11.3333L2.66669 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p>Thank you for your message! We'll get back to you soon.</p>
                </div>
              )}

              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 5V8M8 11H8.01M15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p>Something went wrong. Please try again later.</p>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-[#F15A25] focus:border-[#F15A25] outline-none transition"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-[#F15A25] focus:border-[#F15A25] outline-none transition"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-[#F15A25] focus:border-[#F15A25] outline-none transition"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Your Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="5"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-[#F15A25] focus:border-[#F15A25] outline-none transition"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#F15A25] text-white font-medium py-3 px-6 rounded-full hover:bg-[#e04e1a] transition-colors flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} className="mr-2" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Contact Info - 2 columns on large screens */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:p-8 mb-6">
              <h2 className="text-2xl font-medium mb-6">Contact Information</h2>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-[#FFF0EC] rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <Mail size={18} className="text-[#F15A25]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Email Us</h3>
                    <p className="text-gray-600 mt-1">support@fliday.com</p>
                  </div>
                </div>



                <div className="flex items-start">
                  <div className="w-10 h-10 bg-[#FFF0EC] rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <MessageSquare size={18} className="text-[#F15A25]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Live Chat</h3>
                    <p className="text-gray-600 mt-1">Available 24/7 on our website</p>
                    <p className="text-gray-600">Average response time: 2 minutes</p>
                  </div>
                </div>


              </div>
            </div>

            <div className="bg-[#FFF8F6] rounded-xl p-6 lg:p-8">
              <h3 className="text-xl font-medium mb-4">Business Hours</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monday - Friday:</span>
                  <span className="font-medium">9:00 AM - 5q:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saturday:</span>
                  <span className="font-medium">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sunday:</span>
                  <span className="font-medium">Closed</span>
                </div>
                <p className="text-gray-600 text-sm mt-4">
                  *All times are in Eastern Standard Time (EST)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-[1220px] mx-auto px-4 lg:px-0 mt-16">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-medium">Frequently Asked Questions</h2>
            <p className="text-gray-600 mt-2">
              Find quick answers to common questions about our services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-medium">How quickly do you respond to inquiries?</h3>
              <p className="text-gray-600">
                We typically respond to email inquiries within 24 hours. For urgent matters, please use our live chat or call our support line.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Do you offer customer support in multiple languages?</h3>
              <p className="text-gray-600">
                Yes, our customer support team can assist you in English, Spanish, French, German, and Mandarin.
              </p>
            </div>



            <div className="space-y-2">
              <h3 className="font-medium">How can I become a partner or reseller?</h3>
              <p className="text-gray-600">
                Please email our partnership team at support@fliday.com with your proposal and company details.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Still have questions? Check our complete <a href="/faq" className="text-[#F15A25] font-medium">FAQ page</a>.
            </p>
          </div>
        </div>
      </div>


    </div>
  );
}