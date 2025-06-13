// app/privacy/page.js
import { Metadata } from 'next';
import PrivacyPolicy from './PrivacyPolicy';

export const metadata = {
  title: 'Privacy Policy | Fliday eSIM',
  description: 'Learn about how Fliday eSIM collects, uses, and protects your personal information. Our privacy policy explains our data practices and your rights.',
  openGraph: {
    title: 'Privacy Policy | Fliday eSIM',
    description: 'Learn about how Fliday eSIM collects, uses, and protects your personal information.',
    url: 'https://fliday.com/privacy-policy',
    siteName: 'Fliday ',
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
};

export default function PrivacyPage() {
  return <PrivacyPolicy />;
}