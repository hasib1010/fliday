import React from 'react';
import CompatibilityPage from './CompatibilityPage';

// Define metadata for SEO
export const metadata = {
  title: 'eSIM Compatible Phones – iPhone & Android Compatibility Checker',

  description:
    'Check if your phone supports eSIM. Use our compatibility checker for iPhone, Samsung Galaxy, Google Pixel and other Android devices.',

  robots: 'index, follow',

  openGraph: {
    title: 'eSIM Compatible Phones – iPhone & Android Checker',
    description:
      'Verify if your device supports eSIM technology. Compatible with iPhone, Samsung Galaxy, Google Pixel and more.',
    type: 'website',
    url: 'https://fliday.com/compatibility',
    images: ['https://fliday.com/images/esim-compatibility.jpg'],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'eSIM Compatible Phones – iPhone & Android Checker',
    description:
      'Check if your smartphone supports eSIM with our compatibility checker for Apple, Samsung and Pixel devices.',
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