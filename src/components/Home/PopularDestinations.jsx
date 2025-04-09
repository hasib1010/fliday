'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function PopularDestinations() {
    const [filterType, setFilterType] = useState('Country');

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

    return (
        <section className="pt-[3rem] p-3 lg:p-0 ">
            <div>
                <div className="flex lg:justify-between  text-left flex-col lg:flex-row  lg:items-center mb-6 p-1 lg:p-0">
                    <div>
                        <h2 className="lg:text-[40px] text-[1.75rem] font-medium mb-2">Choose your destination:</h2>
                        <p className="text-gray-600  my-1.5">Explore eSIM plans in 100+ countries.</p>
                    </div>

                    <Link
                        href="/destinations"
                        className="bg-[#F15A25] hidden lg:block text-white text-center px-5 py-2 rounded-full text-sm font-medium hover:bg-[#e04e1a] transition-colors"
                    >
                        View Destinations
                    </Link>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 mb-8">
                    {['Country', 'Region', 'Global'].map(type => (
                        <button
                            key={type}
                            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${filterType === type
                                ? 'bg-black text-white'
                                : 'bg-white text-black border border-gray-200'
                                }`}
                            onClick={() => setFilterType(type)}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* Destinations grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 gap-3 p-2 lg:p-0">
                    {destinations.map(dest => (
                        <Link
                            key={dest.id}
                            href={`/destinations/${dest.name.toLowerCase().replace(/\s+/g, '-')}`}
                            className="hover:bg-[#d5d5d5] bg-[#f7f7f8]   transition-colors  rounded-lg p-4 flex items-center justify-between min-h-[56px]  group"
                        >
                            <div className="flex items-center">
                                <div className="     rounded-full flex items-center justify-center text-white mr-3 overflow-hidden">
                                    {/* Using Flagcdn API for flag images */}
                                    <img
                                        src={`https://flagcdn.com/${dest.code}.svg`}
                                        alt={`${dest.name} flag`}
                                        className="w-[35px] rounded-full h-[35px] object-cover"
                                    />
                                </div>
                                <div>
                                    <h3 className="font-medium   text-[20px]">{dest.name}</h3>
                                    <p className="text-[16px] text-[#6B6B6B]">From USD {dest.price}</p>
                                </div>
                            </div>
                            <div>
                                <svg role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" class="mt-1 ltr:-rotate-90 rtl:rotate-90 pointer-events-none text-tertiary"><title>Chevron right</title><path fill="currentColor" fill-rule="evenodd" d="M13.2151 6.8326L8.43758 11.4101C8.27758 11.5451 8.12758 11.6001 8.00008 11.6001C7.87258 11.6001 7.70083 11.5446 7.58533 11.4329L2.78533 6.8326C2.54543 6.6051 2.53763 6.2026 2.76733 5.9851C2.99546 5.74447 3.37683 5.73665 3.61508 5.96713L8.00008 10.1701L12.3851 5.9701C12.6226 5.73962 13.0046 5.74745 13.2328 5.98807C13.4626 6.2026 13.4551 6.6051 13.2151 6.8326Z"></path></svg>
                            </div>
                        </Link>
                    ))}
                </div>
                <Link
                    href="/destinations"
                    className="bg-[#F15A25] block lg:hidden text-white text-center p-[11px] rounded-full text-[1rem] my-3 font-medium hover:bg-[#e04e1a] transition-colors"
                >
                    View Destinations
                </Link>
            </div>
        </section>
    );
}