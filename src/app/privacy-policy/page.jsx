// app/privacy/page.js
import { Metadata } from 'next';
import PrivacyPolicy from './PrivacyPolicy';

export const metadata = {
  title: 'Privacy Policy – Fliday',

  description:
    'Read the Fliday eSIM privacy policy to understand how we collect, use, and protect your personal information when using our website and services.',

  alternates: {
    canonical: 'https://fliday.com/privacy-policy',
  },

  openGraph: {
    title: 'Privacy Policy – Fliday eSIM',
    description:
      'Learn how Fliday eSIM collects, uses, and protects your personal information.',
    url: 'https://fliday.com/privacy-policy',
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
    title: 'Privacy Policy – Fliday eSIM',
    description:
      'Learn how Fliday eSIM collects and protects your personal information.',
    images: ['https://fliday.com/og-image.png'],
  },
};

export default function PrivacyPage() {
  return <PrivacyPolicy />;
}