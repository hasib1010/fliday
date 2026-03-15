// src/app/esim-europe/page.jsx
import RegionContent from '@/components/Destinations/RegionContent';

export const metadata = {
  title: 'Europe eSIM | Buy Online - Instant Activation | Fliday',
  description: 'Buy a prepaid eSIM for Europe. One plan covers all European countries. Instant activation, flexible data plans, no contracts.',
  alternates: { canonical: '/esim-europe' },
  openGraph: {
    title: 'Europe eSIM | Fliday',
    url: '	https://fliday.com/_next/image?url=%2Flogo.png&w=3840&q=75',
  },
};

export default async function EsimEuropePage({ searchParams }) {
  const { s: apiSlug } = await searchParams;
  return (
    <RegionContent
      urlSlug="europe"
      displayName="Europe"
      apiSlug={apiSlug || null}
    />
  );
}