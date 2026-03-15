'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { getRegionUrl } from '@/lib/regionSlugMap';

// Debounce hook for search input
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// ─── Dynamic slug generation from country NAME ────────────────────────────────
// Overrides for names that don't slugify cleanly or have well-known short forms
const NAME_OVERRIDES = {
  'united states':                          'usa',
  'united states of america':               'usa',
  'united arab emirates':                   'uae',
  'south korea':                            'south-korea',
  'republic of korea':                      'south-korea',
  'north korea':                            'north-korea',
  "democratic people's republic of korea":  'north-korea',
  'czech republic':                         'czechia',
  "cote d'ivoire":                          'ivory-coast',
  "côte d'ivoire":                          'ivory-coast',
  'ivory coast':                            'ivory-coast',
  'trinidad and tobago':                    'trinidad-tobago',
  'bosnia and herzegovina':                 'bosnia',
  'north macedonia':                        'north-macedonia',
  'papua new guinea':                       'papua-new-guinea',
  'china mainland':                         'china-mainland',
  'hong kong (china)':                      'hong-kong',
  'macao (china)':                          'macao',
  'virgin islands- british':                'virgin-islands-british',
  'brunei darussalam':                      'brunei',
  'democratic republic of the congo':       'democratic-republic-of-the-congo',
  'republic of the congo':                  'republic-of-the-congo',
  'central african republic':               'central-african-republic',
  'saint kitts and nevis':                  'saint-kitts-and-nevis',
  'saint vincent and the grenadines':       'saint-vincent-and-the-grenadines',
  'saint pierre and miquelon':              'saint-pierre-and-miquelon',
  'sao tome and principe':                  'sao-tome-and-principe',
  'svalbard and jan mayen':                 'svalbard',
  'wallis and futuna':                      'wallis-and-futuna',
  'antigua and barbuda':                    'antigua-and-barbuda',
  'turks and caicos islands':               'turks-and-caicos-islands',
  'cayman islands':                         'cayman-islands',
  'solomon islands':                        'solomon-islands',
  'marshall islands':                       'marshall-islands',
  'virgin islands- us':                     'us-virgin-islands',
  'us virgin islands':                      'us-virgin-islands',
  'northern mariana islands':               'northern-mariana-islands',
  'faroe islands':                          'faroe-islands',
  'aland islands':                          'aland-islands',
  'cape verde':                             'cape-verde',
  'guinea-bissau':                          'guinea-bissau',
  'equatorial guinea':                      'equatorial-guinea',
  'sierra leone':                           'sierra-leone',
  'burkina faso':                           'burkina-faso',
  'south africa':                           'south-africa',
  'south sudan':                            'south-sudan',
  'saudi arabia':                           'saudi-arabia',
  'sri lanka':                              'sri-lanka',
  'new zealand':                            'new-zealand',
  'new caledonia':                          'new-caledonia',
  'french guiana':                          'french-guiana',
  'french polynesia':                       'french-polynesia',
  'costa rica':                             'costa-rica',
  'puerto rico':                            'puerto-rico',
  'dominican republic':                     'dominican-republic',
  'el salvador':                            'el-salvador',
  'isle of man':                            'isle-of-man',
  'timor-leste':                            'timor-leste',
  'united kingdom':                         'united-kingdom',
};

/**
 * Convert a country name from the API into a URL slug.
 * 1. Check NAME_OVERRIDES for exact match (handles edge cases)
 * 2. Otherwise: lowercase → strip accents → strip special chars → spaces to hyphens
 */
const nameToSlug = (name) => {
  if (!name) return '';
  const lower = name.toLowerCase().trim();
  if (NAME_OVERRIDES[lower]) return NAME_OVERRIDES[lower];
  return lower
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // strip accent marks (ç→c, é→e, etc.)
    .replace(/[''`]/g, '')             // strip apostrophes
    .replace(/[^a-z0-9\s-]/g, '')     // strip remaining special chars
    .trim()
    .replace(/\s+/g, '-');            // spaces → hyphens
};

const getCountryUrl = (name) => {
  const slug = nameToSlug(name);
  return slug ? `/esim-country/${slug}` : '#';
};
// ─────────────────────────────────────────────────────────────────────────────

const AllDestinations = () => {
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [filteredDestinations, setFilteredDestinations] = useState([]);
  const [visibleCount, setVisibleCount] = useState(24);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [activeFilter, setActiveFilter] = useState('Countries');
  const [activeFilterButton, setActiveFilterButton] = useState(null);
  const [activeDestination, setActiveDestination] = useState(null);

  const searchInputRef = useRef(null);
  const debouncedSearchQuery = useDebounce(searchInput, 300);

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

  const loadMore = () => setVisibleCount(prev => prev + 24);
  const handleSearchInputChange = (e) => setSearchInput(e.target.value);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchLocations = async () => {
      try {
        setIsLoading(true);

        const response = await fetch('/api/esim/locations?skipCache=true', {
          cache: 'no-store',
          signal,
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
          // lowercase code is used only for flag image filenames
          code: (country.code || country.countryCode || '').toLowerCase(),
          type: 'country',
          price: parseFloat(country.price || 3.99).toFixed(2),
          packageCode: country.packageCode || '',
          // Pre-compute the SEO URL from the API name — no static map needed
          url: getCountryUrl(country.name),
        }));

        const formattedRegions = (data.data.regions || []).map((region, index) => ({
          id: region.id || region.code || `region-${index}`,
          name: region.name || 'Unknown',
          code: (region.code || region.regionCode || '').toLowerCase(),
          slug: region.slug || '',
          type: 'region',
          price: parseFloat(region.price || 7.99).toFixed(2),
          packageCode: region.packageCode || '',
          // Pre-compute SEO URL — uses name for slug, original API slug as ?s= param
          url: getRegionUrl(region.slug || '', region.name || ''),
        }));

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
        if (!signal.aborted) {
          requestAnimationFrame(() => setIsLoading(false));
        }
      }
    };

    fetchLocations();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (countries.length === 0 && regions.length === 0) return;
    const results = applyFilter(countries, regions, activeFilter, debouncedSearchQuery);
    setFilteredDestinations(results);
  }, [debouncedSearchQuery, activeFilter, countries, regions, applyFilter]);

  const handleFilterTouchStart = (filter) => setActiveFilterButton(filter);
  const handleFilterTouchEnd = () => setActiveFilterButton(null);
  const handleDestinationTouchStart = (id) => setActiveDestination(id);
  const handleDestinationTouchEnd = () => setActiveDestination(null);

  // ── Generate the correct URL per destination ──────────────────────────────
  const getDestinationUrl = (destination) => {
    // url is pre-computed for both countries and regions during data load
    return destination.url || '#';
  };
  // ─────────────────────────────────────────────────────────────────────────

  const renderDestinationIcon = (destination, index) => {
    const isCountry = destination.type === 'country';
    const isPriority = index < 12;

    if (isCountry) {
      return (
        <Image
          src={`/flags/${destination.code}_flag.jpeg`}
          alt={`${destination.name} flag`}
          fill
          sizes="36px"
          loading={isPriority ? 'eager' : 'lazy'}
          className="object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/flags/default.jpg';
          }}
        />
      );
    } else {
      const name = destination.name.toLowerCase();
      const regionFlag =
        name.includes('north america') ? 'north_america_flag.svg' :
        name.includes('middle east')   ? 'middle_east_flag.svg'   :
        name.includes('global')        ? 'global_flag.svg'        :
        name.includes('south america') ? 'south_america_flag.svg' :
        name.includes('europe')        ? 'europe_flag.svg'        :
        name.includes('africa')        ? 'africa_flag.svg'        :
        name.includes('asia')          ? 'asia_flag.svg'          :
        name.includes('caribbean')     ? 'caribbean_flag.svg'     :
        name.includes('gulf')          ? 'middle_east_flag.svg'   :
        `${destination.code.split('-')[0]}_flag.svg`;

      return (
        <Image
          src={`/flags/${regionFlag}`}
          alt={`${destination.name} flag`}
          fill
          sizes="36px"
          loading={isPriority ? 'eager' : 'lazy'}
          className="object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/flags/default.jpg';
          }}
        />
      );
    }
  };

  const renderSkeletons = () =>
    Array.from({ length: 12 }).map((_, index) => (
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

      {/* Search box */}
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

      {/* Destinations grid */}
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

      {/* Load more */}
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