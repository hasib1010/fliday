'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getEsimUrl } from '@/lib/countrySlugMap';
import { getRegionUrl } from '@/lib/regionSlugMap';

export default function PopularDestinations() {
    const [filterType, setFilterType] = useState('Country');
    const [activeDestination, setActiveDestination] = useState(null);
    const [activeButton, setActiveButton] = useState(null);
    const [activeViewAllButton, setActiveViewAllButton] = useState(false);
    const [countries, setCountries] = useState([]);
    const [regions, setRegions] = useState([]);
    const [filteredDestinations, setFilteredDestinations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Static country data — codes must be uppercase for getEsimUrl
    const staticCountries = [
        { id: 'tr', name: 'Turkey',        code: 'TR', type: 'country', price: '3.99' },
        { id: 'us', name: 'United States', code: 'US', type: 'country', price: '3.99' },
        { id: 'th', name: 'Thailand',      code: 'TH', type: 'country', price: '3.99' },
        { id: 'my', name: 'Malaysia',      code: 'MY', type: 'country', price: '3.99' },
        { id: 'ma', name: 'Morocco',       code: 'MA', type: 'country', price: '3.99' },
        { id: 'it', name: 'Italy',         code: 'IT', type: 'country', price: '3.99' },
        { id: 'es', name: 'Spain',         code: 'ES', type: 'country', price: '3.99' },
        { id: 'id', name: 'Indonesia',     code: 'ID', type: 'country', price: '3.99' },
        { id: 'de', name: 'Germany',       code: 'DE', type: 'country', price: '3.99' },
    ];

    const applyFilter = (countriesList, regionsList, filter) => {
        if (filter === 'Country') return staticCountries;

        let results = [];
        if (filter === 'Region') {
            results = regionsList.filter(d => !d.name.toLowerCase().startsWith('global'));
        } else if (filter === 'Global') {
            results = [...countriesList, ...regionsList].filter(d =>
                d.name.toLowerCase().startsWith('global')
            );
        }
        return results
            .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
            .slice(0, 9);
    };

    useEffect(() => {
        if (filterType === 'Country') {
            setFilteredDestinations(staticCountries);
            setIsLoading(false);
            return;
        }

        const fetchDestinations = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/esim/locations');
                if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
                const data = await response.json();
                if (!data.success) throw new Error(data.message || 'Failed to fetch destinations');

                const formattedCountries = (data.data.countries || []).map((country, i) => ({
                    id: country.id || country.code || `country-${i}`,
                    name: country.name || 'Unknown',
                    code: (country.countryCode || country.code || '').toUpperCase(),
                    type: 'country',
                    price: parseFloat(country.price || 3.99).toFixed(2),
                }));

                const formattedRegions = (data.data.regions || []).map((region, i) => ({
                    id: region.id || region.code || `region-${i}`,
                    name: region.name || 'Unknown',
                    code: (region.code || region.regionCode || '').toLowerCase(),
                    slug: region.slug || '',
                    type: 'region',
                    price: parseFloat(region.price || 7.99).toFixed(2),
                }));

                setCountries(formattedCountries);
                setRegions(formattedRegions);
                setFilteredDestinations(applyFilter(formattedCountries, formattedRegions, filterType));
                setError(null);
            } catch (err) {
                console.error('Error fetching destinations:', err);
                setError(`Failed to load destinations: ${err.message}`);
                setFilteredDestinations([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDestinations();
    }, [filterType]);

    useEffect(() => {
        if (filterType === 'Country') {
            setFilteredDestinations(staticCountries);
            return;
        }
        if (!countries.length && !regions.length) return;
        setFilteredDestinations(applyFilter(countries, regions, filterType));
    }, [filterType, countries, regions]);

    // Generate URL — country uses slug map, region uses regionSlugMap
    const getDestinationUrl = (destination) => {
        if (destination.type === 'country') {
            return getEsimUrl(destination.code);
        }
        if (destination.type === 'region') {
            return getRegionUrl(destination.slug || '', destination.name || '');
        }
        return '#';
    };

    const renderDestinationIcon = (destination) => {
        const isCountry = destination.type === 'country';
        let imageSrc;

        if (isCountry) {
            imageSrc = `/flags/${destination.code.toLowerCase()}_flag.jpeg`;
        } else {
            const name = destination.name.toLowerCase();
            const regionMap = [
                ['north america',  'north_america_flag.svg'],
                ['middle east',    'middle_east_flag.svg'],
                ['global',         'global_flag.svg'],
                ['south america',  'south_america_flag.svg'],
                ['europe',         'europe_flag.svg'],
                ['africa',         'africa_flag.svg'],
                ['asia',           'asia_flag.svg'],
                ['caribbean',      'caribbean_flag.svg'],
                ['gulf',           'middle_east_flag.svg'],
            ];
            const match = regionMap.find(([key]) => name.includes(key));
            imageSrc = `/flags/${match ? match[1] : `${destination.code.split('-')[0]}_flag.svg`}`;
        }

        return (
            <Image
                src={imageSrc}
                alt={`${destination.name} flag`}
                fill
                className="object-cover"
                sizes="36px"
                onError={(e) => { e.target.onerror = null; e.target.src = '/flags/default.jpg'; }}
            />
        );
    };

    const renderSkeletons = () =>
        Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-[#f7f7f8] rounded-lg p-4 animate-pulse">
                <div className="flex items-center">
                    <div className="w-9 h-9 bg-gray-300 rounded-full mr-3" />
                    <div>
                        <div className="h-5 bg-gray-300 rounded w-24 mb-2" />
                        <div className="h-4 bg-gray-300 rounded w-16" />
                    </div>
                </div>
            </div>
        ));

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
                        className={`bg-[#F15A25] hidden lg:block text-white text-center px-[28px] py-[11px] rounded-full text-base font-medium hover:bg-[#e04e1a] transition-colors ${activeViewAllButton ? 'bg-[#e04e1a]' : ''}`}
                        onTouchStart={() => setActiveViewAllButton(true)}
                        onTouchEnd={() => setActiveViewAllButton(false)}
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
                            onTouchStart={() => setActiveButton(type)}
                            onTouchEnd={() => setActiveButton(null)}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* Destinations grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 p-2 gap-4 lg:p-0">
                    {isLoading ? renderSkeletons() : error ? (
                        <div className="col-span-full bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                            {error}
                        </div>
                    ) : filteredDestinations.length > 0 ? (
                        filteredDestinations.map(dest => (
                            <Link
                                key={dest.id}
                                href={getDestinationUrl(dest)}
                                className={`${activeDestination === dest.id ? 'bg-[#d5d5d5]' : 'bg-[#f7f7f8]'} hover:bg-[#d5d5d5] active:bg-[#d5d5d5] transition-colors rounded-lg p-4 flex items-center justify-between min-h-[56px] group`}
                                onTouchStart={() => setActiveDestination(dest.id)}
                                onTouchEnd={() => setActiveDestination(null)}
                            >
                                <div className="flex items-center">
                                    <div className="rounded-full flex items-center justify-center text-white mr-3 overflow-hidden">
                                        <div className="w-[36px] h-[36px] relative overflow-hidden shrink-0 rounded-full">
                                            {renderDestinationIcon(dest)}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-[20px]">{dest.name}</h3>
                                        <p className="text-[16px] text-[#6B6B6B]">From USD {dest.price}</p>
                                    </div>
                                </div>
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
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-6">
                            <p className="text-gray-500">No popular destinations available for this category.</p>
                        </div>
                    )}
                </div>

                <Link
                    href="/destinations"
                    className={`bg-[#F15A25] block w-full md:w-fit mx-auto lg:hidden text-white text-center py-[11px] px-[22px] rounded-full text-[1rem] my-3 font-medium hover:bg-[#e04e1a] transition-colors ${activeViewAllButton ? 'bg-[#e04e1a]' : ''}`}
                    onTouchStart={() => setActiveViewAllButton(true)}
                    onTouchEnd={() => setActiveViewAllButton(false)}
                >
                    View All Destinations
                </Link>
            </div>
        </section>
    );
}