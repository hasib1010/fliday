'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Search, Loader2 } from 'lucide-react';

export default function Hero() {
    const [searchInput, setSearchInput] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false);
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

    // Handle search input changes
    const handleSearchChange = async (e) => {
        const value = e.target.value;
        setSearchInput(value);

        if (value.length >= 2) {
            setLoading(true);
            setShowResults(true);
            
            try {
                const response = await fetch('/api/esim/locations');
                const data = await response.json();
                
                if (data.success) {
                    // Combine countries and regions
                    const allDestinations = [...data.data.countries, ...data.data.regions];
                    
                    // Filter based on search input
                    const filteredResults = allDestinations.filter(dest => 
                        dest.name.toLowerCase().includes(value.toLowerCase())
                    ).slice(0, 6); // Limit to 6 results for dropdown
                    
                    setSearchResults(filteredResults);
                }
            } catch (error) {
                console.error('Error searching destinations:', error);
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
                <div className="md:pt-[85px] pt-36">
                    {/* Feature badges */}
                    <div className="md:py-9 py-3 block relative w-full px-1">
                        <div className="flex justify-center mb-10 md:mb-0 items-center">
                            {/* Instant Setup */}
                            <div className="relative z-10 flex items-center lg:gap-2 gap-0.5 lg:px-[19px] px-2 md:py-2.5 py-3 lg:py-[12px] -rotate-[7.775deg] border border-orange-500 rounded-full bg-[#F4EBE8] shadow mr-[-16px]">
                                <div className="md:w-6 md:h-6 w-4 h-4 p-0.5 bg-orange-500 rounded-full flex items-center justify-center text-white">
                                    <Check />
                                </div>
                                <span className="text-[18px] max-[426px]:text-[13px] max-[376px]:text-[12px] max-[321px]:text-[10px] font-medium text-gray-800">
                                    Instant Setup
                                </span>
                            </div>

                            {/* Global Coverage */}
                            <div className="relative z-20 flex items-center lg:gap-2 gap-0.5 lg:px-[19px] px-2 md:py-2.5 py-3 lg:py-[12px] border border-orange-500 rounded-full bg-[#F4EBE8] shadow rotate-[7.871deg] ml-[10px]">
                                <div className="md:w-6 md:h-6 w-4 h-4 p-0.5 bg-orange-500 rounded-full flex items-center justify-center text-white">
                                    <Check />
                                </div>
                                <span className="text-[18px] max-[426px]:text-[13px] max-[376px]:text-[12px] max-[321px]:text-[10px] font-medium text-gray-800">
                                    Global Coverage
                                </span>
                            </div>

                            {/* No Roaming */}
                            <div className="relative z-10 flex items-center lg:gap-2 gap-0.5 lg:px-[19px] px-2 md:py-2.5 py-3 lg:py-[12px] border border-orange-500 rounded-full bg-[#F4EBE8] shadow ml-[-10px] -rotate-[4.268deg]">
                                <div className="md:w-6 md:h-6 w-4 h-4 p-0.5 bg-orange-500 rounded-full flex items-center justify-center text-white">
                                    <Check />
                                </div>
                                <span className="text-[18px] max-[426px]:text-[13px] max-[376px]:text-[12px] max-[321px]:text-[10px] font-medium text-gray-800">
                                    No Roaming
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Heading */}
                    <h1 className="text-center lg:text-[55px] text-3xl md:text-5xl lg:text-6xl font-semibold pb-8">
                        eSIM for the <span className="text-[#F15A25]">Bold</span> & <span className="text-[#F15A25]">the Curious.</span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-center text-xl pb-6">Where do you need connectivity?</p>

                    {/* Search box with results dropdown */}
                    <div className="max-w-xl px-1.5 mx-auto mb-36 relative" ref={searchRef}>
                        <form onSubmit={handleSearchSubmit}>
                            <input
                                type="text"
                                placeholder="Enter your destination"
                                className="w-full px-6 py-4 rounded-full border-2 border-[#F15A25] bg-white focus:outline-none focus:ring-1 focus:ring-[#F15A25] text-lg"
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
                                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                                <span className="text-xs font-bold text-gray-500">
                                                                    {destination.name.substring(0, 2)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{destination.name}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {destination.type === 'country' ? 'Country' : 'Region'} • From ${destination.price}
                                                        </p>
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