// app/sitemap.js
import { headers } from 'next/headers';
import { slugToCountry } from '@/lib/countrySlugMap';

// Dedicated top-level pages (esim-europe/page.jsx, esim-global/page.jsx)
const DEDICATED_REGION_PAGES = ['europe', 'global'];

// All other regions use /esim-region/[region] route
const NESTED_REGION_SLUGS = [
  'asia',
  'africa',
  'north-america',
  'south-america',
  'latin-america',
  'middle-east',
  'caribbean',
  'oceania',
  'asia-pacific',
  'gulf-countries',
];

export default async function sitemap() {
  const headersList = await headers();
  const domain      = headersList.get('host') || 'fliday.com';
  const protocol    = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const baseUrl     = `${protocol}://${domain}`;

  // ── Static pages ───────────────────────────────────────────────────────────
  const staticPages = [
    { url: baseUrl,                           priority: 1.0 },
    { url: `${baseUrl}/destinations`,         priority: 0.9 },
    { url: `${baseUrl}/blog`,                 priority: 0.9 },
    { url: `${baseUrl}/how-it-works`,         priority: 0.8 },
    { url: `${baseUrl}/compatibility`,        priority: 0.8 },
    { url: `${baseUrl}/faq`,                  priority: 0.7 },
    { url: `${baseUrl}/support`,              priority: 0.7 },
    { url: `${baseUrl}/privacy-policy`,       priority: 0.3 },
    { url: `${baseUrl}/terms-of-service`,     priority: 0.3 },
    { url: `${baseUrl}/contact`,              priority: 0.6 },
  ].map(p => ({
    url: p.url,
    lastModified:    new Date(),
    changeFrequency: p.priority >= 0.9 ? 'daily' : 'weekly',
    priority:        p.priority,
  }));

  // ── Country pages  /esim-country/[slug] ───────────────────────────────────
  const countryPages = Object.keys(slugToCountry).map(slug => ({
    url:             `${baseUrl}/esim-${slug}`,
    lastModified:    new Date(),
    changeFrequency: 'weekly',
    priority:        0.8,
  }));

  // ── Dedicated region pages  /esim-europe  /esim-global ────────────────────
  const dedicatedRegionPages = DEDICATED_REGION_PAGES.map(slug => ({
    url:             `${baseUrl}/esim-${slug}`,
    lastModified:    new Date(),
    changeFrequency: 'weekly',
    priority:        0.75,
  }));

  // ── Nested region pages  /esim-region/[region] ────────────────────────────
  const nestedRegionPages = NESTED_REGION_SLUGS.map(slug => ({
    url:             `${baseUrl}/esim-region/${slug}`,
    lastModified:    new Date(),
    changeFrequency: 'weekly',
    priority:        0.75,
  }));

  // ── Blog posts ─────────────────────────────────────────────────────────────
  let blogPosts = [];
  try {
    const res = await fetch(`${baseUrl}/api/internal/blog-list`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const posts = await res.json();
      blogPosts = posts.map(post => ({
        url:             `${baseUrl}/blog/${post.slug}`,
        lastModified:    new Date(post.date),
        changeFrequency: 'monthly',
        priority:        0.7,
      }));
    }
  } catch (err) {
    console.warn('Sitemap: Could not load blog posts', err.message);
  }

  return [
    ...staticPages,
    ...countryPages,
    ...dedicatedRegionPages,
    ...nestedRegionPages,
    ...blogPosts,
  ];
}

export const revalidate = 600;