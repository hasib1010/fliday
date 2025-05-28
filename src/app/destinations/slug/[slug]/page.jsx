// app/destinations/slug/[slug]/page.js (Server Component)
import RegionSlugClient from './RegionSlugClient';

// Helper function to extract region name from slug
function getRegionNameFromSlug(slug) {
  if (!slug) return 'Region';
  
  // Handle the format like "AS-7_1_7" or "GL-120_10_30" where the prefix is the region code
  const slugParts = slug.split(/[-_]/);
  const regionCode = slugParts[0].toUpperCase();
  
  // Map region codes to readable names
  const regionCodeMappings = {
    'AS': 'Asia',
    'EU': 'Europe', 
    'AF': 'Africa',
    'NA': 'North America',
    'SA': 'South America',
    'OC': 'Oceania',
    'ME': 'Middle East',
    'GL': 'Global',        // Global packages start with GL-
    'WW': 'Global',
    'AP': 'Asia Pacific',
    'CA': 'Caribbean',
    'GF': 'Gulf Countries',
    'INT': 'International'
  };
  
  // Check if we have a direct mapping for the region code
  if (regionCodeMappings[regionCode]) {
    return regionCodeMappings[regionCode];
  }
  
  // Fallback: try to extract meaningful name from full slug
  const regionMappings = {
    'europe': 'Europe',
    'asia': 'Asia',
    'asia_pacific': 'Asia Pacific',
    'north_america': 'North America',
    'south_america': 'South America',
    'middle_east': 'Middle East',
    'africa': 'Africa',
    'caribbean': 'Caribbean',
    'global': 'Global',
    'gulf': 'Gulf Countries',
    'oceania': 'Oceania',
    'worldwide': 'Global'
  };
  
  const slugLower = slug.toLowerCase().replace(/[-_]/g, '_');
  for (const [key, value] of Object.entries(regionMappings)) {
    if (slugLower.includes(key)) {
      return value;
    }
  }
  
  // Final fallback: use the region code or convert slug to title case
  if (regionCode && regionCode.length <= 3) {
    return regionCode; // Keep short codes as-is
  }
  
  return slug
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Determine if this is a global package
function isGlobalPackage(regionName, slug) {
  const globalTerms = ['global', 'worldwide', 'international', 'universal'];
  const name = regionName.toLowerCase();
  const slugLower = slug.toLowerCase();
  
  // Check if slug starts with GL- (Global packages)
  if (slugLower.startsWith('gl-')) {
    return true;
  }
  
  return globalTerms.some(term => 
    name.includes(term) || slugLower.includes(term)
  );
}

// Fetch region metadata from API
async function getRegionMetadata(slug) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fliday.com';
    
    // Fetch packages for this region
    const response = await fetch(
      `${baseUrl}/api/esim/packages?slug=${slug}`,
      { 
        next: { revalidate: 3600 }, // Cache for 1 hour
        headers: {
          'User-Agent': 'Fliday-SEO-Bot/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch region packages');
    }
    
    const data = await response.json();
    
    if (data.success && data.data.length > 0) {
      const packages = data.data;
      
      // Get pricing info
      const prices = packages.map(pkg => 
        typeof pkg.price === 'number' ? pkg.price / 10000 : parseFloat(pkg.price) || 0
      ).filter(price => price > 0);
      
      const dataAmounts = packages.map(pkg => 
        parseFloat(pkg.dataAmount?.replace('GB', '').trim()) || 0
      ).filter(amount => amount > 0);
      
      // Extract countries from first package if available
      let countries = [];
      const firstPackage = packages[0];
      if (firstPackage.location) {
        countries = firstPackage.location.split(',').map(c => c.trim());
      } else if (firstPackage.locations && firstPackage.locations.length > 0) {
        countries = firstPackage.locations;
      }
      
      return {
        startingPrice: Math.min(...prices).toFixed(2),
        maxPrice: Math.max(...prices).toFixed(2),
        currency: packages[0].currency || 'USD',
        minData: Math.min(...dataAmounts),
        maxData: Math.max(...dataAmounts),
        packageCount: packages.length,
        durations: [...new Set(packages.map(pkg => pkg.duration))].join(', '),
        countries: countries.slice(0, 10), // Limit for metadata
        totalCountries: countries.length
      };
    }
  } catch (error) {
    console.error('Error fetching region metadata:', error);
  }
  
  // Fallback data
  return {
    startingPrice: "7.99",
    maxPrice: "49.99", 
    currency: "USD",
    minData: 1,
    maxData: 20,
    packageCount: 5,
    durations: "7, 15, 30",
    countries: [],
    totalCountries: 0
  };
}

// Generate metadata for region pages
export async function generateMetadata({ params }) {
  const slug = params.slug;
  const regionName = getRegionNameFromSlug(slug);
  const isGlobal = isGlobalPackage(regionName, slug);
  const metadata = await getRegionMetadata(slug);
  
  // Create SEO-optimized title and description
  let title, description;
  
  if (isGlobal) {
    title = `Buy Global eSIM – Instant Activation | Fliday`;
    description = `Get a prepaid Global eSIM with instant delivery. Coverage in ${metadata.totalCountries > 0 ? `${metadata.totalCountries}+ countries` : '100+ countries'}. Starting from ${metadata.currency} ${metadata.startingPrice}. Perfect for tourists, business travelers, and digital nomads.`;
  } else {
    title = `Buy eSIM for ${regionName} – Instant Activation | Fliday`;
    description = `Get a prepaid ${regionName} eSIM with instant delivery. ${metadata.packageCount} regional plans available from ${metadata.minData}GB to ${metadata.maxData}GB. Starting from ${metadata.currency} ${metadata.startingPrice}. Perfect for tourists, business travelers, and digital nomads.`;
  }
  
  // Generate comprehensive keywords
  const baseKeywords = [
    'travel eSIM',
    'regional eSIM',
    'prepaid eSIM',
    'international eSIM',
    'eSIM activation',
    'virtual SIM card',
    'data roaming alternative',
    'travel connectivity',
    'mobile data plan',
    'instant eSIM delivery',
    'multi-country eSIM',
    'border-free connectivity'
  ];
  
  const regionSpecificKeywords = isGlobal ? [
    'global eSIM',
    'worldwide eSIM',
    'international eSIM',
    'global data plan',
    'worldwide connectivity',
    'global roaming',
    'international travel SIM',
    'global mobile data',
    'worldwide travel eSIM'
  ] : [
    `${regionName} eSIM`,
    `eSIM ${regionName}`,
    `${regionName} travel SIM`,
    `${regionName} regional eSIM`,
    `${regionName} data plan`,
    `${regionName} connectivity`,
    `regional eSIM ${regionName}`,
    `travel SIM ${regionName}`,
    `${regionName} mobile data`,
    `${regionName} multi-country eSIM`
  ];
  
  // Add country-specific keywords if available
  const countryKeywords = metadata.countries.flatMap(country => [
    `${country} eSIM`,
    `eSIM ${country}`
  ]);
  
  const keywords = [...baseKeywords, ...regionSpecificKeywords, ...countryKeywords];
  
  return {
    title,
    description,
    keywords: keywords.join(', '),
    
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'en_US',
      url: `https://fliday.com/destinations/slug/${slug}`,
      siteName: 'Fliday',
      images: [
        {
          url: getRegionImageUrl(regionName, isGlobal, slug),
          width: 1200,
          height: 630,
          alt: `${regionName} eSIM plans starting from ${metadata.currency} ${metadata.startingPrice} - Fliday`,
        }
      ],
    },
    
    twitter: {
      card: 'summary_large_image',
      title: isGlobal 
        ? `Global eSIM from ${metadata.currency} ${metadata.startingPrice} | Fliday`
        : `${regionName} eSIM from ${metadata.currency} ${metadata.startingPrice} | Fliday`,
      description: isGlobal
        ? `Get instant Global eSIM with ${metadata.packageCount} data plans. Works in ${metadata.totalCountries}+ countries.`
        : `Get instant ${regionName} eSIM with ${metadata.packageCount} regional plans. ${metadata.minData}GB-${metadata.maxData}GB options available.`,
      images: [getRegionImageUrl(regionName, isGlobal, slug)],
    },
    
    alternates: {
      canonical: `https://fliday.com/destinations/slug/${slug}`,
    },
    
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    // Additional SEO metadata
    other: {
      'price': metadata.startingPrice,
      'priceCurrency': metadata.currency,
      'availability': 'InStock',
      'product:category': isGlobal ? 'Global eSIM' : 'Regional eSIM',
      'product:region': regionName,
      'product:coverage': metadata.totalCountries > 0 ? `${metadata.totalCountries} countries` : 'Multiple countries',
    },
  };
}

// Helper function to get region image URL
function getRegionImageUrl(regionName, isGlobal, slug) {
  if (isGlobal) {
    return 'https://fliday.com/flags/global_flag.svg';
  }
  
  // Extract region code from slug (e.g., "AS" from "AS-7_1_7")
  const regionCode = slug ? slug.split(/[-_]/)[0].toUpperCase() : '';
  
  const regionImageMap = {
    'Europe': '/flags/europe_flag.svg',
    'Asia': '/flags/asia_flag.svg',
    'Asia Pacific': '/flags/asia_flag.svg',
    'North America': '/flags/north_america_flag.svg',
    'South America': '/flags/south_america_flag.svg',
    'Middle East': '/flags/middle_east_flag.svg',
    'Africa': '/flags/africa_flag.svg',
    'Caribbean': '/flags/caribbean_flag.svg',
    'Gulf Countries': '/flags/middle_east_flag.svg',
    'Oceania': '/flags/oceania_flag.svg'
  };
  
  // Try to map by region name first
  if (regionImageMap[regionName]) {
    return `https://fliday.com${regionImageMap[regionName]}`;
  }
  
  // Try to map by region code
  const codeImageMap = {
    'AS': '/flags/asia_flag.svg',
    'EU': '/flags/europe_flag.svg',
    'AF': '/flags/africa_flag.svg',
    'NA': '/flags/north_america_flag.svg',
    'SA': '/flags/south_america_flag.svg',
    'OC': '/flags/oceania_flag.svg',
    'ME': '/flags/middle_east_flag.svg',
    'GL': '/flags/global_flag.svg',
    'WW': '/flags/global_flag.svg',
    'AP': '/flags/asia_flag.svg',
    'CA': '/flags/caribbean_flag.svg',
    'GF': '/flags/middle_east_flag.svg'
  };
  
  if (codeImageMap[regionCode]) {
    return `https://fliday.com${codeImageMap[regionCode]}`;
  }
  
  return 'https://fliday.com/flags/default.jpg';
}

// Generate static params for popular regions
export async function generateStaticParams() {
  // We can't predict all possible slug formats like "AS-7_1_7" without knowing your data
  // So we'll return an empty array to let Next.js generate them on-demand
  // If you want to pre-generate specific slugs, you can fetch them from your API here
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fliday.com';
    
    // Fetch all available region slugs from your API if you have an endpoint for that
    // For now, return empty array to generate on-demand
    return [];
    
    /* 
    // Alternative: If you have a list of known slugs, you can add them here:
    const knownSlugs = [
      'AS-7_1_7',
      'EU-5_2_10',
      'NA-3_1_5',
      // ... add your actual slugs
    ];
    
    return knownSlugs.map((slug) => ({
      slug: slug,
    }));
    */
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Server component - just passes data to client component
export default function RegionSlugPage({ params }) {
  const slug = params.slug;
  const regionName = getRegionNameFromSlug(slug);
  const isGlobal = isGlobalPackage(regionName, slug);
  
  return (
    <RegionSlugClient 
      slug={slug}
      regionName={regionName}
      isGlobal={isGlobal}
    />
  );
}