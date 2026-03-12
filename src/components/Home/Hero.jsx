'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Search, Loader2, AlertCircle } from 'lucide-react';

import { Libre_Baskerville } from "next/font/google";

export const libre = Libre_Baskerville({
    weight: ["400", "700"],
    style: ["normal", "italic"],
    subsets: ["latin"],
});

export default function Hero() {
    const [searchInput, setSearchInput] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const searchRef = useRef(null);
    const router = useRouter();

    // Handle clicks outside of the search results
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Function to format destination prices
    const formatDestinationPrice = (destination) => {
        // Use the price from API if it has a packageCode (meaning it's from the API's lowest price calculation)
        if (destination.packageCode) {
            return destination.price;
        }

        // Default fallback
        return parseFloat(destination.price || 3.99).toFixed(2);
    };

    // Handle search input changes
    const handleSearchChange = async (e) => {
        const value = e.target.value;
        setSearchInput(value);

        if (value.length >= 2) {
            setLoading(true);
            setShowResults(true);
            setError(null);

            try {
                // Use skipCache to ensure fresh data, especially after admin price updates
                const response = await fetch('/api/esim/locations?skipCache=true', {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch destinations: ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    // Store last updated time if available
                    if (data.data.pricingInfo?.lastUpdated) {
                        setLastUpdated(new Date(data.data.pricingInfo.lastUpdated).toLocaleString());
                    } else if (data.data.cachedAt) {
                        setLastUpdated(new Date(data.data.cachedAt).toLocaleString());
                    }

                    // Format the destinations with enhanced price data
                    const formattedCountries = (data.data.countries || []).map(country => ({
                        id: country.id || country.code,
                        name: country.name || 'Unknown',
                        code: (country.code || country.countryCode || '').toLowerCase(),
                        type: 'country',
                        price: country.price || '3.99',
                        retailPriceRaw: country.retailPriceRaw,
                        packageCode: country.packageCode || '',
                        hasCustomPricing: country.hasCustomPricing || false
                    }));

                    const formattedRegions = (data.data.regions || []).map(region => ({
                        id: region.id || region.code,
                        name: region.name || 'Unknown',
                        code: (region.code || region.regionCode || '').toLowerCase(),
                        type: 'region',
                        price: region.price || '7.99',
                        retailPriceRaw: region.retailPriceRaw,
                        packageCode: region.packageCode || '',
                        slug: region.slug || '',
                        hasCustomPricing: region.hasCustomPricing || false
                    }));

                    // Combine countries and regions
                    const allDestinations = [...formattedCountries, ...formattedRegions];

                    // Filter based on search input
                    const filteredResults = allDestinations
                        .filter(dest => dest.name.toLowerCase().includes(value.toLowerCase()))
                        .sort((a, b) => {
                            // Sort by relevance (exact matches first)
                            const aExact = a.name.toLowerCase() === value.toLowerCase();
                            const bExact = b.name.toLowerCase() === value.toLowerCase();
                            if (aExact && !bExact) return -1;
                            if (!aExact && bExact) return 1;

                            // Then sort by starts with
                            const aStartsWith = a.name.toLowerCase().startsWith(value.toLowerCase());
                            const bStartsWith = b.name.toLowerCase().startsWith(value.toLowerCase());
                            if (aStartsWith && !bStartsWith) return -1;
                            if (!aStartsWith && bStartsWith) return 1;

                            // Finally sort by price (lowest first)
                            return parseFloat(a.price) - parseFloat(b.price);
                        })
                        .slice(0, 6); // Limit to 6 results for dropdown

                    setSearchResults(filteredResults);
                } else {
                    setError(data.message || 'Failed to fetch destinations');
                }
            } catch (error) {
                console.error('Error searching destinations:', error);
                setError('Failed to search destinations. Please try again.');
            } finally {
                setLoading(false);
            }
        } else {
            setShowResults(false);
        }
    };

    // Handle search form submission
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchInput.trim()) {
            router.push(`/destinations?search=${encodeURIComponent(searchInput)}`);
        }
    };

    // Handle clicking on a search result
    const handleResultClick = (destination) => {
        setShowResults(false);

        // Determine URL based on destination type
        let url;
        if (destination.type === 'country') {
            url = `/destinations/country/${destination.code}`;
        } else if (destination.type === 'region') {
            url = destination.slug
                ? `/destinations/slug/${destination.slug}`
                : `/destinations/region/${destination.code}`;
        }

        router.push(url);
    };

    // Function to get region flag
    const getRegionFlag = (destination) => {
        const name = destination.name.toLowerCase();

        if (name.includes('north america')) {
            return 'north_america_flag.svg';
        } else if (name.includes('middle east')) {
            return 'middle_east_flag.svg';
        } else if (name.includes('global')) {
            return 'global_flag.svg';
        } else if (name.includes('south america')) {
            return 'south_america_flag.svg';
        } else if (name.includes('europe')) {
            return 'europe_flag.svg';
        } else if (name.includes('africa')) {
            return 'africa_flag.svg';
        } else if (name.includes('asia')) {
            return 'asia_flag.svg';
        } else if (name.includes('caribbean')) {
            return 'caribbean_flag.svg';
        } else if (name.includes('gulf')) {
            return 'middle_east_flag.svg';
        } else if (name.includes('china') || name.includes('singapore') || name.includes('thailand')) {
            return 'asia_flag.svg';
        }

        return `${destination.code.split('-')[0]}_flag.svg`;
    };

    return (
        <div className="relative bg-[#f8f4f4]">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <div className="block md:hidden relative h-[400px]">
                    <Image
                        src="/hero2.png"
                        alt="Hero Background Mobile"
                        fill
                        style={{ objectFit: 'contain', objectPosition: 'bottom' }}
                        priority
                    />
                </div>

                <div className="md:block lg:hidden">
                    <Image
                        src="/hero2.png"
                        alt="Hero Background Mobile"
                        fill
                        style={{ objectFit: 'cover', objectPosition: 'bottom' }}
                        priority
                    />
                </div>

                <div className="hidden xl:block 2xl:hidden ">
                    <Image
                        src="/hero.png"
                        alt="Hero Background Desktop"
                        fill
                        style={{ objectFit: 'cover', objectPosition: 'bottom' }}
                        priority
                    />
                </div>

                <div className="hidden 2xl:block [min-width:1921px]:hidden">
                    <Image
                        src="/hero.png"
                        alt="Hero Background Desktop"
                        fill
                        style={{ objectFit: 'contain', objectPosition: 'bottom' }}
                        priority
                    />
                </div>

                <div className="hidden lg:block xl:hidden">
                    <Image
                        src="/hero2.png"
                        alt="Hero Background Desktop"
                        fill
                        style={{ objectFit: 'cover', objectPosition: 'bottom' }}
                        priority
                    />
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 w-full flex items-start justify-center min-h-[710px]">
                <div className="md:pt-[85px] pt-24">
                    {/* Feature badges */}
                    <div className="md:py-9 py-3 block relative w-full px-1">
                        <div className="flex justify-center mb-10 md:mb-0 items-center">
                            {/* Instant Setup */}
                            <div className="relative z-10 flex items-center lg:gap-2 gap-0.5 lg:px-[19px] px-2 md:py-2.5 py-3 lg:py-[12px] -rotate-[7.775deg] border border-orange-500 rounded-full bg-[#F4EBE8] shadow mr-[-16px]">
                                <div className="md:w-6 md:h-6 w-4 h-4 p-0.5 bg-orange-500 rounded-full flex items-center justify-center text-white">
                                    <Check />
                                </div>
                                <span className="text-[14px] md:text-[16px] lg:text-[18px] max-[426px]:text-[13px] max-[376px]:text-[12px] max-[321px]:text-[10px] font-medium text-gray-800">
                                    Instant Setup
                                </span>
                            </div>

                            {/* Global Coverage */}
                            <div className="relative z-20 flex items-center lg:gap-2 gap-0.5 lg:px-[19px] px-2 md:py-2.5 py-3 lg:py-[12px] border border-orange-500 rounded-full bg-[#F4EBE8] shadow rotate-[7.871deg] ml-[10px]">
                                <div className="md:w-6 md:h-6 w-4 h-4 p-0.5 bg-orange-500 rounded-full flex items-center justify-center text-white">
                                    <Check />
                                </div>
                                <span className="text-[14px] md:text-[16px] lg:text-[18px] max-[426px]:text-[13px] max-[376px]:text-[12px] max-[321px]:text-[10px] font-medium text-gray-800">
                                    Global Coverage
                                </span>
                            </div>

                            {/* No Roaming */}
                            <div className="relative z-10 flex items-center lg:gap-2 gap-0.5 lg:px-[19px] px-2 md:py-2.5 py-3 lg:py-[12px] border border-orange-500 rounded-full bg-[#F4EBE8] shadow ml-[-10px] -rotate-[4.268deg]">
                                <div className="md:w-6 md:h-6 w-4 h-4 p-0.5 bg-orange-500 rounded-full flex items-center justify-center text-white">
                                    <Check />
                                </div>
                                <span className="text-[14px] md:text-[16px] lg:text-[18px] max-[426px]:text-[13px] max-[376px]:text-[12px] max-[321px]:text-[10px] font-medium text-gray-800">
                                    No Roaming
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Heading */}
                    <h1 className="text-center text-[36px] sm:text-[44px] lg:text-[52px] font-semibold pb-8">
                        Stay Connected{" "}
                        <span className="relative inline-block">
                            <span className={`${libre.className} text-[#F15A25] italic`}>
                                Everywhere
                            </span>

                            <svg
                                className="absolute left-0 -bottom-3 w-full h-5"
                                viewBox="0 0 160 28"
                                fill="none"
                                preserveAspectRatio="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M6 18C22 24 38 22 54 18C70 14 86 10 102 13C118 16 132 22 154 16"
                                    stroke="#F15A25"
                                    strokeWidth="5"
                                    strokeLinecap="round"
                                    className="brush-underline"
                                />
                                <path
                                    d="M8 20C24 26 40 24 56 20C72 16 88 12 104 15C120 18 134 24 152 18"
                                    stroke="#F15A25"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeOpacity="0.55"
                                    className="brush-underline brush-underline-delay"
                                />
                            </svg>
                        </span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-center text-xl pb-6">Where do you need connectivity?</p>

                    {/* Search box with results dropdown */}
                    <div className="max-w-xl px-1.5 mx-auto mb-36 relative" ref={searchRef}>
                        <form onSubmit={handleSearchSubmit}>
                            <input
                                type="text"
                                placeholder="Enter your destination"
                                className="w-full px-6 py-4 rounded-full border-2 border-[#F15A25] bg-white focus:outline-none focus:ring-1 focus:ring-[#F15A25] text-base md:text-lg"
                                value={searchInput}
                                onChange={handleSearchChange}
                                onClick={() => searchInput.length >= 2 && setShowResults(true)}
                            />
                            <button
                                type="submit"
                                className="absolute right-5 top-1/2 transform -translate-y-1/2 bg-[#F15A25] p-3 rounded-full text-white"
                            >
                                {loading ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <Search size={20} />
                                )}
                            </button>
                        </form>

                        {/* Search results dropdown */}
                        {showResults && (
                            <div className="absolute w-full mt-2 p-2 bg-white border border-gray-200 shadow-lg rounded-lg z-30 max-h-[350px] overflow-y-auto">
                                {loading ? (
                                    <div className="flex justify-center items-center py-4">
                                        <Loader2 size={24} className="animate-spin text-[#F15A25]" />
                                    </div>
                                ) : error ? (
                                    <div className="flex items-center justify-center gap-2 py-3 text-center text-yellow-700">
                                        <AlertCircle size={16} />
                                        <span>{error}</span>
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    <ul>
                                        {searchResults.map((destination) => (
                                            <li
                                                key={`${destination.type}-${destination.id}`}
                                                className="hover:bg-gray-50 cursor-pointer transition-colors py-2 px-3 rounded-md"
                                                onClick={() => handleResultClick(destination)}
                                            >
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 relative rounded-full overflow-hidden mr-3 border border-gray-200">
                                                        {destination.type === 'country' ? (
                                                            <Image
                                                                src={`/flags/${destination.code}_flag.jpeg`}
                                                                alt={destination.name}
                                                                fill
                                                                sizes="32px"
                                                                className="object-cover"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = '/flags/default.jpg';
                                                                }}
                                                            />
                                                        ) : (
                                                            <Image
                                                                src={`/flags/${getRegionFlag(destination)}`}
                                                                alt={destination.name}
                                                                fill
                                                                sizes="32px"
                                                                className="object-cover"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = '/flags/default.jpg';
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium">{destination.name}</p>
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm text-gray-500">
                                                                {destination.type === 'country' ? 'Country' : 'Region'} • From ${formatDestinationPrice(destination)}
                                                            </p>

                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}


                                    </ul>
                                ) : (
                                    <p className="text-center py-3 text-gray-500">No destinations found</p>
                                )}

                                <div className="border-t mt-2 pt-2 text-center">
                                    <Link
                                        href="/destinations"
                                        className="text-[#F15A25] text-sm font-medium hover:underline"
                                    >
                                        View all destinations
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}