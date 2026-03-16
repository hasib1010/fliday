// src/app/esim-global/page.jsx
import RegionContent from '@/components/Destinations/RegionContent';

export const metadata = {
  title: 'Global eSIM | Buy Online - Instant Activation | Fliday',
  description: 'Buy a global prepaid eSIM. One plan covers 120+ countries worldwide. Instant activation, flexible data plans, no contracts.',
  alternates: { canonical: '/esim-global' },
  openGraph: {
    title: 'Global eSIM | Fliday',
    url: 'https://fliday.com/esim-global',
  },
};

export default async function EsimGlobalPage({ searchParams }) {
  const { s: apiSlug } = await searchParams;
  return (
    <RegionContent
      urlSlug="global"
      displayName="Global"
      apiSlug={apiSlug || null}
    />
  );
}