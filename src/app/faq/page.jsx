import React from 'react';
import FAQ from './FAQ';

// Define metadata for SEO
export const metadata = {
  title: 'eSIM FAQ – Setup, Activation & Travel eSIM Questions',

  description:
    'Find answers to common eSIM questions including setup, activation, compatibility, and troubleshooting for travel eSIM plans.',

  alternates: {
    canonical: 'https://fliday.com/faq',
  },

  openGraph: {
    title: 'eSIM FAQ – Setup, Activation & Travel eSIM Questions',
    description:
      'Learn how eSIM works, how to activate your eSIM, and get answers to common travel eSIM questions.',
    type: 'website',
    url: 'https://fliday.com/faq',
    siteName: 'Fliday',
    images: [
      {
        url: 'https://fliday.com/images/faq-hero.jpg',
        width: 1200,
        height: 630,
        alt: 'eSIM FAQ – Fliday',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'eSIM FAQ – Setup & Activation Questions',
    description:
      'Answers to common questions about activating, installing and using travel eSIMs.',
    images: ['https://fliday.com/images/faq-hero.jpg'],
  },
};

function Index() {
  // FAQPage schema for SEO
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is an eSIM?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'An eSIM (embedded SIM) is a digital SIM that allows you to activate a cellular plan without a physical SIM card. It’s built into your device and can be programmed to work with carriers like Fliday.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I set up an eSIM with Fliday?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'To set up an eSIM with Fliday, purchase a plan, scan the QR code provided, and follow your device’s instructions to activate the eSIM in settings.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I use eSIM and physical SIM together?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, most eSIM-compatible devices support dual SIM functionality, allowing you to use an eSIM and a physical SIM simultaneously for travel or local plans.',
        },
      },
      {
        '@type': 'Question',
        name: 'What if I have issues with my eSIM?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'If you encounter issues, visit our support page or contact Fliday’s support team for troubleshooting assistance with eSIM activation or connectivity.',
        },
      },
    ],
  };

  // BreadcrumbList schema for SEO
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://fliday.com/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'FAQ',
        item: 'https://fliday.com/faq',
      },
    ],
  };

  return (
    <div>
      {/* Schema Markup */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <FAQ />
    </div>
  );
}

export default Index;