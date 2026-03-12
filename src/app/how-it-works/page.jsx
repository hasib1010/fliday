// app/how-it-works/page.js
import HowItWorks from '@/components/HowItWorks/HowItWorks';

export const metadata = {
  title: 'How eSIM Works – Activate Your Travel eSIM in Minutes',
  description:
    'Learn how to activate and use a travel eSIM in minutes. Follow simple steps to install your eSIM on iPhone or Android and stay connected worldwide.',

  alternates: {
    canonical: 'https://fliday.com/how-it-works',
  },

  openGraph: {
    title: 'How eSIM Works – Activate Your Travel eSIM in Minutes',
    description:
      'Step-by-step guide showing how to install and activate your travel eSIM on iPhone or Android.',
    url: 'https://fliday.com/how-it-works',
    siteName: 'Fliday',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'How eSIM Works – Travel eSIM Setup Guide',
    description:
      'Learn how to install and activate a travel eSIM in minutes.',
  },
};

export default function HowItWorksPage() {
  return <HowItWorks />;
}