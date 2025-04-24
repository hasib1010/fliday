'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search } from 'lucide-react';

// Debounce hook for search input
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const AllDestinations = () => {
  // State for data
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [filteredDestinations, setFilteredDestinations] = useState([]);
  const [visibleCount, setVisibleCount] = useState(24); // Initial visible items
  
  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [activeFilter, setActiveFilter] = useState('Countries');
  const [activeFilterButton, setActiveFilterButton] = useState(null);
  const [activeDestination, setActiveDestination] = useState(null);

  // Refs to maintain focus
  const searchInputRef = useRef(null);
  
  // Debounce search to prevent excessive filtering
  const debouncedSearchQuery = useDebounce(searchInput, 300);

  // Function to apply filtering logic
  const applyFilter = useMemo(() => {
    return (countriesList, regionsList, filter, query) => {
      let results = [];
      
      if (filter === 'Countries') {
        results = countriesList.filter(dest => !dest.name.toLowerCase().startsWith('global'));
      } else if (filter === 'Regions') {
        results = regionsList.filter(dest => !dest.name.toLowerCase().startsWith('global'));
      } else if (filter === 'Global') {
        results = [...countriesList, ...regionsList].filter(dest =>
          dest.name.toLowerCase().startsWith('global')
        );
      }
      
      if (query) {
        results = results.filter(dest =>
          dest.name.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      return results;
    };
  }, []);

  // Load more destinations
  const loadMore = () => {
    setVisibleCount(prev => prev + 24);
  };

  // Handle search input change
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
  };

  // Fetch locations initially - separate from filter effect
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    
    const fetchLocations = async () => {
      try {
        setIsLoading(true);
        
        // Use cache-control headers for browser caching
        const response = await fetch('/api/esim/locations', { 
          cache: 'force-cache', // Use cached version if available
          next: { revalidate: 3600 }, // Revalidate cache every hour
          signal 
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch locations: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch locations');
        }

        const formattedCountries = (data.data.countries || []).map((country, index) => ({
          id: country.id || country.code || `country-${index}`,
          name: country.name || 'Unknown',
          code: (country.code || country.countryCode || '').toLowerCase(),
          type: 'country',
          price: parseFloat(country.price || 3.99).toFixed(2),
        }));

        const formattedRegions = (data.data.regions || []).map((region, index) => ({
          id: region.id || region.code || `region-${index}`,
          name: region.name || 'Unknown',
          code: (region.code || region.regionCode || '').toLowerCase(),
          slug: region.slug || '',
          type: 'region',
          price: parseFloat(region.price || 7.99).toFixed(2),
        }));

        // Store data in state
        setCountries(formattedCountries);
        setRegions(formattedRegions);
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching locations:', err);
          setError(`Failed to load destinations: ${err.message}. Please try again.`);
          setCountries([]);
          setRegions([]);
          setFilteredDestinations([]);
        }
      } finally {
        // Use requestAnimationFrame for smoother UI updates
        if (!signal.aborted) {
          requestAnimationFrame(() => {
            setIsLoading(false);
          });
        }
      }
    };

    fetchLocations();

    // Cleanup function to abort fetch on unmount
    return () => controller.abort();
  }, []); // Only run on mount

  // Update filtered destinations when filter or search changes - in a separate effect
  useEffect(() => {
    if (countries.length === 0 && regions.length === 0) return;
    
    const results = applyFilter(countries, regions, activeFilter, debouncedSearchQuery);
    setFilteredDestinations(results);
  }, [debouncedSearchQuery, activeFilter, countries, regions, applyFilter]);

  // Touch handlers for mobile
  const handleFilterTouchStart = (filter) => {
    setActiveFilterButton(filter);
  };

  const handleFilterTouchEnd = () => {
    setActiveFilterButton(null);
  };

  const handleDestinationTouchStart = (id) => {
    setActiveDestination(id);
  };

  const handleDestinationTouchEnd = () => {
    setActiveDestination(null);
  };

  // Render flag/icon with optimized image loading
  const renderDestinationIcon = (destination, index) => {
    const isCountry = destination.type === 'country';
    const isPriority = index < 12; // Prioritize first 12 images
    
    if (isCountry) {
      const imageSrc = `/flags/${destination.code}_flag.jpeg`;
      return (
        <Image
          src={imageSrc}
          alt={`${destination.name} flag`}
          fill
          sizes="36px"
          loading={isPriority ? "eager" : "lazy"}
          className="object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/flags/default.jpg';
          }}
        />
      );
    } else {
      let regionFlag = '';
      const name = destination.name.toLowerCase();
      if (name.includes('north america')) {
        regionFlag = 'north_america_flag.svg';
      } else if (name.includes('middle east')) {
        regionFlag = 'middle_east_flag.svg';
      } else if (name.includes('global')) {
        regionFlag = 'global_flag.svg';
      } else if (name.includes('south america')) {
        regionFlag = 'south_america_flag.svg';
      } else if (name.includes('europe')) {
        regionFlag = 'europe_flag.svg';
      } else if (name.includes('africa')) {
        regionFlag = 'africa_flag.svg';
      } else if (name.includes('asia')) {
        regionFlag = 'asia_flag.svg';
      } else if (name.includes('caribbean')) {
        regionFlag = 'caribbean_flag.svg';
      } else if (name.includes('gulf')) {
        regionFlag = 'middle_east_flag.svg';
      } else if (name.includes('china') || name.includes('singapore') || name.includes('thailand')) {
        regionFlag = 'asia_flag.svg';
      } else {
        regionFlag = `${destination.code.split('-')[0]}_flag.svg`;
      }
      
      return (
        <Image
          src={`/flags/${regionFlag}`}
          alt={`${destination.name} flag`}
          fill
          sizes="36px"
          loading={isPriority ? "eager" : "lazy"}
          className="object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/flags/default.jpg';
          }}
        />
      );
    }
  };

  // Generate appropriate destination URL
  const getDestinationUrl = (destination) => {
    if (destination.type === 'country') {
      return `/destinations/country/${destination.code}`;
    } else if (destination.type === 'region') {
      if (destination.slug) {
        return `/destinations/slug/${destination.slug}`;
      }
      return `/destinations/region/${destination.code}`;
    }
    return '#';
  };

  // Render skeleton during loading
  const renderSkeletons = () => {
    return Array.from({ length: 12 }).map((_, index) => (
      <div key={index} className="bg-[#f7f7f8] rounded-lg p-4 animate-pulse">
        <div className="flex items-center">
          <div className="w-[36px] h-[36px] bg-gray-300 rounded-full mr-3"></div>
          <div>
            <div className="h-5 bg-gray-300 rounded w-24 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-16"></div>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="max-w-[1220px] mx-auto pt-32 px-3 lg:px-0">
      <h1 className="lg:text-[40px] text-3xl font-medium mb-2">All destinations</h1>
      <p className="text-gray-600 mb-6">Explore eSIM plans in 100+ countries.</p>

      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-6">
          Loading available destinations...
        </div>
      )}

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex md:flex-row flex-wrap gap-3 mb-6">
        {['Countries', 'Regions', 'Global'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === filter
                ? 'bg-black text-white'
                : `bg-white text-black hover:bg-[#E2E2E4] active:bg-[#E2E2E4] cursor-pointer border border-gray-200 ${
                    activeFilterButton === filter ? 'bg-[#E2E2E4]' : ''
                  }`
            }`}
            onTouchStart={() => handleFilterTouchStart(filter)}
            onTouchEnd={handleFilterTouchEnd}
            disabled={isLoading}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Search box with debounced input */}
      <div className="mb-8 relative">
        <input
          type="text"
          placeholder="Enter your destination"
          value={searchInput}
          onChange={handleSearchInputChange}
          className="w-full px-4 py-3 pr-12 rounded-full border border-[#F15A25] focus:outline-none focus:ring-2 focus:ring-[#F15A25]"
          disabled={isLoading}
          ref={searchInputRef}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-[#F15A25] p-2 rounded-full text-white">
          <Search size={18} />
        </div>
      </div>

      {/* Destinations grid with lazy loading */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          renderSkeletons()
        ) : filteredDestinations.slice(0, visibleCount).length > 0 ? (
          filteredDestinations.slice(0, visibleCount).map((destination, index) => (
            <Link
              key={destination.id}
              href={getDestinationUrl(destination)}
              prefetch={false}
              className={`hover:bg-[#d5d5d5] active:bg-[#d5d5d5] ${
                activeDestination === destination.id ? 'bg-[#d5d5d5]' : 'bg-[#f7f7f8]'
              } transition-colors rounded-lg p-4 flex items-center justify-between group`}
              onTouchStart={() => handleDestinationTouchStart(destination.id)}
              onTouchEnd={handleDestinationTouchEnd}
            >
              <div className="flex items-center">
                <div className="rounded-full w-[60px] flex items-start justify-center text-white mr-3 overflow-hidden">
                  <div className="w-[36px] h-[36px] relative overflow-hidden shrink-0 rounded-full">
                    {renderDestinationIcon(destination, index)}
                    <div className="absolute inset-0 border-[1px] border-[rgba(0,0,0,0.1)] rounded-full pointer-events-none" />
                  </div>
                </div>
                <div>
                  <h3 className="font-medium lg:text-[20px] text-[1.25rem]">{destination.name}</h3>
                  <p className="text-[16px] text-[#6B6B6B]">From USD {destination.price}</p>
                </div>
              </div>
              <div className="text-gray-400">
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
          ))
        ) : (
          <div className="col-span-full py-6 text-center">
            <p className="text-gray-500">No destinations found matching your search criteria.</p>
          </div>
        )}
      </div>

      {/* Load more button - only if there are more items to load */}
      {filteredDestinations.length > visibleCount && (
        <div className="text-center mt-8 mb-12">
          <button 
            onClick={loadMore} 
            className="bg-[#F15A25] text-white px-6 py-2 rounded-full hover:bg-[#d14415] transition-colors"
          >
            Load More Destinations
          </button>
        </div>
      )}
    </div>
  );
};

export default AllDestinations;