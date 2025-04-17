'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle, Info, ChevronLeft } from 'lucide-react';

export default function DestinationCountryContent({ params }) {
    const router = useRouter();
    const code = params?.code || '';
   

    // State for API data
    const [countryName, setCountryName] = useState('');
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
   
    // State to track selected plan and active tab
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [activeTab, setActiveTab] = useState('features');

    useEffect(() => {
        console.log('useEffect triggered with code:', code);

        const fetchData = async () => {
            try {
                console.log('Starting fetchData');
                setLoading(true);
                setError(null);

                // Debug logging
                console.log('Fetching data for country code:', code);

                // Fetch locations first
                console.log('Fetching locations');
                const locationResponse = await fetch('/api/esim/locations');
                console.log('Location response status:', locationResponse.status);

                if (!locationResponse.ok) {
                    const errorText = await locationResponse.text();
                    console.error('Location fetch error:', errorText);
                    throw new Error('Failed to fetch locations');
                }

                const locationData = await locationResponse.json();
                console.log('Location data:', locationData);

                // Find the country by code
                const country = locationData.data.countries.find(
                    c => c.code.toLowerCase() === code.toLowerCase()
                );

                if (country) {
                    setCountryName(country.name);
                } else {
                    setCountryName(formatCode(code));
                }

                // Fetch packages for the specific country
                console.log('Fetching packages');
                const packagesResponse = await fetch(`/api/esim/packages?countryCode=${code.toUpperCase()}`);
                console.log('Packages API response status:', packagesResponse.status);

                if (!packagesResponse.ok) {
                    const errorText = await packagesResponse.text();
                    console.error('Packages fetch error:', errorText);
                    throw new Error(`Failed to fetch packages: ${packagesResponse.status}`);
                }

                const packagesData = await packagesResponse.json();
                console.log('Packages data:', packagesData);

                if (!packagesData.success) {
                    throw new Error(packagesData.message || 'Failed to fetch packages');
                }

                // Process packages
                const formattedPackages = (packagesData.data || [])
                    .filter(pkg => pkg.is_active !== false)
                    .map(pkg => ({
                        id: pkg.id || pkg.packageCode,
                        packageCode: pkg.packageCode,
                        data: `${pkg.data_gb} GB`,
                        days: pkg.validity || '30 days',
                        price: pkg.reseller_price,
                        discount: pkg.retailPrice && pkg.retailPrice > pkg.reseller_price,
                        originalPrice: pkg.retailPrice,
                        popular: pkg.popular || false,
                        description: pkg.description
                    }))
                    .sort((a, b) => {
                        const aGB = parseFloat(a.data.replace(' GB', ''));
                        const bGB = parseFloat(b.data.replace(' GB', ''));
                        return aGB - bGB;
                    });

                console.log('Formatted packages:', formattedPackages);

                // If no packages found, use sample data
                if (formattedPackages.length === 0) {
                    console.warn('No packages found, using sample data');
                    setPackages(samplePlans);
                    setSelectedPlan(samplePlans[2]?.data);
                } else {
                    setPackages(formattedPackages);

                    // Select the default plan (mid-range or first)
                    const midIndex = Math.floor(formattedPackages.length / 2);
                    setSelectedPlan(formattedPackages[midIndex]?.data || formattedPackages[0].data);
                }

                console.log('Fetch completed successfully');

            } catch (err) {
                console.error('Error in fetchData:', err);
                setError(err.message || 'Failed to load destination data');

                // Fallback to sample data
                setPackages(samplePlans);
                setSelectedPlan(samplePlans[2]?.data);
            } finally {
                console.log('Setting loading to false');
                setLoading(false);
            }
        };

        if (code) {
            fetchData();
        } else {
            console.warn('No country code provided');
            setLoading(false);
        }
    }, [code]);
    const selectedPlanDetails = packages.find(plan => plan.data === selectedPlan) || packages[0];
    const getDiscountPercentage = (original, current) => {
        if (!original || !current || original <= current) return null;
        const percentage = Math.round(((original - current) / original) * 100);
        return percentage > 0 ? percentage : null;
    };

    // Rest of the component remains the same as in your previous implementation...
    // (Include all the existing render logic from the previous component)

    // Fallback rendering for loading and error states
    if (loading) {
        return (
            <div className="max-w-[1220px] mx-auto px-2 pt-24 text-center">
                <p>Loading destination details...</p>
            </div>
        );
    }

    if (error && packages.length === 0) {
        return (
            <div className="max-w-[1220px] mx-auto px-2 pt-24">
                <div className="bg-red-50 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Packages</h2>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.back()}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                    >
                        Back to Destinations
                    </button>
                </div>
            </div>
        );
    }

    // ... (rest of the render method from your previous implementation)
    <div className="max-w-[1220px] mx-auto px-2 pt-24">
        <div className="lg:gap-[78px] gap-6 flex justify-evenly lg:flex-row flex-col">
            {/* Left column - Destination image */}
            {/* Left column - Destination image */}
            <div className="relative hidden md:block rounded-lg overflow-hidden lg:w-[468px] h-[624px] md:h-[623px]">
                <Image
                    src="/destinations/generic.jpg"
                    alt={`eSIM for ${countryName}`}
                    fill
                    className="object-cover"
                    priority
                />
            </div>

            {/* Right column - eSIM details and plans */}
            <div className='lg:max-w-[653px]'>
                <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-[#F15A25] rounded-full flex items-center justify-center text-white mr-3">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 10V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" />
                            <path d="M20 14v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3" />
                            <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                        </svg>
                    </div>
                    <h1 className="lg:text-[40px] text-2xl font-medium">eSIM for {countryName}</h1>
                </div>

                <p className="text-gray-600 mb-6">
                    Get an eSIM card for {countryName} and enjoy reliable and affordable internet access on your trip.
                </p>

                {error && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6">
                        {error}. Some information may not be accurate.
                    </div>
                )}

                <h2 className="font-medium mb-4">Choose your data plan</h2>

                {/* Data plans grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                    {packages.map((plan) => {
                        const discountPercent = getDiscountPercentage(plan.originalPrice, plan.price);
                        return (
                            <div
                                key={plan.id}
                                onClick={() => setSelectedPlan(plan.data)}
                                className={`relative border rounded-lg p-3 cursor-pointer transition-all ${selectedPlan === plan.data
                                    ? 'border-[#F15A25] bg-[#FFF8F6]'
                                    : 'border-gray-200 hover:border-[#F15A25]'
                                    }`}
                            >
                                {discountPercent && (
                                    <div className="absolute -top-2 -right-1 bg-[#F15A25] text-white text-xs px-2 py-1 rounded-full">
                                        {discountPercent}%<br />OFF
                                    </div>
                                )}
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <circle
                                        cx="8"
                                        cy="8"
                                        r="6"
                                        strokeWidth={`${selectedPlan === plan.data ? '4' : '2'}`}
                                        stroke={`${selectedPlan === plan.data ? '#F15A25' : '#C9C9C9'}`}
                                    />
                                </svg>

                                <div className="font-medium">{plan.data}</div>
                                <div className="text-sm text-gray-500">{plan.days}</div>
                                <div className="mt-1">
                                    <span className="font-medium">USD {typeof plan.price === 'number' ? plan.price.toFixed(2) : plan.price}</span>
                                    {plan.originalPrice && (
                                        <span className="text-sm text-gray-400 line-through ml-1">
                                            ${typeof plan.originalPrice === 'number' ? plan.originalPrice.toFixed(2) : plan.originalPrice}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Auto-activate section */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center mb-2">
                        <Info size={16} className="mr-1" />
                        <label htmlFor="auto-activate" className="text-sm font-medium">
                            Can I activate my plan later?
                        </label>
                    </div>
                    <p className="text-xs text-gray-500">
                        All plans have a 30-day activation period. If you get a plan today and don't activate it within 30 days, it will activate automatically.
                    </p>
                </div>

                {/* Action buttons */}
                <Link
                    href={`/checkout?packageCode=${selectedPlanDetails?.packageCode}`}
                    className="block w-full bg-[#F15A25] text-white font-medium py-3 rounded-full text-center mb-3 hover:bg-[#e04e1a] transition-colors"
                >
                    Go to checkout - ${typeof selectedPlanDetails?.price === 'number' ? selectedPlanDetails.price.toFixed(2) : selectedPlanDetails?.price}
                </Link>

                <button
                    className="block w-full border border-gray-300 text-gray-700 font-medium py-3 rounded-full text-center mb-6 hover:bg-gray-50 transition-colors"
                >
                    Check Compatibility
                </button>

                {/* Trust badges */}
                <div className="flex justify-center space-x-8 mb-8">
                    <div className="flex items-center text-sm text-gray-500">
                        <div className="w-6 h-6 mr-1 relative">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>
                        <span>Secure payment</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                        <div className="w-6 h-6 mr-1 relative">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                        </div>
                        <span>Money-back guarantee</span>
                    </div>
                </div>

                {/* Feature tabs */}
                <div className="border-b border-gray-200 mb-4">
                    <div className="flex space-x-6 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('features')}
                            className={`text-sm cursor-pointer font-medium pb-2 transition-colors ${activeTab === 'features'
                                ? 'text-gray-900 border-b-2 border-[#F15A25]'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Key features
                        </button>
                        <button
                            onClick={() => setActiveTab('description')}
                            className={`text-sm cursor-pointer font-medium pb-2 transition-colors ${activeTab === 'description'
                                ? 'text-gray-900 border-b-2 border-[#F15A25]'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Description
                        </button>
                        <button
                            onClick={() => setActiveTab('technical')}
                            className={`text-sm cursor-pointer font-medium pb-2 transition-colors ${activeTab === 'technical'
                                ? 'text-gray-900 border-b-2 border-[#F15A25]'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Technical details
                        </button>
                        <button
                            onClick={() => setActiveTab('trust')}
                            className={`text-sm cursor-pointer font-medium pb-2 transition-colors ${activeTab === 'trust'
                                ? 'text-gray-900 border-b-2 border-[#F15A25]'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Trust & Safety
                        </button>
                    </div>
                </div>

                {/* Tab content */}
                <div className="py-4">
                    {activeTab === 'features' && (
                        <ul className="space-y-2">
                            <li className="flex items-start">
                                <span className="text-gray-400 mr-2">•</span>
                                <span>Affordable data from just ${Math.min(...packages.map(p => typeof p.price === 'number' ? p.price : 999)).toFixed(2)}</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-gray-400 mr-2">•</span>
                                <span>Stay connected with {countryName}'s top networks.</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-gray-400 mr-2">•</span>
                                <span>Compatible with all eSIM-ready smartphones.</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-gray-400 mr-2">•</span>
                                <span>Instant delivery and activation.</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-gray-400 mr-2">•</span>
                                <span>No contracts or hidden fees.</span>
                            </li>
                        </ul>
                    )}

                    {activeTab === 'description' && (
                        <div className="text-gray-700">
                            <p className="mb-3">
                                Stay connected in {countryName} without breaking the bank! Whether you're a traveler, tourist, or business explorer, our prepaid eSIM keeps you online effortlessly.
                            </p>
                            <p className="mb-3">
                                Choose your perfect data plan ({packages.length > 0 ?
                                    `${packages[0].data} to ${packages[packages.length - 1].data}` :
                                    '1GB to 20GB'}), activate instantly, and enjoy {countryName} at full speed.
                            </p>
                            <p>
                                {selectedPlanDetails?.description || `Our ${selectedPlanDetails?.data} plan offers the best value for typical travelers, giving you plenty of data for navigation, social media, and video calls.`}
                            </p>
                        </div>
                    )}

                    {activeTab === 'technical' && (
                        <div className="text-gray-700 space-y-2">
                            <p><span className="font-medium">Activation:</span> Your eSIM activates automatically when you arrive in {countryName}.</p>
                            <p><span className="font-medium">Plan Duration:</span> Choose between {packages.map(p => p.days).filter((v, i, a) => a.indexOf(v) === i).join(' or ')} options, depending on your plan.</p>
                            <p><span className="font-medium">Data Plans:</span> Flexible data packages from {packages.length > 0 ?
                                `${packages[0].data} up to ${packages[packages.length - 1].data}` :
                                '1GB up to 20GB'}.</p>
                            <p><span className="font-medium">Delivery Time:</span> Instant delivery right after your purchase.</p>
                            <p><span className="font-medium">SMS & Calls:</span> SMS not included. Calls available through apps like WhatsApp, Telegram, or Messenger (VoIP only).</p>
                            <p><span className="font-medium">Speed:</span> Enjoy fast speeds including 3G, 4G, LTE, or 5G, depending on local network availability.</p>
                            <p><span className="font-medium">Hotspot:</span> Use your data freely with no hotspot restrictions.</p>
                            <p><span className="font-medium">Coverage:</span> Reliable connection in cities and towns across {countryName}. Network quality depends on local providers.</p>
                        </div>
                    )}

                    {activeTab === 'trust' && (
                        <div className="bg-gray-50 rounded-lg p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-start">
                                    <div className="w-10 h-10 rounded-full bg-[#FFF0EC] flex items-center justify-center flex-shrink-0 mr-4">
                                        <CheckCircle className="w-5 h-5 text-[#F15A25]" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium mb-1">Money-back guarantee</h3>
                                        <p className="text-sm text-gray-600">Not satisfied? Get a full refund within 30 days of purchase if you haven't used the data.</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="w-10 h-10 rounded-full bg-[#FFF0EC] flex items-center justify-center flex-shrink-0 mr-4">
                                        <Info className="w-5 h-5 text-[#F15A25]" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium mb-1">Secure payment</h3>
                                        <p className="text-sm text-gray-600">All transactions are processed securely with 256-bit SSL encryption.</p>
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
                                        <p className="text-sm text-gray-600">Your personal data is never shared with third parties without your consent.</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="w-10 h-10 rounded-full bg-[#FFF0EC] flex items-center justify-center flex-shrink-0 mr-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F15A25]">
                                            <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                                            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                                            <line x1="6" y1="1" x2="6" y2="4"></line>
                                            <line x1="10" y1="1" x2="10" y2="4"></line>
                                            <line x1="14" y1="1" x2="14" y2="4"></line>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-medium mb-1">24/7 Support</h3>
                                        <p className="text-sm text-gray-600">Get assistance anytime, anywhere with our dedicated support team.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* You can add your SetupProcess, BenefitsSection, and FAQSection components here */}
        {/* <SetupProcess /> */}
        {/* <BenefitsSection /> */}
        {/* <FAQSection /> */}
    </div>
}

// Sample fallback data
const samplePlans = [
    { id: 1, packageCode: 'PKG001', data: '1 GB', days: '7 days', price: 3.99 },
    { id: 2, packageCode: 'PKG002', data: '3 GB', days: '30 days', price: 8.99 },
    { id: 3, packageCode: 'PKG003', data: '5 GB', days: '30 days', price: 9.99 },
    { id: 4, packageCode: 'PKG004', data: '10 GB', days: '30 days', price: 15.99, discount: true, originalPrice: 18.99 },
    { id: 5, packageCode: 'PKG005', data: '20 GB', days: '30 days', price: 22.99, discount: true, originalPrice: 25.99 },
];

// Helper function to format country code
const formatCode = (code) => {
    const countryNames = {
        'us': 'United States',
        'gb': 'United Kingdom',
        'fr': 'France',
        'de': 'Germany',
        'it': 'Italy',
        'es': 'Spain',
        'tr': 'Turkey',
        'th': 'Thailand',
        'my': 'Malaysia'
        // Add more as needed
    };

    return countryNames[code.toLowerCase()] || code.toUpperCase();
};