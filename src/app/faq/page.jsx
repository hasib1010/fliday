import React from 'react';
import FAQ from './FAQ';

// Define metadata for SEO
export const metadata = {
  title: 'Fliday FAQ | eSIM, Travel Connectivity & Support Questions',
  description: 'Find answers to common questions about eSIM, travel connectivity, and Fliday’s services in our FAQ. Learn how to use eSIM, troubleshoot issues, and more.',
  keywords: 'eSIM FAQ, Fliday FAQ, travel connectivity, eSIM support, travel questions, Fliday support, global connectivity',
  robots: 'index, follow',
  openGraph: {
    title: 'Fliday FAQ | eSIM, Travel Connectivity & Support Questions',
    description: 'Find answers to common questions about eSIM, travel connectivity, and Fliday’s services in our FAQ. Learn how to use eSIM, troubleshoot issues, and more.',
    type: 'website',
    url: 'https://fliday.com/faq',
    images: ['https://fliday.com/images/faq-hero.jpg'],
    siteName: 'Fliday',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fliday FAQ | eSIM, Travel Connectivity & Support Questions',
    description: 'Find answers to common questions about eSIM, travel connectivity, and Fliday’s services in our FAQ. Learn how to use eSIM, troubleshoot issues, and more.',
    images: ['https://fliday.com/images/faq-hero.jpg'],
  },
  alternates: {
    canonical: 'https://fliday.com/faq',
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