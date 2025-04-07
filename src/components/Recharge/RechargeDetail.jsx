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
        <div className="max-w-[1220px] mx-auto px-1 py-12">
            <div className=" gap-[78px] flex justify-evenly lg:flex-row flex-col">
                {/* Left column - Destination image */}
                <div className=" relative rounded-lg overflow-hidden w-[360px] h-[400px] md:h-[623px]">
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
                            <Info size={16} className="mr-1" />
                            <span>Secure payment</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                            <CheckCircle size={16} className="mr-1" />
                            <span>Money-back guarantee</span>
                        </div>
                    </div>

                    {/* Feature tabs */}
                    <div className="border-b border-gray-200 mb-4">
                        <div className="flex space-x-6">
                            <button className="text-sm font-medium text-gray-900 border-b-2 border-[#F15A25] pb-2">
                                Key features
                            </button>
                            <button className="text-sm font-medium  cursor-pointer pb-2">
                                <a href="#faq"> FAQ</a>
                            </button>
                            <button className="text-sm font-medium  cursor-pointer pb-2">
                                <a href="#ben">
                                    Technical details
                                </a>
                            </button>
                        </div>
                    </div>

                    {/* Features list */}
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                            <span className="text-gray-400 mr-2">•</span>
                            <span>Affordable data plans, starting from USD 3.99.</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-gray-400 mr-2">•</span>
                            <span>Reliable connection from {formattedTitle}'s best networks.</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-gray-400 mr-2">•</span>
                            <span>Works with all eSIM-compatible smartphones.</span>
                        </li>
                    </ul>
                </div>
            </div>
            <SetupProcess />
            <div id='ben'  >

                <BenefitsSection />
            </div>
            <div id='faq'  >
                <FAQSection />
            </div>
        </div>
    );
}