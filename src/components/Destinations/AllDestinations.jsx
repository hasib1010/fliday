'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

export default function AllDestinations() {
  const [activeFilter, setActiveFilter] = useState('Countries');
  const [searchQuery, setSearchQuery] = useState('');
  
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
    // Duplicate them to match the reference image with multiple countries
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
  ];
  
  // Filter destinations based on search query
  const filteredDestinations = destinations.filter(destination => 
    destination.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">All destinations</h1>
      <p className="text-gray-600 mb-6">Explore eSIM plans in 100+ countries.</p>
      
      {/* Filter tabs */}
      <div className="flex gap-3 mb-6">
        {['Countries', 'Regions', 'Global'].map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === filter 
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
          className="w-full px-4 py-3 pr-12 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F15A25]"
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
            className="bg-white rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow group"
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