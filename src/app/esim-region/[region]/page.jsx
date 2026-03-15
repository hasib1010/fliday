// src/app/esim-region/[region]/page.jsx
// Fully dynamic — accepts any region slug the API returns
// e.g. /esim-region/usa-canada?s=NA-3_1_7
//      /esim-region/middle-east?s=ME-30_1_7
//      /esim-region/asia?s=AS-7_1_7

import { getRegionDisplayName } from '@/lib/regionSlugMap';
import RegionContent from '@/components/Destinations/RegionContent';

export async function generateMetadata({ params, searchParams }) {
  const { region } = await params;
  const name = getRegionDisplayName(region);
  return {
    title: `${name} eSIM | Buy Online - Instant Activation | Fliday`,
    description: `Buy a prepaid eSIM for ${name}. One plan covers all countries in the region. Instant activation, flexible data plans, no contracts.`,
    alternates: { canonical: `/esim-region/${region}` },
    openGraph: {
      title: `${name} eSIM | Fliday`,
      url: `https://fliday.com/esim-region/${region}`,
    },
  };
}

export default async function EsimRegionPage({ params, searchParams }) {
  const { region } = await params;
  const { s: apiSlug } = await searchParams;

  // Derive display name from slug — falls back to title-casing the slug
  const displayName = getRegionDisplayName(region);

  return (
    <RegionContent
      urlSlug={region}
      displayName={displayName}
      apiSlug={apiSlug || null}
    />
  );
}