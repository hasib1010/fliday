'use client';
// src/app/destinations/slug/[slug]/page.jsx
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, Info, ChevronLeft } from 'lucide-react';
import FAQSection from '@/components/Home/FAQSection';
import BenefitsSection from '@/components/Home/BenefitsSection';
import SetupProcess from '@/components/Home/SetupProcess';
import Link from 'next/link';
import RegionImage from '../../region/[code]/RegionImage';

export default function RegionSlugDetail() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug || '';

    // State for API data
    const [regionName, setRegionName] = useState('');
    const [regionCode, setRegionCode] = useState('');
    const [regionCountries, setRegionCountries] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State to track selected plan and active tab
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [activeTab, setActiveTab] = useState('features');

    // Fetch region data and packages
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch packages using the slug
                const response = await fetch(`/api/esim/packages?slug=${slug}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch packages: ${response.status}`);
                }

                const data = await response.json();

                if (!data.success) {
                    throw new Error(data.errorMsg || 'Failed to fetch packages');
                }

                if (!data.obj?.packageList || data.obj.packageList.length === 0) {
                    throw new Error('No packages available for this region');
                }

                // Extract region name from the first package
                const firstPackage = data.obj.packageList[0];
                const regionMatch = firstPackage.name.match(/^([^\d]+)/);
                const extractedRegionName = regionMatch ? regionMatch[1].trim() : 'Region';

                setRegionName(extractedRegionName);
                setRegionCode(slug.split('_')[0].toUpperCase() || '');

                // Extract countries from location field if available
                if (firstPackage.location) {
                    const countries = firstPackage.location.split(',').map(c => c.trim());
                    setRegionCountries(countries);
                } else {
                    setRegionCountries(['Multiple countries in this region']);
                }

                // Process packages
                const formattedPackages = data.obj.packageList.map(pkg => ({
                    id: pkg.packageCode,
                    packageCode: pkg.packageCode,
                    name: pkg.name,
                    dataAmount: `${(pkg.volume / 1073741824).toFixed(0)}GB`,
                    duration: `${pkg.duration} ${pkg.durationUnit.toLowerCase()}`,
                    price: pkg.price,
                    retailPrice: pkg.retailPrice,
                    currency: pkg.currencyCode,
                    description: pkg.description,
                    speed: pkg.speed || '4G/5G',
                    locationNetworkList: pkg.locationNetworkList || [],
                    locations: pkg.location ? pkg.location.split(',') : []
                }))
                    .sort((a, b) => a.price - b.price);

                setPackages(formattedPackages);

                // Select the default plan (first one)
                if (formattedPackages.length > 0) {
                    setSelectedPlanId(formattedPackages[0].id);
                }

            } catch (err) {
                console.error('Error fetching region data:', err);
                setError(err.message || 'Failed to load region data');
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchData();
        }
    }, [slug]);

    // Get the selected plan details
    const selectedPlan = packages.find(pkg => pkg.id === selectedPlanId) || packages[0];

    // Convert price from API format (value * 100) to display format
    const formatPrice = (price) => {
        if (!price) return 'N/A';
        return (price / 100).toFixed(2);
    };

    // Loading state
    if (loading) {
        return (
            <div className="max-w-[1220px] mx-auto pt-32 px-4 lg:px-0">
                <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-gray-200 rounded-full mr-3 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 w-72 rounded animate-pulse"></div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    <div className="hidden lg:block rounded-lg overflow-hidden h-[624px] bg-gray-200 animate-pulse"></div>

                    <div className="animate-pulse">
                        <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
                        <div className="h-20 bg-gray-200 rounded w-full mb-6"></div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="border rounded-lg p-3 h-24 bg-gray-100"></div>
                            ))}
                        </div>

                        <div className="h-12 bg-gray-200 rounded w-full mb-6"></div>
                        <div className="h-12 bg-gray-200 rounded w-full mb-6"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !selectedPlan) {
        return (
            <div className="max-w-[1220px] mx-auto px-4 pt-24">
                <div className="flex items-center mb-6">
                    <Link href="/destinations"
                        className="mr-3 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </Link>
                    <h1 className="text-2xl font-medium">Error</h1>
                </div>

                <div className="bg-red-50 p-6 rounded-lg border border-red-100">
                    <h2 className="text-xl font-semibold text-red-700 mb-2">Something went wrong</h2>
                    <p className="text-red-600 mb-4">{error}</p>
                    <Link href="/destinations"
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors inline-block"
                    >
                        Back to Destinations
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1220px] mx-auto px-4 pt-24">
            {/* Back button and title for mobile */}
            <div className="lg:hidden flex items-center mb-6">
                <Link href="/destinations"
                    className="mr-3 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <ChevronLeft size={24} />
                </Link>
                <h1 className="text-2xl font-medium">Regional eSIM for {regionName}</h1>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Left column - Region image */}
                <div className="hidden lg:block rounded-lg overflow-hidden h-[624px] bg-gray-100 border border-gray-200">
                    <div className="w-full h-full flex items-center justify-center">
                        <RegionImage regionName={regionName} regionCode={regionCode} />
                    </div>
                </div>

                {/* Right column - eSIM details and plans */}
                <div>
                    {/* Title for desktop */}
                    <div className="hidden lg:flex items-center mb-3">
                        <div className="w-8 h-8 bg-[#F15A25] rounded-full flex items-center justify-center text-white mr-3">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 10V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" />
                                <path d="M20 14v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3" />
                                <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                            </svg>
                        </div>
                        <h1 className="text-[40px] font-medium">Regional eSIM for {regionName}</h1>
                    </div>

                    <p className="text-gray-600 mb-6">
                        Get a regional eSIM card for {regionName} and enjoy reliable internet access across multiple countries with one simple plan.
                    </p>

                    {error && (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6">
                            {error}. Some information may not be accurate.
                        </div>
                    )}

                    {/* Region coverage info */}
                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                        <h3 className="font-medium text-blue-800 mb-2">Coverage Area</h3>
                        <p className="text-blue-700 text-sm mb-2">
                            This regional eSIM works in {regionCountries.length} {regionCountries.length === 1 ? 'country' : 'countries'} across {regionName}.
                        </p>
                        {regionCountries.length > 0 && regionCountries[0] !== 'Multiple countries in this region' && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {regionCountries.slice(0, 5).map((country, index) => (
                                    <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                        {country}
                                        
                                    </span>
                                ))}
                                {regionCountries.length > 5 && (
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                        +{regionCountries.length - 5} more
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <h2 className="font-medium mb-4 text-lg">Choose your data plan</h2>

                    {packages.length === 0 ? (
                        <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-8 rounded mb-6 text-center">
                            No eSIM plans are currently available for this region.
                            <p className="mt-2 text-sm">Please check back later or contact support for assistance.</p>
                        </div>
                    ) : (
                        /* Data plans grid */
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                            {packages.map((plan) => (
                                <button
                                    key={plan.id}
                                    onClick={() => setSelectedPlanId(plan.id)}
                                    className={`relative border rounded-lg p-3 text-left transition-all ${selectedPlanId === plan.id
                                        ? 'border-[#F15A25] bg-[#FFF8F6]'
                                        : 'border-gray-200 hover:border-[#F15A25]'
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <circle
                                            cx="8"
                                            cy="8"
                                            r="6"
                                            strokeWidth={`${selectedPlanId === plan.id ? '4' : '2'}`}
                                            stroke={`${selectedPlanId === plan.id ? '#F15A25' : '#C9C9C9'}`}
                                        />
                                    </svg>
                                    <div className="flex items-center mb-2">
                                        <h3 className="font-medium text-sm truncate ml-1">{plan.name}</h3>
                                    </div>
                                    <div className="text-xs text-gray-500 mb-1">{plan.duration}</div>
                                    <div className="text-sm font-medium">
                                        {plan.currency} {formatPrice(plan.price)}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">{plan.dataAmount}</div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Plan details */}
                    {selectedPlan && (
                        <div className="mb-6">
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <h3 className="font-medium mb-2">{selectedPlan.name}</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-gray-500">Data:</span> {selectedPlan.dataAmount}
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Duration:</span> {selectedPlan.duration}
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Speed:</span> {selectedPlan.speed}
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Regional Coverage:</span> {regionName}
                                    </div>
                                </div>
                            </div>

                            {/* Auto-activate section */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <div className="flex items-start">
                                    <Info size={16} className="text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium mb-1">Can I activate my plan later?</p>
                                        <p className="text-xs text-gray-600">
                                            All plans have a 30-day activation period. If you don't activate within 30 days, it will activate automatically.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="space-y-3 mb-6">
                                <Link
                                    href={`/checkout?packageCode=${selectedPlan.packageCode}`}
                                    className="block w-full bg-[#F15A25] hover:bg-[#E04E1A] text-white font-medium py-3 rounded-lg text-center transition-colors"
                                >
                                    Buy Now - {selectedPlan.currency} {formatPrice(selectedPlan.price)}
                                </Link>
                                <button className="block w-full border border-gray-300 text-gray-700 font-medium py-3 rounded-lg text-center hover:bg-gray-50 transition-colors">
                                    Check Device Compatibility
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Trust badges */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="flex items-center text-sm text-gray-500">
                            <div className="w-5 h-5 mr-2 flex-shrink-0">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                            </div>
                            <span>Money-back guarantee</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                            <div className="w-5 h-5 mr-2 flex-shrink-0">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                            </div>
                            <span>Secure payment</span>
                        </div>
                    </div>

                    {/* Feature tabs */}
                    <div className="border-b border-gray-200 mb-4">
                        <div className="flex space-x-6 overflow-x-auto">
                            {['features', 'description', 'technical', 'trust'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`text-sm font-medium pb-2 whitespace-nowrap transition-colors ${activeTab === tab
                                        ? 'text-gray-900 border-b-2 border-[#F15A25]'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab content */}
                    <div className="py-4">
                        {activeTab === 'features' && (
                            <ul className="space-y-2">
                                <li className="flex items-start">
                                    <span className="text-gray-400 mr-2">•</span>
                                    <span>Seamless coverage across multiple countries in {regionName}</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-gray-400 mr-2">•</span>
                                    <span>No need to switch SIMs when crossing borders within the region</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-gray-400 mr-2">•</span>
                                    <span>Affordable data from just {packages.length > 0
                                        ? `${packages[0].currency} ${formatPrice(packages[0].price)}`
                                        : '$3.00'}</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-gray-400 mr-2">•</span>
                                    <span>Instant delivery and activation via QR code</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-gray-400 mr-2">•</span>
                                    <span>Compatible with all eSIM-ready smartphones</span>
                                </li>
                            </ul>
                        )}

                        {activeTab === 'description' && (
                            <div className="text-gray-700 space-y-3">
                                <p>
                                    Stay connected across {regionName} with our regional eSIM plan. Perfect for travelers visiting multiple countries without the hassle of switching SIM cards.
                                </p>
                                <p>
                                    This regional eSIM provides seamless coverage throughout {regionName}, connecting to the strongest local networks in each country you visit.
                                </p>
                                <p>
                                    Choose your perfect data plan ({packages.length > 0 ?
                                        `${packages[0].dataAmount} to ${packages[packages.length - 1].dataAmount}` :
                                        '1GB to 20GB'}), activate instantly, and enjoy your trip with reliable connectivity.
                                </p>
                            </div>
                        )}

                        {activeTab === 'technical' && (
                            <div className="text-gray-700 space-y-3">
                                <p><span className="font-medium">Regional Coverage:</span> Works across multiple countries in {regionName}.</p>
                                <p><span className="font-medium">Activation:</span> Your eSIM activates automatically when you connect to a supported network.</p>
                                <p><span className="font-medium">Plan Duration:</span> {packages.length > 0 ? packages.map(p => p.duration).filter((v, i, a) => a.indexOf(v) === i).join(' or ') : '7 or 30 days'} options.</p>
                                <p><span className="font-medium">Speed:</span> Enjoy fast speeds including {selectedPlan?.speed || '4G/5G'} where available.</p>
                                <p><span className="font-medium">Data Roaming:</span> No additional roaming charges within covered countries.</p>
                            </div>
                        )}

                        {activeTab === 'trust' && (
                            <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                                <div className="flex items-start">
                                    <div className="w-10 h-10 rounded-full bg-[#FFF0EC] flex items-center justify-center flex-shrink-0 mr-4">
                                        <CheckCircle className="w-5 h-5 text-[#F15A25]" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium mb-1">Money-back guarantee</h3>
                                        <p className="text-sm text-gray-600">Not satisfied? Get a full refund within 30 days if you haven't used the data.</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="w-10 h-10 rounded-full bg-[#FFF0EC] flex items-center justify-center flex-shrink-0 mr-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F15A25]">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-medium mb-1">Privacy protection</h3>
                                        <p className="text-sm text-gray-600">Your personal data is never shared with third parties.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Network Coverage section */}
                    {selectedPlan && selectedPlan.locationNetworkList && selectedPlan.locationNetworkList.length > 0 && (
                        <div className="mt-8 bg-gray-50 p-6 rounded-lg">
                            <h3 className="text-xl font-medium mb-4">Network Coverage</h3>
                            <div className="space-y-6">
                                {selectedPlan.locationNetworkList.map((location, index) => (
                                    <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                                        <div className="flex items-center mb-2">
                                            <div className="w-6 h-6 relative mr-2">
                                                <img
                                                    src={ `/flags/${location.locationCode.toLowerCase()}_flag.jpeg`}
                                                    alt={location.locationName}
                                                    className="w-6 h-6 rounded-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = '/flags/default.jpg';
                                                    }}
                                                />
                                            </div>
                                            <h4 className="font-medium">{location.locationName}</h4>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {location.operatorList.map((operator, opIndex) => (
                                                <div key={opIndex} className="bg-white p-2 rounded border text-sm">
                                                    <span className="font-medium">{operator.operatorName}</span>
                                                    <span className="text-xs text-gray-500 ml-1">({operator.networkType})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Additional sections */}
            <SetupProcess />
            <BenefitsSection />
            <FAQSection />
        </div>
    );
}