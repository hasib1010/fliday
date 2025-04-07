'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle, Info } from 'lucide-react';
import SetupProcess from '../Home/SetupProcess';
import BenefitsSection from '../Home/BenefitsSection';
import FAQSection from '../Home/FAQSection';

export default function DestinationDetail({ params }) {
    const id = params?.id || 'default';
    const formattedTitle = id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    // State to track selected plan
    const [selectedPlan, setSelectedPlan] = useState('10 GB');

    // Sample eSIM plans data
    const plans = [
        { id: 1, data: '1 GB', days: '7 days', price: 3.99 },
        { id: 2, data: '3 GB', days: '30 days', price: 8.99 },
        { id: 3, data: '5 GB', days: '30 days', price: 9.99, popular: true },
        { id: 4, data: '10 GB', days: '30 days', price: 15.99, discount: true, originalPrice: 18.99 },
        { id: 5, data: '20 GB', days: '30 days', price: 22.99, discount: true, originalPrice: 25.99 },
    ];

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

    // Get the selected plan details
    const selectedPlanDetails = plans.find(plan => plan.data === selectedPlan) || plans[3];

    // Get the destination image (or use default if not found)
    const destinationImage = destinationImages[id] || destinationImages['default'];

    return (
        <div className="  px-4 py-12">
            <div className="  gap-[78px] flex justify-center lg:flex-row flex-col">
                {/* Left column - Destination image */}
                <div className="relative rounded-lg overflow-hidden w-[360px] h-[400px] md:h-[623px]">
                    <Image
                        src={destinationImage}
                        alt={`eSIM for ${formattedTitle}`}
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Right column - eSIM details and plans */}
                <div className='max-w-[633px]'>
                    <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-[#F15A25] rounded-full flex items-center justify-center text-white mr-3">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 10V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" />
                                <path d="M20 14v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3" />
                                <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-medium">eSIM for {formattedTitle}</h1>
                    </div>

                    <p className="text-gray-600 mb-6">
                        Get an eSIM card for {formattedTitle} and enjoy reliable and affordable internet access on your trip.
                    </p>

                    <h2 className="font-medium mb-4">Choose your data plan</h2>

                    {/* Data plans grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                onClick={() => setSelectedPlan(plan.data)}
                                className={`relative border rounded-lg p-3 cursor-pointer transition-all ${selectedPlan === plan.data
                                    ? 'border-[#F15A25] bg-[#FFF8F6]'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-2 -right-2 bg-[#F15A25] text-white text-xs px-2 py-1 rounded-full">
                                        10% <br />OFF
                                    </div>
                                )}
                                {plan.discount && (
                                    <div className="absolute -top-2 -right-2 bg-[#F15A25] text-white text-xs px-2 py-1 rounded-full">
                                        15%<br />OFF
                                    </div>
                                )}
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <circle
                                        cx="8"
                                        cy="8"
                                        r="7"
                                        strokeWidth="2"
                                        stroke={`${selectedPlan === plan.data ? '#F15A25' : '#C9C9C9'}`}
                                    />
                                </svg>

                                <div className="font-medium">{plan.data}</div>
                                <div className="text-sm text-gray-500">{plan.days}</div>
                                <div className="mt-1">
                                    <span className="font-medium">USD {plan.price.toFixed(2)}</span>
                                    {plan.originalPrice && (
                                        <span className="text-sm text-gray-400 line-through ml-1">
                                            ${plan.originalPrice.toFixed(2)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Auto-activate section */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <div className="flex items-center mb-2">
                            <Info size={16} className="mr-1" />
                            <label htmlFor="auto-activate" className="text-sm font-medium">
                                Can I activate my plan later?
                            </label>
                        </div>
                        <p className="text-xs text-gray-500">
                            All plans have a 30-day activation period. If you get a plan today and don't activate it within 30 days, it will activate automatically.
                        </p>
                    </div>

                    {/* Action buttons */}
                    <Link
                        href={`/checkout?plan=${selectedPlanDetails.data}&price=${selectedPlanDetails.price}&country=${id}`}
                        className="block w-full bg-[#F15A25] text-white font-medium py-3 rounded-full text-center mb-3 hover:bg-[#e04e1a] transition-colors"
                    >
                        Go to checkout - ${selectedPlanDetails.price.toFixed(2)}
                    </Link>

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
                            <button className="text-sm font-medium text-gray-500 pb-2">
                                FAQ
                            </button>
                            <button className="text-sm font-medium text-gray-500 pb-2">
                                Technical details
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
            <SetupProcess/>
            <BenefitsSection/>
            <FAQSection/>
        </div>
    );
}