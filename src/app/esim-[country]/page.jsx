// src/app/(countries)/esim-[country]/page.jsx
// URLs: /esim-australia, /esim-turkey, /esim-germany etc.

import { notFound } from 'next/navigation';
import { getCountryBySlug } from '@/lib/countrySlugMap';
import DestinationCountryContent from '@/components/Destinations/DestinationCountryContent';

export async function generateMetadata({ params }) {
  const { country: slug } = await params;
  const country = getCountryBySlug(slug);
  if (!country) return { title: 'eSIM | Stay Connected While Traveling' };
  return {
    title: `eSIM for ${country.name} | Buy Online - Instant Activation | Fliday`,
    description: `Buy a prepaid eSIM for ${country.name}. Instant activation, flexible data plans, no contracts. Stay connected from just $3.99.`,
    alternates: { canonical: `/esim-${slug}` },
    openGraph: {
      title: `eSIM for ${country.name} | Fliday`,
      description: `Get connected in ${country.name} with a prepaid eSIM. Instant delivery, no roaming fees.`,
      url: `https://fliday.com/esim-${slug}`,
    },
  };
}

export default async function EsimCountryPage({ params }) {
  const { country: slug } = await params;
  const country = getCountryBySlug(slug);
  if (!country) notFound();
  return (
    <DestinationCountryContent
      params={{ code: country.code, name: country.name }}
    />
  );
}