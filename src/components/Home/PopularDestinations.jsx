'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function PopularDestinations() {
    const [filterType, setFilterType] = useState('Country');

    const destinations = [
        { id: 1, name: 'Turkey', price: 3.99, flag: '🇹🇷' },
        { id: 2, name: 'United States', price: 3.99, flag: '🇺🇸' },
        { id: 3, name: 'Thailand', price: 3.99, flag: '🇹🇭' },
        { id: 4, name: 'Malaysia', price: 3.99, flag: '🇲🇾' },
        { id: 5, name: 'Morocco', price: 3.99, flag: '🇲🇦' },
        { id: 6, name: 'Italy', price: 3.99, flag: '🇮🇹' },
        { id: 7, name: 'Spain', price: 3.99, flag: '🇪🇸' },
        { id: 8, name: 'Indonesia', price: 3.99, flag: '🇮🇩' },
        { id: 9, name: 'Germany', price: 3.99, flag: '🇩🇪' }
    ];

    return (
        <section className="py-16  ">
            <div className="  ">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-[40px] font-medium mb-2">Choose your destination:</h2>
                        <p className="text-gray-600">Explore eSIM plans in 100+ countries.</p>
                    </div>

                    <Link
                        href="/destinations"
                        className="bg-[#F15A25] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-[#e04e1a] transition-colors"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {destinations.map(dest => (
                        <Link
                            key={dest.id}
                            href={`/destinations/${dest.name.toLowerCase().replace(/\s+/g, '-')}`}
                            className="bg-[#F6F6F6] rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow group"
                        >
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-[#F15A25] rounded-full flex items-center justify-center text-white mr-3">
                                    <span className="text-lg">{dest.flag}</span>
                                </div>
                                <div>
                                    <h3 className="font-medium">{dest.name}</h3>
                                    <p className="text-xs text-[#6B6B6B]">From USD {dest.price}</p>
                                </div>
                            </div>
                            <div className="  ">
                                <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none">
                                    <path d="M8.1992 8.73001C8.58947 8.33924 8.58906 7.70607 8.19828 7.3158L1.83021 0.955957C1.43943 0.565686 0.806263 0.566095 0.415992 0.956872C0.0257201 1.34765 0.0261301 1.98081 0.416907 2.37109L6.07742 8.02428L0.424225 13.6848C0.0339538 14.0756 0.0343633 14.7087 0.42514 15.099C0.815917 15.4893 1.44908 15.4889 1.83935 15.0981L8.1992 8.73001ZM7.00065 9.02368L7.49228 9.02336L7.49099 7.02336L6.99935 7.02368L7.00065 9.02368Z" fill="black" />
                                </svg>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}