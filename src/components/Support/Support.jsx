'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, MessageCircle, Mail, HelpCircle } from 'lucide-react';
import BenefitsSection from '../Home/BenefitsSection';
import SetupProcess from '../Home/SetupProcess';

// Crisp Chat Component
function CrispChat({ user }) {
  useEffect(() => {
    // Initialize Crisp
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = "7ad040de-33b2-4d83-a708-77ef357e5005";
    
    // Load Crisp script
    (function() {
      const d = document;
      const s = d.createElement("script");
      s.src = "https://client.crisp.chat/l.js";
      s.async = 1;
      d.getElementsByTagName("head")[0].appendChild(s);
    })();

    // Set up event handlers when Crisp is ready
    window.$crisp.push(["on", "session:loaded", function() {
      console.log("Crisp loaded");
      
      // Set visitor information if available
      if (user && user.email) {
        window.$crisp.push(["set", "user:email", user.email]);
        
        if (user.name) {
          window.$crisp.push(["set", "user:nickname", user.name]);
        }
        
        // Add custom user data
        window.$crisp.push(["set", "session:data", [
          ["userType", user.type || 'Customer'],
          ["plan", user.plan || 'Standard']
        ]]);
      }

      // Add eSIM-related tags to the conversation
      window.$crisp.push(["set", "session:tags", ["eSIM", "support"]]);
      
      // Example of logging a custom event
      window.$crisp.push(["set", "session:event", [
        ["visited_support_page", { timestamp: new Date().toISOString() }]
      ]]);
    }]);

    // Set up other Crisp event handlers
    window.$crisp.push(["on", "chat:opened", function() {
      console.log("Chat window opened");
      // You could trigger analytics here
    }]);

    window.$crisp.push(["on", "chat:closed", function() {
      console.log("Chat window closed");
      // You could trigger analytics here
    }]);

    window.$crisp.push(["on", "message:sent", function() {
      console.log("Chat started");
      // You could trigger analytics here
    }]);

    window.$crisp.push(["on", "chat:unread", function() {
      console.log("Unread messages");
      // You could trigger a notification
    }]);

    // No explicit cleanup needed for Crisp
  }, [user]);

  // This component doesn't render anything visible
  return null;
}

export default function Support() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Simulated user info - in a real app, this would come from your auth system
  const [user, setUser] = useState({
    name: '',
    email: '',
    type: 'Customer',
    plan: 'Standard'
  });

  // Load user info from localStorage if available
  useEffect(() => {
    const savedUserInfo = localStorage.getItem('userInfo');
    if (savedUserInfo) {
      try {
        setUser(JSON.parse(savedUserInfo));
      } catch (e) {
        console.error('Error parsing user info from localStorage');
      }
    }
  }, []);
  
  // Save user info to localStorage when it changes
  useEffect(() => {
    if (user.email) {
      localStorage.setItem('userInfo', JSON.stringify(user));
    }
  }, [user]);

  // Support categories
  const categories = ['All', 'Purchasing', 'Activation', 'Connectivity', 'Billing', 'Technical'];

  // Common support questions
  const supportQuestions = [
    {
      question: "How do I install my eSIM?",
      category: "Activation",
      url: "/faq"
    },
    {
      question: "My eSIM isn't connecting, what should I do?",
      category: "Connectivity",
      url: "/faq"
    },
    {
      question: "How can I check my data usage?",
      category: "Technical",
      url: "/faq"
    },
    {
      question: "Can I use my eSIM on multiple devices?",
      category: "Technical",
      url: "/faq"
    },
    {
      question: "How do I add more data to my existing eSIM?",
      category: "Purchasing",
      url: "/faq"
    },
    {
      question: "Is my device compatible with eSIM?",
      category: "Technical",
      url: "/faq"
    },
    {
      question: "How do I activate my eSIM when I arrive?",
      category: "Activation",
      url: "/faq"
    },
    {
      question: "I haven't received my eSIM QR code, what now?",
      category: "Purchasing",
      url: "/faq"
    },
    {
      question: "How do I request a refund?",
      category: "Billing",
      url: "/faq"
    },
    {
      question: "My data speed is slow, how can I improve it?",
      category: "Connectivity",
      url: "/faq"
    }
  ];

  // Filter questions based on search query and selected category
  const filteredQuestions = supportQuestions.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Open the chat widget
  const openChat = () => {
    if (window.$crisp) {
      window.$crisp.push(["do", "chat:open"]);
      
      // Optional: You can also set a specific message or data before opening
      window.$crisp.push(["set", "session:data", [
        ["issue", "Support Request from Website"]
      ]]);
    }
  };

  // Contact methods
  const contactMethods = [
    {
      title: "Live Chat",
      description: "Get instant help from our support team",
      icon: <MessageCircle className="w-6 h-6 text-[#F15A25]" />,
      action: "Chat Now",
      onClick: openChat
    },
    {
      title: "Email Support",
      description: "We'll respond within 24 hours",
      icon: <Mail className="w-6 h-6 text-[#F15A25]" />,
      action: "Email Us",
      url: "mailto:support@fliday.com"
    }
  ];

  return (
    <div className="max-w-[1220px] mx-auto px-4 pt-24 lg:pt-20">
      {/* Include CrispChat component */}
      <CrispChat user={user} />

      {/* Hero Section */}
      <div className="lg:text-center lg:mb-16 mb-5">
        <h1 className="lg:text-[40px] text-[28px] font-medium lg:mb-6">How can we help you?</h1>
        <p className="lg:text-lg text-[16px] text-gray-600 max-w-2xl mx-auto lg:mb-8 mb-3">
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
      <div className="lg:mb-16 mb-5">
        <h2 className="lg:text-[40px] text-[28px] text-left font-medium mb-6">Common Questions</h2>

        {/* Categories filter */}
        <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-6">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
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
      <div className="lg:mb-16 mb-5">
        <h2 className="lg:text-[40px] text-[28px] text-left font-medium mb-6">Contact Our Support Team</h2>
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
              {method.url ? (
                <a
                  href={method.url}
                  className="inline-block bg-[#F15A25] text-white px-6 py-2 rounded-full font-medium hover:bg-[#e04e1a] transition-colors"
                >
                  {method.action}
                </a>
              ) : (
                <button
                  onClick={method.onClick}
                  className="inline-block bg-[#F15A25] text-white px-6 py-2 rounded-full font-medium hover:bg-[#e04e1a] transition-colors"
                >
                  {method.action}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
          
      <SetupProcess/>
      <BenefitsSection/>
    </div>
  );
}