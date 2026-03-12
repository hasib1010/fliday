// app/destinations/page.js
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Static metadata
export const metadata = {
  title: 'All Destinations – Prepaid Travel eSIM Data Plans for 100+ Countries',
  description:
    'Browse travel eSIM data plans for 100+ countries. Get instant prepaid eSIM activation for iPhone and Android with fast international mobile data.',

  keywords: [
    'travel esim',
    'prepaid esim',
    'international esim',
    'esim destinations',
    'esim data plans',
    'esim iphone',
    'esim android',
    'esim countries'
  ],

  openGraph: {
    title: 'All Destinations – Prepaid Travel eSIM Data Plans for 100+ Countries',
    description:
      'Browse travel eSIM plans for over 100 destinations worldwide with instant activation.',
    url: 'https://fliday.com/destinations',
    siteName: 'Fliday',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'All Destinations – Prepaid Travel Data Plans',
    description:
      'Explore eSIM data plans for 100+ travel destinations with instant activation.',
  },
};

// Load the component dynamically to improve initial page load
const AllDestinations = dynamic(() => import('@/components/Destinations/AllDestinations'), {
  ssr: true,
  loading: () => (
    <div className="max-w-[1220px] mx-auto pt-32 px-3 lg:px-0">
      <h1 className="lg:text-[40px] text-3xl font-medium mb-2">All destinations</h1>
      <p className="text-gray-600 mb-6">Explore eSIM plans in 100+ countries.</p>
      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-6">
        Loading available destinations...
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-[#f7f7f8] rounded-lg p-4 animate-pulse">
            <div className="flex items-center">
              <div className="w-[36px] h-[36px] bg-gray-300 rounded-full mr-3"></div>
              <div>
                <div className="h-5 bg-gray-300 rounded w-24 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
});

// Enable static generation with revalidation
export const revalidate = 3600; // Revalidate once per hour

export default function DestinationsPage() {
  return (
    <Suspense fallback={null}>
      <AllDestinations />
    </Suspense>
  );
}