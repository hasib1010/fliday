'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

export default function RechargePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('Countries');

    // Sample data for destinations
    const destinations = [
        { id: 1, name: 'Turkey', price: 3.99, flag: '🇹🇷', type: 'country' },
        { id: 2, name: 'United States', price: 3.99, flag: '🇺🇸', type: 'country' },
        { id: 3, name: 'Thailand', price: 3.99, flag: '🇹🇭', type: 'country' },
        { id: 4, name: 'Malaysia', price: 3.99, flag: '🇲🇾', type: 'country' },
        { id: 5, name: 'Morocco', price: 3.99, flag: '🇲🇦', type: 'country' },
        { id: 6, name: 'Italy', price: 3.99, flag: '🇮🇹', type: 'country' },
        { id: 7, name: 'Spain', price: 3.99, flag: '🇪🇸', type: 'country' },
        { id: 8, name: 'Indonesia', price: 3.99, flag: '🇮🇩', type: 'country' },
        { id: 9, name: 'Germany', price: 3.99, flag: '🇩🇪', type: 'country' },
        // Duplicate entries to match the design with many countries
        { id: 10, name: 'Turkey', price: 3.99, flag: '🇹🇷', type: 'country' },
        { id: 11, name: 'United States', price: 3.99, flag: '🇺🇸', type: 'country' },
        { id: 12, name: 'Thailand', price: 3.99, flag: '🇹🇭', type: 'country' },
        { id: 13, name: 'Malaysia', price: 3.99, flag: '🇲🇾', type: 'country' },
        { id: 14, name: 'Morocco', price: 3.99, flag: '🇲🇦', type: 'country' },
        { id: 15, name: 'Italy', price: 3.99, flag: '🇮🇹', type: 'country' },
        { id: 16, name: 'Spain', price: 3.99, flag: '🇪🇸', type: 'country' },
        { id: 17, name: 'Indonesia', price: 3.99, flag: '🇮🇩', type: 'country' },
        { id: 18, name: 'Germany', price: 3.99, flag: '🇩🇪', type: 'country' },
        { id: 19, name: 'Turkey', price: 3.99, flag: '🇹🇷', type: 'country' },
        { id: 20, name: 'United States', price: 3.99, flag: '🇺🇸', type: 'country' },
        { id: 21, name: 'Thailand', price: 3.99, flag: '🇹🇭', type: 'country' },
        { id: 22, name: 'Malaysia', price: 3.99, flag: '🇲🇾', type: 'country' },
        { id: 23, name: 'Morocco', price: 3.99, flag: '🇲🇦', type: 'country' },
        { id: 24, name: 'Italy', price: 3.99, flag: '🇮🇹', type: 'country' },
        { id: 25, name: 'Spain', price: 3.99, flag: '🇪🇸', type: 'country' },
        { id: 26, name: 'Indonesia', price: 3.99, flag: '🇮🇩', type: 'country' },
        { id: 27, name: 'Germany', price: 3.99, flag: '🇩🇪', type: 'country' },
        { id: 28, name: 'Turkey', price: 3.99, flag: '🇹🇷', type: 'country' },
        { id: 29, name: 'United States', price: 3.99, flag: '🇺🇸', type: 'country' },
        { id: 30, name: 'Thailand', price: 3.99, flag: '🇹🇭', type: 'country' },
        { id: 31, name: 'Malaysia', price: 3.99, flag: '🇲🇾', type: 'country' },
        { id: 32, name: 'Morocco', price: 3.99, flag: '🇲🇦', type: 'country' },
        { id: 33, name: 'Italy', price: 3.99, flag: '🇮🇹', type: 'country' },
        { id: 34, name: 'Spain', price: 3.99, flag: '🇪🇸', type: 'country' },
        { id: 35, name: 'Indonesia', price: 3.99, flag: '🇮🇩', type: 'country' },
        { id: 36, name: 'Germany', price: 3.99, flag: '🇩🇪', type: 'country' },
    ];

    // Filter destinations based on search query
    const filteredDestinations = destinations.filter(destination =>
        destination.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-[1220px] mx-auto px-1  py-12 ">
            <h1 className="text-[40px] font-medium mb-2">Recharge Your eSIM in Seconds</h1>
            <p className="text-gray-600 mb-6">Running low on data? Top up instantly and stay connected—no new QR code needed.</p>

            {/* Filter tabs */}
            <div className="flex gap-3 mb-6">
                {['Countries', 'Regions', 'Global'].map(filter => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${activeFilter === filter
                                ? 'bg-black text-white'
                                : 'bg-white text-black border border-gray-200'
                            }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* Search box */}
            <div className="mb-8 relative">
                <input
                    type="text"
                    placeholder="Enter your destination"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-full border border-[#F15A25] focus:outline-none focus:ring-2 focus:ring-[#F15A25]"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-[#F15A25] p-2 rounded-full text-white">
                    <Search size={18} />
                </div>
            </div>

            {/* Destinations grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDestinations.map(destination => (
                    <Link
                        key={destination.id}
                        href={`/recharge/${destination.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="bg-[#FFF3EE] rounded-lg p-4 flex items-center justify-between hover:shadow-  transition-shadow group"
                    >
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-[#F15A25] rounded-full flex items-center justify-center text-white mr-3">
                                <span>{destination.flag}</span>
                            </div>
                            <div>
                                <h3 className="font-medium">{destination.name}</h3>
                                <p className="text-sm text-gray-500">From USD {destination.price}</p>
                            </div>
                        </div>
                        <div className="text-gray-400 group-hover:text-[#F15A25] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none">
                                <path d="M8.19822 8.73001C8.58849 8.33924 8.58808 7.70607 8.19731 7.3158L1.82923 0.955957C1.43845 0.565686 0.805287 0.566095 0.415015 0.956872C0.0247436 1.34765 0.0251536 1.98081 0.41593 2.37109L6.07644 8.02428L0.423249 13.6848C0.0329772 14.0756 0.0333868 14.7087 0.424164 15.099C0.81494 15.4893 1.44811 15.4889 1.83838 15.0981L8.19822 8.73001ZM6.99967 9.02368L7.4913 9.02336L7.49001 7.02336L6.99838 7.02368L6.99967 9.02368Z" fill="black" />
                            </svg>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}