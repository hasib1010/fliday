'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle, Info, Loader2 } from 'lucide-react';
import SetupProcess from '../Home/SetupProcess';
import BenefitsSection from '../Home/BenefitsSection';
import FAQSection from '../Home/FAQSection';

function PageSkeleton() {
  return (
    <div className="max-w-[1220px] mx-auto px-2 pt-24 animate-pulse">
      <div className="lg:gap-[78px] gap-6 flex justify-evenly lg:flex-row flex-col">

        {/* Left image skeleton */}
        <div className="hidden md:block rounded-lg bg-gray-200 lg:w-[468px] h-[624px] md:h-[623px]" />

        {/* Right column skeleton */}
        <div className="lg:max-w-[653px] w-full">

          {/* Title */}
          <div className="flex items-center mb-3 gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0" />
            <div className="h-9 bg-gray-300 rounded w-64" />
          </div>

          {/* Subtitle */}
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6" />

          {/* Plans label */}
          <div className="h-5 bg-gray-300 rounded w-40 mb-4" />

          {/* Plan cards grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="w-4 h-4 rounded-full bg-gray-200" />
                <div className="h-5 bg-gray-300 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-5 bg-gray-300 rounded w-12" />
              </div>
            ))}
          </div>

          {/* Info box */}
          <div className="bg-gray-100 rounded-lg p-4 mb-6 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-48" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
          </div>

          {/* CTA buttons */}
          <div className="h-12 bg-gray-300 rounded-full mb-3" />
          <div className="h-12 bg-gray-200 rounded-full mb-6" />

          {/* Trust badges */}
          <div className="flex justify-center space-x-8 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gray-200" />
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gray-200" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
          </div>

          {/* Tab strip */}
          <div className="border-b border-gray-200 mb-4">
            <div className="flex space-x-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-20 mb-2" />
              ))}
            </div>
          </div>

          {/* Tab body */}
          <div className="py-4 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DestinationCountryContent({ params }) {
  const countryCode = params?.code || '';
  const countryName = params?.name || countryCode;

  const [packages, setPackages] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [activeTab, setActiveTab] = useState('features');
  const [isLoading, setIsLoading] = useState(true);
  const [settled, setSettled] = useState(false); // true only after load completes + brief delay
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!countryCode) return;
    const controller = new AbortController();

    const fetchPackages = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(
          `/api/esim/packages?locationCode=${countryCode.toUpperCase()}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`Failed to fetch packages: ${res.status}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to fetch packages');

        const sorted = [...(data.data || [])].sort((a, b) => a.price - b.price);
        setPackages(sorted);
        setSelectedPlan(sorted[0] || null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching packages:', err);
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
        // Small delay before showing empty state to avoid flash
        setTimeout(() => setSettled(true), 300);
      }
    };

    fetchPackages();
    return () => controller.abort();
  }, [countryCode]);

  const formatPrice = (price) => {
    if (price == null) return '—';
    return `$${(price / 10000).toFixed(2)}`;
  };

  const destinationImages = {
    TR: '/destinations/turkey.jpg',
    US: '/destinations/usa.jpg',
    TH: '/destinations/thailand.jpg',
    IT: '/destinations/italy.jpg',
    ES: '/destinations/spain.jpg',
    ID: '/destinations/indonesia.jpg',
    MA: '/destinations/morocco.jpg',
    MY: '/destinations/malaysia.jpg',
    DE: '/destinations/germany.jpg',
  };
  const destinationImage =
    destinationImages[countryCode.toUpperCase()] || '/destinations/default.png';

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="max-w-[1220px] mx-auto px-2 pt-24">
      <div className="lg:gap-[78px] gap-6 flex justify-evenly lg:flex-row flex-col">

        {/* Left column */}
        <div className="relative hidden md:block rounded-lg overflow-hidden lg:w-[468px] h-[624px] md:h-[623px]">
          <Image
            src={destinationImage}
            alt={`eSIM for ${countryName}`}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Right column */}
        <div className="lg:max-w-[653px]">
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
            Get an eSIM card for {countryName} and enjoy reliable, affordable internet on your trip.
          </p>

          <h2 className="font-medium mb-4">Choose your data plan</h2>

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
              Could not load plans: {error}
            </div>
          )}

          {/* No packages — only show after settled to avoid flash while packages are loading */}
          {!error && packages.length === 0 && settled && (
            <div className="mb-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 opacity-30 pointer-events-none select-none">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
                    <div className="w-4 h-4 rounded-full bg-gray-200" />
                    <div className="h-5 bg-gray-200 rounded w-16" />
                    <div className="h-4 bg-gray-100 rounded w-20" />
                    <div className="h-5 bg-gray-200 rounded w-12" />
                  </div>
                ))}
              </div>
              <p className="text-sm text-center text-gray-400">
                No plans available for {countryName} at the moment.
              </p>
            </div>
          )}

          {/* While loading has finished but not yet settled — show skeleton cards inline */}
          {!error && packages.length === 0 && !settled && !isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="w-4 h-4 rounded-full bg-gray-200" />
                  <div className="h-5 bg-gray-300 rounded w-16" />
                  <div className="h-4 bg-gray-200 rounded w-20" />
                  <div className="h-5 bg-gray-300 rounded w-12" />
                </div>
              ))}
            </div>
          )}

          {/* Plan cards */}
          {packages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {packages.map((pkg) => {
                const isSelected = selectedPlan?.id === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPlan(pkg)}
                    className={`relative border rounded-lg p-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#F15A25] bg-[#FFF8F6]'
                        : 'border-gray-200 hover:border-[#F15A25]'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6"
                        strokeWidth={isSelected ? '4' : '2'}
                        stroke={isSelected ? '#F15A25' : '#C9C9C9'}
                      />
                    </svg>
                    <div className="font-medium mt-1">{pkg.dataAmount || 'N/A'}</div>
                    <div className="text-sm text-gray-500">
                      {pkg.duration ? `${pkg.duration} ${pkg.duration === '1' ? 'day' : 'days'}` : 'N/A'}
                    </div>
                    <div className="mt-1">
                      <span className="font-medium">{formatPrice(pkg.price)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Auto-activate info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <Info size={16} className="mr-1" />
              <label className="text-sm font-medium">Can I activate my plan later?</label>
            </div>
            <p className="text-xs text-gray-500">
              All plans have a 30-day activation period. If you get a plan today and don't activate it within 30 days, it will activate automatically.
            </p>
          </div>

          {/* Checkout button */}
          <Link
            href={
              selectedPlan
                ? `/checkout?plan=${selectedPlan.dataAmount}&price=${(selectedPlan.price / 10000).toFixed(2)}&country=${countryCode}&packageCode=${selectedPlan.packageCode}`
                : '#'
            }
            className={`block w-full font-medium py-3 rounded-full text-center mb-3 transition-colors ${
              selectedPlan
                ? 'bg-[#F15A25] text-white hover:bg-[#e04e1a]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none'
            }`}
          >
            {selectedPlan ? `Go to checkout — ${formatPrice(selectedPlan.price)}` : 'Select a plan'}
          </Link>

          <button className="block w-full border border-gray-300 text-gray-700 font-medium py-3 rounded-full text-center mb-6 hover:bg-gray-50 transition-colors">
            Check Compatibility
          </button>

          {/* Trust badges */}
          <div className="flex justify-center space-x-8 mb-8">
            <div className="flex items-center text-sm text-gray-500">
              <Image src="/icons/CardSecurity.png" alt="Card Security" width={24} height={24} className="mr-1" />
              <span>Secure payment</span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Image src="/icons/Guarantee.png" alt="Money-back guarantee" width={24} height={24} className="mr-1" />
              <span>Money-back guarantee</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-4">
            <div className="flex space-x-6 overflow-x-auto">
              {['features', 'description', 'technical', 'trust'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-sm cursor-pointer font-medium pb-2 transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? 'text-gray-900 border-b-2 border-[#F15A25]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'features' ? 'Key features'
                    : tab === 'technical' ? 'Technical details'
                    : tab === 'trust' ? 'Trust & Safety'
                    : 'Description'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="py-4">
            {activeTab === 'features' && (
              <ul className="space-y-2">
                <li className="flex items-start"><span className="text-gray-400 mr-2">•</span><span>Affordable data from just $3.99</span></li>
                <li className="flex items-start"><span className="text-gray-400 mr-2">•</span><span>Stay connected with {countryName}'s top networks.</span></li>
                <li className="flex items-start"><span className="text-gray-400 mr-2">•</span><span>Compatible with all eSIM-ready smartphones.</span></li>
              </ul>
            )}
            {activeTab === 'description' && (
              <div className="text-gray-700">
                <p className="mb-3">
                  Stay connected in {countryName} without breaking the bank! Whether you're a traveler, tourist, or business explorer, our prepaid eSIM keeps you online effortlessly.
                </p>
                <p>Choose your perfect data plan, activate instantly, and enjoy {countryName} at full speed.</p>
              </div>
            )}
            {activeTab === 'technical' && (
              <div className="text-gray-700 space-y-2">
                <p><span className="font-medium">Activation:</span> Your eSIM activates automatically when you arrive in {countryName}.</p>
                <p><span className="font-medium">Plan Duration:</span> Choose between 7-day or 30-day options, depending on your plan.</p>
                <p><span className="font-medium">Data Plans:</span> Flexible packages from 1 GB up to 20 GB.</p>
                <p><span className="font-medium">Delivery Time:</span> Instant delivery right after your purchase.</p>
                <p><span className="font-medium">SMS & Calls:</span> SMS not included. VoIP only (WhatsApp, Telegram, etc.).</p>
                <p><span className="font-medium">Speed:</span> 3G / 4G LTE / 5G depending on local network availability.</p>
                <p><span className="font-medium">Hotspot:</span> No hotspot restrictions.</p>
                <p><span className="font-medium">Coverage:</span> Reliable connection across {countryName}. Network quality depends on local providers.</p>
              </div>
            )}
            {activeTab === 'trust' && (
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      icon: <CheckCircle className="w-5 h-5 text-[#F15A25]" />,
                      title: 'Money-back guarantee',
                      desc: "Full refund within 30 days if you haven't used the data.",
                    },
                    {
                      icon: <Info className="w-5 h-5 text-[#F15A25]" />,
                      title: 'Secure payment',
                      desc: '256-bit SSL encryption on all transactions.',
                    },
                    {
                      icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F15A25]">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      ),
                      title: 'Privacy protection',
                      desc: 'Your data is never shared with third parties.',
                    },
                    {
                      icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F15A25]">
                          <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                          <line x1="6" y1="1" x2="6" y2="4"></line>
                          <line x1="10" y1="1" x2="10" y2="4"></line>
                          <line x1="14" y1="1" x2="14" y2="4"></line>
                        </svg>
                      ),
                      title: '24/7 Support',
                      desc: 'Our support team is always available to help.',
                    },
                  ].map(({ icon, title, desc }) => (
                    <div key={title} className="flex items-start">
                      <div className="w-10 h-10 rounded-full bg-[#FFF0EC] flex items-center justify-center flex-shrink-0 mr-4">
                        {icon}
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">{title}</h3>
                        <p className="text-sm text-gray-600">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <SetupProcess />
      <BenefitsSection />
      <FAQSection />
    </div>
  );
}