'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

export default function AllDestinations() {
  const [activeFilter, setActiveFilter] = useState('Countries');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample data for destinations
  const destinations = [
    { id: 1, name: 'Turkey', price: 3.99, code: 'tr', type: 'country' },
    { id: 2, name: 'United States', price: 3.99, code: 'us', type: 'country' },
    { id: 3, name: 'Thailand', price: 3.99, code: 'th', type: 'country' },
    { id: 4, name: 'Malaysia', price: 3.99, code: 'my', type: 'country' },
    { id: 5, name: 'Morocco', price: 3.99, code: 'ma', type: 'country' },
    { id: 6, name: 'Italy', price: 3.99, code: 'it', type: 'country' },
    { id: 7, name: 'Spain', price: 3.99, code: 'es', type: 'country' },
    { id: 8, name: 'Indonesia', price: 3.99, code: 'id', type: 'country' },
    { id: 9, name: 'Germany', price: 3.99, code: 'de', type: 'country' },
    { id: 10, name: 'France', price: 3.99, code: 'fr', type: 'country' },
    { id: 11, name: 'United Kingdom', price: 3.99, code: 'gb', type: 'country' },
    { id: 12, name: 'Japan', price: 3.99, code: 'jp', type: 'country' },
    { id: 13, name: 'China', price: 3.99, code: 'cn', type: 'country' },
    { id: 14, name: 'Australia', price: 3.99, code: 'au', type: 'country' },
    { id: 15, name: 'Brazil', price: 3.99, code: 'br', type: 'country' },
    { id: 16, name: 'Canada', price: 3.99, code: 'ca', type: 'country' },
    { id: 17, name: 'Mexico', price: 3.99, code: 'mx', type: 'country' },
    { id: 18, name: 'South Korea', price: 3.99, code: 'kr', type: 'country' },
    { id: 19, name: 'Singapore', price: 3.99, code: 'sg', type: 'country' },
    { id: 20, name: 'Vietnam', price: 3.99, code: 'vn', type: 'country' },
    { id: 21, name: 'Portugal', price: 3.99, code: 'pt', type: 'country' },
    { id: 22, name: 'Greece', price: 3.99, code: 'gr', type: 'country' },
    { id: 23, name: 'Netherlands', price: 3.99, code: 'nl', type: 'country' },
    { id: 24, name: 'Switzerland', price: 3.99, code: 'ch', type: 'country' },
    { id: 25, name: 'Sweden', price: 3.99, code: 'se', type: 'country' },
    { id: 26, name: 'Norway', price: 3.99, code: 'no', type: 'country' },
    { id: 27, name: 'Denmark', price: 3.99, code: 'dk', type: 'country' },
    { id: 28, name: 'Finland', price: 3.99, code: 'fi', type: 'country' },
    { id: 29, name: 'Iceland', price: 3.99, code: 'is', type: 'country' },
    { id: 30, name: 'Ireland', price: 3.99, code: 'ie', type: 'country' },
    { id: 31, name: 'Austria', price: 3.99, code: 'at', type: 'country' },
    { id: 32, name: 'Belgium', price: 3.99, code: 'be', type: 'country' },
    { id: 33, name: 'Poland', price: 3.99, code: 'pl', type: 'country' },
    { id: 34, name: 'Russia', price: 3.99, code: 'ru', type: 'country' },
    { id: 35, name: 'India', price: 3.99, code: 'in', type: 'country' },
    { id: 36, name: 'South Africa', price: 3.99, code: 'za', type: 'country' },
  ];

  // Filter destinations based on search query
  const filteredDestinations = destinations.filter(destination =>
    destination.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1220px] mx-auto mt-20      px-3 lg:px-0">
      <h1 className="lg:text-[40px]  text-3xl    font-medium mb-2">All destinations</h1>
      <p className="text-gray-600 mb-6">Explore eSIM plans in 100+ countries.</p>

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
            href={`/destinations/${destination.name.toLowerCase().replace(/\s+/g, '-')}`}
            className="hover:bg-[#d5d5d5] bg-[#f7f7f8]   transition-colors rounded-lg p-4 flex items-center justify-between  group"
          >
            <div className="flex items-center">
              <div className="     rounded-full flex items-center justify-center text-white mr-3 overflow-hidden">
                {/* Using Flagcdn API for flag images */}
                <img
                  src={`https://flagcdn.com/${destination.code}.svg`}
                  alt={`${destination.name} flag`}
                  className="w-[35px] rounded-full h-[35px] object-cover bg-center"
                />
              </div>
              <div>
                <h3 className="font-medium lg:text-[20px] text-[1.25rem]">{destination.name}</h3>
                <p className="text-[16px] text-[#6B6B6B]">From USD {destination.price}</p>
              </div>
            </div>
            <div className="text-gray-400   ">
              <svg role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" class="mt-1 ltr:-rotate-90 rtl:rotate-90 pointer-events-none text-tertiary"><title>Chevron right</title><path fill="currentColor" fill-rule="evenodd" d="M13.2151 6.8326L8.43758 11.4101C8.27758 11.5451 8.12758 11.6001 8.00008 11.6001C7.87258 11.6001 7.70083 11.5446 7.58533 11.4329L2.78533 6.8326C2.54543 6.6051 2.53763 6.2026 2.76733 5.9851C2.99546 5.74447 3.37683 5.73665 3.61508 5.96713L8.00008 10.1701L12.3851 5.9701C12.6226 5.73962 13.0046 5.74745 13.2328 5.98807C13.4626 6.2026 13.4551 6.6051 13.2151 6.8326Z"></path></svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}