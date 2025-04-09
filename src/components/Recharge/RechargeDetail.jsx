'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle, Info } from 'lucide-react';
import SetupProcess from '../Home/SetupProcess';
import BenefitsSection from '../Home/BenefitsSection';
import FAQSection from '../Home/FAQSection';

export default function DestinationDetail({ params }) {
    const { id } = params || { id: 'default' };
    const formattedTitle = id ? id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Default';

    // State to track selected plan
    const [selectedPlan, setSelectedPlan] = useState('10 GB');
    const [orderNumber, setOrderNumber] = useState('');
    const [activeTab, setActiveTab] = useState('features');

    // Sample destination flags
    const countryFlags = {
        'turkey': '🇹🇷',
        'united-states': '🇺🇸',
        'thailand': '🇹🇭',
        'malaysia': '🇲🇾',
        'morocco': '🇲🇦',
        'italy': '🇮🇹',
        'spain': '🇪🇸',
        'indonesia': '🇮🇩',
        'germany': '🇩🇪',
    };

    // Sample destination images (in a real app, you would fetch this data)
    const destinationImages = {
        'turkey': '/destinations/turkey.jpg',
        'united-states': '/destinations/usa.jpg',
        'thailand': '/destinations/thailand.jpg',
        'italy': '/destinations/italy.jpg',
        'spain': '/destinations/spain.jpg',
        'indonesia': '/destinations/indonesia.jpg',
        'morocco': '/destinations/morocco.jpg',
        'malaysia': '/destinations/malaysia.jpg',
        'germany': '/destinations/germany.jpg',
        // Default image if specific country not found
        'default': '/destinations/default.png'
    };

    // Sample eSIM plans data
    const plans = [
        { id: 1, data: '1 GB', days: '7 days', price: 3.99 },
        { id: 2, data: '3 GB', days: '30 days', price: 6.99 },
        { id: 3, data: '5 GB', days: '30 days', price: 9.99 },
        { id: 4, data: '10 GB', days: '30 days', price: 15.99, discount: true, originalPrice: 18.99 },
        { id: 5, data: '20 GB', days: '30 days', price: 22.99, discount: true, originalPrice: 25.99 },
    ];

    // Get the selected plan details
    const selectedPlanDetails = plans.find(plan => plan.data === selectedPlan) || plans[3];

    // Get the destination image (or use default if not found)
    const destinationImage = destinationImages[id] || destinationImages['default'];
    const countryFlag = countryFlags[id] || '🌎';

    const handleCheckout = () => {
        // In a real app, this would handle the checkout process
        alert(`Proceeding to checkout for ${selectedPlanDetails.data} plan at $${selectedPlanDetails.price}`);
    };

    return (
        <div className="max-w-[1220px] mx-auto lg:px-1 px-2.5 py-12 lg:pt-24">
            <div className=" gap-[78px] flex justify-evenly lg:flex-row flex-col">
                {/* Left column - Destination image */}
                <div className=" relative rounded-lg overflow-hidden  lg:w-[468px] h-[624px] md:h-[623px]">
                    <Image
                        src={destinationImage}
                        alt={`eSIM for ${formattedTitle}`}
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Right column - eSIM details and plans */}
                <div className='max-w-[653px]'>
                    <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-[#F15A25] rounded-full flex items-center justify-center text-white mr-3">
                            <span>{countryFlag}</span>
                        </div>
                        <h1 className="text-2xl font-medium">Recharge eSim for {formattedTitle}</h1>
                    </div>

                    <p className="text-gray-600 mb-6">
                        Top up your existing eSIM with more data in seconds — no new installation needed.
                    </p>

                    <h2 className="font-medium mb-4">Choose your data plan</h2>

                    {/* Data plans grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`relative border rounded-lg p-4 cursor-pointer transition-all ${selectedPlan === plan.data
                                    ? 'border-[#F15A25]'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                onClick={() => setSelectedPlan(plan.data)}
                            >
                                {plan.discount && (
                                    <div className="absolute -top-2 -right-2 bg-[#F15A25] text-white text-xs px-2 py-1 rounded-full">
                                        15% <br /> OFF
                                    </div>
                                )}
                                <div className="flex items-start mb-2">
                                    <div onClick={() => setSelectedPlan(plan.data)} className="flex items-center cursor-pointer">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <circle
                                                cx="8"
                                                cy="8"
                                                r="6"
                                                strokeWidth={`${selectedPlan === plan.data ? '4' : '2'}`}
                                                stroke={`${selectedPlan === plan.data ? '#F15A25' : '#C9C9C9'}`}
                                            />
                                        </svg>
                                        <span className="ml-2">{plan.label}</span>
                                    </div>

                                    <div>
                                        <div className="font-medium">{plan.data}</div>
                                        <div className="text-sm text-gray-500">{plan.days}</div>
                                    </div>
                                </div>
                                <div>
                                    <div className="font-medium">USD {plan.price.toFixed(2)}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order number input */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <p className="text-sm font-medium mb-2">Previous order number after #</p>
                        <input
                            type="text"
                            placeholder="Enter your order number"
                            value={orderNumber}
                            onChange={(e) => setOrderNumber(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-md"
                        />
                    </div>

                    {/* Action buttons */}
                    <button
                        onClick={handleCheckout}
                        className="block w-full bg-[#F15A25] text-white font-medium py-3 rounded-full text-center mb-3 hover:bg-[#e04e1a] transition-colors"
                    >
                        Go to checkout - ${selectedPlanDetails.price.toFixed(2)}
                    </button>

                    <button
                        className="block w-full border border-gray-300 text-gray-700 font-medium py-3 rounded-full text-center mb-6 hover:bg-gray-50 transition-colors"
                    >
                        Check Compatibility
                    </button>

                    {/* Trust badges */}
                    <div className="flex justify-center space-x-8 mb-8">
                        <div className="flex items-center text-sm text-gray-500">
                           <Image src={"/icons/CardSecurity.png"} alt="Card Security" width={24} height={24} className="mr-1" />
                            <span>Secure payment</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                        <Image src={"/icons/Guarantee.png"} alt="Money-back guarantee" width={24} height={24} className="mr-1" />
                            <span>Money-back guarantee</span>
                        </div>
                    </div>

                    {/* Feature tabs */}
                    <div className="border-b border-gray-200 mb-4">
                        <div className="flex space-x-6">
                            <button
                                onClick={() => setActiveTab('features')}
                                className={`text-sm cursor-pointer font-medium pb-2 transition-colors ${activeTab === 'features'
                                    ? 'text-gray-900 border-b-2 border-[#F15A25]'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Key features
                            </button>
                            <button
                                onClick={() => setActiveTab('description')}
                                className={`text-sm cursor-pointer font-medium pb-2 transition-colors ${activeTab === 'description'
                                    ? 'text-gray-900 border-b-2 border-[#F15A25]'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Description
                            </button>
                            <button
                                onClick={() => setActiveTab('technical')}
                                className={`text-sm cursor-pointer font-medium pb-2 transition-colors ${activeTab === 'technical'
                                    ? 'text-gray-900 border-b-2 border-[#F15A25]'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Technical details
                            </button>
                            <button
                                onClick={() => setActiveTab('trust')}
                                className={`text-sm cursor-pointer font-medium pb-2 transition-colors ${activeTab === 'trust'
                                    ? 'text-gray-900 border-b-2 border-[#F15A25]'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Trust & Safety
                            </button>
                        </div>
                    </div>

                    {/* Tab content */}
                    <div className="py-4">
                        {activeTab === 'features' && (
                            <ul className="space-y-2  ">
                                <li className="flex items-start">
                                    <span className="text-gray-400 mr-2">•</span>
                                    <span>Affordable data from just $3.99</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-gray-400 mr-2">•</span>
                                    <span>Stay connected with {formattedTitle}'s top networks.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-gray-400 mr-2">•</span>
                                    <span>Compatible with all eSIM-ready smartphones.</span>
                                </li>
                            </ul>
                        )}

                        {activeTab === 'description' && (
                            <div className="text-gray-700">
                                <p className="mb-3">
                                    Stay connected in {formattedTitle} without breaking the bank! Whether you're a traveler, tourist, or business explorer, our prepaid eSIM keeps you online effortlessly.
                                </p>
                                <p>
                                    Choose your perfect data plan (1 GB to 20 GB), activate instantly, and enjoy {formattedTitle} at full speed.
                                </p>
                            </div>
                        )}

                        {activeTab === 'technical' && (
                            <div className="text-gray-700 space-y-2">
                                <p><span className="font-medium">Activation:</span> Your eSIM activates automatically when you arrive in {formattedTitle}.</p>
                                <p><span className="font-medium">Plan Duration:</span> Choose between 7-day or 30-day options, depending on your plan.</p>
                                <p><span className="font-medium">Data Plans:</span> Flexible data packages from 1 GB up to 20 GB.</p>
                                <p><span className="font-medium">Delivery Time:</span> Instant delivery right after your purchase.</p>
                                <p><span className="font-medium">SMS & Calls:</span> SMS not included. Calls available through apps like WhatsApp, Telegram, or Messenger (VoIP only).</p>
                                <p><span className="font-medium">Speed:</span> Enjoy fast speeds including 3G, 4G, LTE, or 5G, depending on local network availability.</p>
                                <p><span className="font-medium">Hotspot:</span> Use your data freely with no hotspot restrictions.</p>
                                <p><span className="font-medium">Coverage:</span> Reliable connection in cities and towns across {formattedTitle}. Network quality depends on local providers.</p>
                            </div>
                        )}

                        {activeTab === 'trust' && (
                            <div className="bg-gray-50 rounded-lg p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex items-start">
                                        <div className="w-10 h-10 rounded-full bg-[#FFF0EC] flex items-center justify-center flex-shrink-0 mr-4">
                                            <CheckCircle className="w-5 h-5 text-[#F15A25]" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium mb-1">Money-back guarantee</h3>
                                            <p className="text-sm text-gray-600">Not satisfied? Get a full refund within 30 days of purchase if you haven't used the data.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <div className="w-10 h-10 rounded-full bg-[#FFF0EC] flex items-center justify-center flex-shrink-0 mr-4">
                                            <Info className="w-5 h-5 text-[#F15A25]" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium mb-1">Secure payment</h3>
                                            <p className="text-sm text-gray-600">All transactions are processed securely with 256-bit SSL encryption.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <div className="w-10 h-10 rounded-full bg-[#FFF0EC] flex items-center justify-center flex-shrink-0 mr-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F15A25]">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-medium mb-1">Privacy protection</h3>
                                            <p className="text-sm text-gray-600">Your personal data is never shared with third parties without your consent.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <div className="w-10 h-10 rounded-full bg-[#FFF0EC] flex items-center justify-center flex-shrink-0 mr-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F15A25]">
                                                <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                                                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                                                <line x1="6" y1="1" x2="6" y2="4"></line>
                                                <line x1="10" y1="1" x2="10" y2="4"></line>
                                                <line x1="14" y1="1" x2="14" y2="4"></line>
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-medium mb-1">24/7 Support</h3>
                                            <p className="text-sm text-gray-600">Get assistance anytime, anywhere with our dedicated support team.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <SetupProcess />
            <BenefitsSection />
            <FAQSection />
        </div>
    );
}