// app/terms/page.js
import { Metadata } from 'next';
import TermsOfService from '@/app/terms-of-service/TermsOfService';

export const metadata = {
  title: 'Terms of Service | Fliday eSIM',
  description: 'Read Fliday eSIM\'s terms of service. Understand your rights and responsibilities when using our eSIM services and travel connectivity solutions.',
  openGraph: {
    title: 'Terms of Service | Fliday eSIM',
    description: 'Read Fliday eSIM\'s terms of service. Understand your rights and responsibilities when using our eSIM services.',
    url: 'https://fliday.com/terms-of-service',
    siteName: 'Fliday',
    images: [
      {
        url: 'https://fliday.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Fliday eSIM',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | Fliday eSIM',
    description: 'Read Fliday eSIM\'s terms of service. Understand your rights and responsibilities when using our eSIM services.',
    images: ['https://fliday.com/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://fliday.com/terms',
  },
};

export default function TermsPage() {
  return <TermsOfService />;
}