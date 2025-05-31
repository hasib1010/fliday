import React from 'react';
import CompatibilityPage from './CompatibilityPage';

// Define metadata for SEO
export const metadata = {
  title: 'eSIM Compatibility Checker for Smartphones and Tablets',
  description: 'Check if your iPhone, Samsung Galaxy, Google Pixel, or other device supports eSIM with our compatibility checker. Explore compatible devices and browse eSIM plans.',
  keywords: 'eSIM compatibility, eSIM checker, iPhone eSIM, Samsung Galaxy eSIM, Google Pixel eSIM, device compatibility',
  robots: 'index, follow',
  openGraph: {
    title: 'eSIM Compatibility Checker for Smartphones and Tablets',
    description: 'Verify if your device supports eSIM technology with our easy-to-use compatibility checker. Supports Apple, Samsung, Google, and more.',
    type: 'website',
    url: 'https://fliday.com/compatibility',
    images: ['https://fliday.com/images/esim-compatibility.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eSIM Compatibility Checker for Smartphones and Tablets',
    description: 'Verify if your device supports eSIM technology with our easy-to-use compatibility checker. Supports Apple, Samsung, Google, and more.',
    images: ['https://fliday.com/images/esim-compatibility.jpg'],
  },
  alternates: {
    canonical: 'https://fliday.com/compatibility',
  },
};

function Page() {
  return (
    <div>
      <CompatibilityPage />
    </div>
  );
}

export default Page;