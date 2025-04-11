'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function PopularDestinations() {
    const [filterType, setFilterType] = useState('Country');
    const [activeDestination, setActiveDestination] = useState(null);
    const [activeButton, setActiveButton] = useState(null);
    const [activeViewAllButton, setActiveViewAllButton] = useState(false);

    const destinations = [
        { id: 1, name: 'Turkey', price: 3.99, code: 'tr' },
        { id: 2, name: 'United States', price: 3.99, code: 'us' },
        { id: 3, name: 'Thailand', price: 3.99, code: 'th' },
        { id: 4, name: 'Malaysia', price: 3.99, code: 'my' },
        { id: 5, name: 'Morocco', price: 3.99, code: 'ma' },
        { id: 6, name: 'Italy', price: 3.99, code: 'it' },
        { id: 7, name: 'Spain', price: 3.99, code: 'es' },
        { id: 8, name: 'Indonesia', price: 3.99, code: 'id' },
        { id: 9, name: 'Germany', price: 3.99, code: 'de' }
    ];

    // Handle touch start for mobile devices
    const handleTouchStart = (id) => {
        setActiveDestination(id);
    };

    // Handle touch end for mobile devices
    const handleTouchEnd = () => {
        setActiveDestination(null);
    };
    
    // Handle touch start for filter buttons
    const handleButtonTouchStart = (type) => {
        setActiveButton(type);
    };
    
    // Handle touch end for filter buttons
    const handleButtonTouchEnd = () => {
        setActiveButton(null);
    };
    
    // Handle touch events for View All Destinations button
    const handleViewAllTouchStart = () => {
        setActiveViewAllButton(true);
    };
    
    const handleViewAllTouchEnd = () => {
        setActiveViewAllButton(false);
    };

    return (
        <section className="pt-[3rem] p-3 lg:p-0 lg:mt-16">
            <div>
                <div className="flex lg:justify-between text-left flex-col lg:flex-row lg:items-center mb-6 p-1 lg:p-0">
                    <div>
                        <h2 className="lg:text-[40px] text-[1.75rem] font-medium mb-2">Choose your destination:</h2>
                        <p className="text-gray-600 my-1.5">Explore eSIM plans in 100+ countries.</p>
                    </div>

                    <Link
                        href="/destinations"
                        className={`bg-[#F15A25] hidden lg:block text-white text-center px-[28px] py-[11px] rounded-full text-base font-medium hover:bg-[#e04e1a] active:bg-[#e04e1a] ${activeViewAllButton ? 'bg-[#e04e1a]' : ''} transition-colors`}
                        onTouchStart={handleViewAllTouchStart}
                        onTouchEnd={handleViewAllTouchEnd}
                    >
                        View All Destinations
                    </Link>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 mb-8">
                    {['Country', 'Region', 'Global'].map(type => (
                        <button
                            key={type}
                            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                                filterType === type
                                    ? 'bg-black text-white'
                                    : `bg-white text-black hover:bg-[#E2E2E4] active:bg-[#E2E2E4] cursor-pointer border border-gray-200 ${activeButton === type ? 'bg-[#E2E2E4]' : ''}`
                            }`}
                            onClick={() => setFilterType(type)}
                            onTouchStart={() => handleButtonTouchStart(type)}
                            onTouchEnd={handleButtonTouchEnd}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* Destinations grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 p-2 gap-4 lg:p-0">
                    {destinations.map(dest => (
                        <Link
                            key={dest.id}
                            href={`/destinations/${dest.name.toLowerCase().replace(/\s+/g, '-')}`}
                            className={`${
                                activeDestination === dest.id ? 'bg-[#d5d5d5]' : 'bg-[#f7f7f8]'
                            } hover:bg-[#d5d5d5] active:bg-[#d5d5d5] transition-colors rounded-lg p-4 flex items-center justify-between min-h-[56px] group`}
                            onTouchStart={() => handleTouchStart(dest.id)}
                            onTouchEnd={handleTouchEnd}
                        >
                            <div className="flex items-center">
                                <div className="rounded-full flex items-center justify-center text-white mr-3 overflow-hidden">
                                    <div className="w-[36px] h-[36px] relative overflow-hidden shrink-0 rounded-full">
                                        <Image
                                            src={`/flags/${dest.code}_flag.jpeg`}
                                            alt={`${dest.name} flag`}
                                            fill
                                            className="object-cover"
                                            sizes="100vw"
                                        />
                                        <div className="absolute inset-0 border-[1px] border-[rgba(0,0,0,0.1)] rounded-full pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-medium text-[20px]">{dest.name}</h3>
                                    <p className="text-[16px] text-[#6B6B6B]">From USD {dest.price}</p>
                                </div>
                            </div>
                            <div>
                                <svg
                                    role="img"
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    className="mt-1 ltr:-rotate-90 rtl:rotate-90 pointer-events-none text-tertiary"
                                >
                                    <title>Chevron right</title>
                                    <path
                                        fill="currentColor"
                                        fillRule="evenodd"
                                        d="M13.2151 6.8326L8.43758 11.4101C8.27758 11.5451 8.12758 11.6001 8.00008 11.6001C7.87258 11.6001 7.70083 11.5446 7.58533 11.4329L2.78533 6.8326C2.54543 6.6051 2.53763 6.2026 2.76733 5.9851C2.99546 5.74447 3.37683 5.73665 3.61508 5.96713L8.00008 10.1701L12.3851 5.9701C12.6226 5.73962 13.0046 5.74745 13.2328 5.98807C13.4626 6.2026 13.4551 6.6051 13.2151 6.8326Z"
                                    />
                                </svg>
                            </div>
                        </Link>
                    ))}
                </div>
                <Link
                    href="/destinations"
                    className={`bg-[#F15A25] block w-full md:w-fit mx-auto lg:hidden text-white text-center py-[11px] px-[22px] rounded-full text-[1rem] my-3 font-medium hover:bg-[#e04e1a] active:bg-[#e04e1a] ${activeViewAllButton ? 'bg-[#e04e1a]' : ''} transition-colors`}
                    onTouchStart={handleViewAllTouchStart}
                    onTouchEnd={handleViewAllTouchEnd}
                >
                    View All Destinations
                </Link>
            </div>
        </section>
    );
}