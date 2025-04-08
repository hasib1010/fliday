'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, MessageCircle, Mail, Phone, HelpCircle, FileText, Globe, Clock } from 'lucide-react';

export default function Support() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Support categories
  const categories = ['All', 'Purchasing', 'Activation', 'Connectivity', 'Billing', 'Technical'];

  // Common support questions
  const supportQuestions = [
    {
      question: "How do I install my eSIM?",
      category: "Activation",
      url: "/support/how-to-install-esim"
    },
    {
      question: "My eSIM isn't connecting, what should I do?",
      category: "Connectivity",
      url: "/support/connectivity-issues"
    },
    {
      question: "How can I check my data usage?",
      category: "Technical",
      url: "/support/check-data-usage"
    },
    {
      question: "Can I use my eSIM on multiple devices?",
      category: "Technical",
      url: "/support/multiple-devices"
    },
    {
      question: "How do I add more data to my existing eSIM?",
      category: "Purchasing",
      url: "/support/add-more-data"
    },
    {
      question: "Is my device compatible with eSIM?",
      category: "Technical",
      url: "/support/device-compatibility"
    },
    {
      question: "How do I activate my eSIM when I arrive?",
      category: "Activation",
      url: "/support/activation-guide"
    },
    {
      question: "I haven't received my eSIM QR code, what now?",
      category: "Purchasing",
      url: "/support/missing-qr-code"
    },
    {
      question: "How do I request a refund?",
      category: "Billing",
      url: "/support/refund-process"
    },
    {
      question: "My data speed is slow, how can I improve it?",
      category: "Connectivity",
      url: "/support/improve-data-speed"
    }
  ];

  // Filter questions based on search query and selected category
  const filteredQuestions = supportQuestions.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Contact methods
  const contactMethods = [
    {
      title: "Live Chat",
      description: "Get instant help from our support team",
      icon: <MessageCircle className="w-6 h-6 text-[#F15A25]" />,
      action: "Chat Now",
      url: "#chat"
    },
    {
      title: "Email Support",
      description: "We'll respond within 24 hours",
      icon: <Mail className="w-6 h-6 text-[#F15A25]" />,
      action: "Email Us",
      url: "mailto:support@fliday.com"
    }
  ];

  // Self-help resources
  const resources = [
    {
      title: "Help Center",
      description: "Browse our comprehensive knowledge base",
      icon: <HelpCircle className="w-6 h-6 text-[#F15A25]" />,
      url: "/help-center"
    },
    {
      title: "User Guides",
      description: "Step-by-step instructions for every device",
      icon: <FileText className="w-6 h-6 text-[#F15A25]" />,
      url: "/guides"
    },
    {
      title: "Coverage Map",
      description: "Check network availability in your destination",
      icon: <Globe className="w-6 h-6 text-[#F15A25]" />,
      url: "/coverage"
    },
    {
      title: "Status Updates",
      description: "View current service status and updates",
      icon: <Clock className="w-6 h-6 text-[#F15A25]" />,
      url: "/status"
    }
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-[40px] font-medium mb-6">How can we help you?</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Get the support you need for your eSIM. Search for answers or reach out to our team directly.
        </p>

        {/* Search Box */}
        <div className="max-w-2xl mx-auto relative">
          <input
            type="text"
            placeholder="Search for answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-6 py-4 pr-12 rounded-full border border-[#F15A25] focus:outline-none focus:ring-2 focus:ring-[#F15A25] shadow-sm"
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search size={20} />
          </div>
        </div>
      </div>

      {/* Common Questions Section */}
      <div className="mb-16">
        <h2 className="lg:text-[40px] text-xl  text-center lg:text-left font-medium mb-6">Common Questions</h2>

        {/* Categories filter */}
        <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-6">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === category
                  ? 'bg-[#F15A25] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Questions grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuestions.length > 0 ? (
            filteredQuestions.map((item, index) => (
              <Link
                key={index}
                href={item.url}
                className="p-4 border border-gray-200 rounded-lg hover:border-[#F15A25] hover:shadow-sm transition-all"
              >
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-[#FFF0EC] flex items-center justify-center mr-3 flex-shrink-0">
                    <HelpCircle size={16} className="text-[#F15A25]" />
                  </div>
                  <div>
                    <h3 className="font-medium">{item.question}</h3>
                    <span className="text-xs text-gray-500 mt-1 inline-block">{item.category}</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-2 text-center py-8 border border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500">No results found. Try another search term or browse all categories.</p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Methods Section */}
      <div className="mb-16">
        <h2 className="lg:text-[40px]  text-xl  text-center lg:text-left font-medium mb-6">Contact Our Support Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contactMethods.map((method, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-[#FFF0EC] flex items-center justify-center mr-3">
                  {method.icon}
                </div>
                <h3 className="text-xl font-medium">{method.title}</h3>
              </div>
              <p className="text-gray-600 mb-6">{method.description}</p>
              <a
                href={method.url}
                className="inline-block bg-[#F15A25] text-white px-6 py-2 rounded-full font-medium hover:bg-[#e04e1a] transition-colors"
              >
                {method.action}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Self-Help Resources Section */}
      <div>
        <h2 className="lg:text-[40px]  text-xl  text-center lg:text-left font-medium mb-6">Self-Help Resources</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {resources.map((resource, index) => (
            <Link
              key={index}
              href={resource.url}
              className="bg-gray-50 p-6 rounded-xl hover:bg-[#FFF0EC] transition-all"
            >
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  {resource.icon}
                </div>
                <h3 className="text-lg font-medium mb-2">{resource.title}</h3>
                <p className="text-gray-600 text-sm">{resource.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Help Prompt Section */}
      <div className="bg-[#FFF3EE] rounded-lg p-8 mt-16 flex flex-col md:flex-row justify-between items-center">
        <div>
          <h2 className="lg:text-[40px]  text-xl  text-center lg:text-left font-medium mb-2">Still can't find an answer to your question?</h2>
          <p className="text-gray-600 lg:text-left text-center">Our team is here to help you out—just reach out!</p>
        </div>
        <div className="mt-6 md:mt-0">
          <a
            href="mailto:support@fliday.com"
            className="inline-block px-8 py-3 bg-[#F15A25] text-white rounded-full font-medium hover:bg-[#e04e1a] transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}