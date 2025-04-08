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
    <div className="max-w-[1220px] mx-auto px-2 lg:py-12 mt-5 lg:mt-0">
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
            className="bg-[#F6F6F6] rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-[#F15A25] rounded-full flex items-center justify-center text-white mr-3">
                <img
                  src={`https://flagcdn.com/w40/${destination.code}.png`}
                  alt={`${destination.name} flag`}
                  className="w-8 rounded-full h-8 object-cover"
                />
              </div>
              <div>
                <h3 className="font-medium">{destination.name}</h3>
                <p className="text-sm text-gray-500">From USD {destination.price}</p>
              </div>
            </div>
            <div className="text-gray-400 group-hover:text-[#F15A25] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}