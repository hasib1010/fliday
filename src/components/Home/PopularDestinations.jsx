'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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

    // Static country data
    const staticCountries = [
        {
            id: 'tr',
            name: 'Turkey',
            code: 'tr',
            type: 'country',
            price: '3.99',
        },
        {
            id: 'us',
            name: 'United States',
            code: 'us',
            type: 'country',
            price: '3.99',
        },
        {
            id: 'th',
            name: 'Thailand',
            code: 'th',
            type: 'country',
            price: '3.99',
        },
        {
            id: 'my',
            name: 'Malaysia',
            code: 'my',
            type: 'country',
            price: '3.99',
        },
        {
            id: 'ma',
            name: 'Morocco',
            code: 'ma',
            type: 'country',
            price: '3.99',
        },
        {
            id: 'it',
            name: 'Italy',
            code: 'it',
            type: 'country',
            price: '3.99',
        },
        {
            id: 'es',
            name: 'Spain',
            code: 'es',
            type: 'country',
            price: '3.99',
        },
        {
            id: 'id',
            name: 'Indonesia',
            code: 'id',
            type: 'country',
            price: '3.99',
        },
        {
            id: 'de',
            name: 'Germany',
            code: 'de',
            type: 'country',
            price: '3.99',
        },
    ];

    // Function to apply filtering logic
    const applyFilter = (countriesList, regionsList, filter) => {
        let results = [];

        if (filter === 'Country') {
            // For Country tab, use static countries
            return staticCountries;
        } else if (filter === 'Region') {
            results = regionsList.filter(dest => !dest.name.toLowerCase().startsWith('global'));
        } else if (filter === 'Global') {
            results = [...countriesList, ...regionsList].filter(dest =>
                dest.name.toLowerCase().startsWith('global')
            );
        }

        // Sort by price (lowest to highest) and limit to 9 destinations
        results = results
            .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
            .slice(0, 9);

        return results;
    };

    // Fetch destinations dynamically (only for Regions and Global)
    useEffect(() => {
        const fetchDestinations = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/esim/locations');

                if (!response.ok) {
                    throw new Error(`Failed to fetch destinations: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.message || 'Failed to fetch destinations');
                }

                // We'll still keep this for other tabs
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

                setCountries(formattedCountries);
                setRegions(formattedRegions);

                // Apply initial filter
                const initialFiltered = applyFilter(formattedCountries, formattedRegions, filterType);
                setFilteredDestinations(initialFiltered);
                setError(null);
            } catch (err) {
                console.error('Error fetching destinations:', err);
                setError(`Failed to load popular destinations: ${err.message}. Please try again.`);
                
                // If we have an error loading dynamic content but we're on the Country tab,
                // we can still show the static countries
                if (filterType === 'Country') {
                    setFilteredDestinations(staticCountries);
                    setError(null);
                } else {
                    setRegions([]);
                    setFilteredDestinations([]);
                }
            } finally {
                setIsLoading(false);
            }
        };

        // If we're on the Country tab, just use static data immediately
        if (filterType === 'Country') {
            setFilteredDestinations(staticCountries);
            setIsLoading(false);
        } else {
            fetchDestinations();
        }
    }, [filterType]);

    // Update filtered destinations when filterType changes
    useEffect(() => {
        if (filterType === 'Country') {
            setFilteredDestinations(staticCountries);
            setIsLoading(false);
            return;
        }
        
        if (countries.length === 0 && regions.length === 0) return;

        const results = applyFilter(countries, regions, filterType);
        setFilteredDestinations(results);
    }, [filterType, countries, regions]);

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

    // Render destination icon (flag for countries, SVG for regions/global)
    const renderDestinationIcon = (destination) => {
        const isCountry = destination.type === 'country';

        if (isCountry) {
            const imageSrc = `/flags/${destination.code}_flag.jpeg`;
            return (
                <Image
                    src={imageSrc}
                    alt={`${destination.name} flag`}
                    fill
                    className="object-cover"
                    sizes="100vw"
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
                    className="object-cover"
                    sizes="100vw"
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

    // Render skeleton loading placeholders
    const renderSkeletons = () => {
        return Array.from({ length: 9 }).map((_, index) => (
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
                    {isLoading ? (
                        renderSkeletons()
                    ) : error ? (
                        <div className="col-span-full bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                            {error}
                        </div>
                    ) : filteredDestinations.length > 0 ? (
                        filteredDestinations.map(dest => (
                            <Link
                                key={dest.id}
                                href={getDestinationUrl(dest)}
                                className={`${
                                    activeDestination === dest.id ? 'bg-[#d5d5d5]' : 'bg-[#f7f7f8]'
                                } hover:bg-[#d5d5d5] active:bg-[#d5d5d5] transition-colors rounded-lg p-4 flex items-center justify-between min-h-[56px] group`}
                                onTouchStart={() => handleTouchStart(dest.id)}
                                onTouchEnd={handleTouchEnd}
                            >
                                <div className="flex items-center ">
                                    <div className="rounded-full flex items-center justify-center text-white mr-3 overflow-hidden">
                                        <div className="w-[36px] h-[36px] relative overflow-hidden shrink-0 rounded-full">
                                            {renderDestinationIcon(dest)}
                                           
                                        </div>
                                    </div>
                                    <div className='flex-1'>
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
                        ))
                    ) : (
                        <div className="col-span-full text-center py-6">
                            <p className="text-gray-500">No popular destinations available for this category.</p>
                        </div>
                    )}
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