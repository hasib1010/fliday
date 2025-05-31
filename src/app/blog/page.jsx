import React from 'react';
import Blog from './Blog';

// Define metadata for SEO
export const metadata = {
  title: 'Fliday Blog | Travel Tips, eSIM Guides & Telecom Insights',
  description: 'Explore the Fliday blog for expert travel tips, eSIM setup guides, and telecom insights to stay connected globally. Discover the best eSIM plans and travel hacks.',
  keywords: 'travel blog, eSIM guides, telecom insights, Fliday blog, eSIM plans, travel tips, global connectivity',
  robots: 'index, follow',
  openGraph: {
    title: 'Fliday Blog | Travel Tips, eSIM Guides & Telecom Insights',
    description: 'Explore the Fliday blog for expert travel tips, eSIM setup guides, and telecom insights to stay connected globally. Discover the best eSIM plans and travel hacks.',
    type: 'website',
    url: 'https://fliday.com/blog',
    images: ['https://fliday.com/images/blog-hero.jpg'],
    siteName: 'Fliday',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fliday Blog | Travel Tips, eSIM Guides & Telecom Insights',
    description: 'Explore the Fliday blog for expert travel tips, eSIM setup guides, and telecom insights to stay connected globally. Discover the best eSIM plans and travel hacks.',
    images: ['https://fliday.com/images/blog-hero.jpg'],
  },
  alternates: {
    canonical: 'https://fliday.com/blog',
  },
};

function Index() {
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
        name: 'Blog',
        item: 'https://fliday.com/blog',
      },
    ],
  };

  return (
    <div>
      {/* Schema Markup */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Blog />
    </div>
  );
}

export default Index;