// src/app/destinations/[id]/page.jsx
import { notFound } from 'next/navigation';
import DestinationDetail from '@/components/Destinations/DestinationDetail';

export async function generateMetadata({ params }) {
  const { id } = await params;

  // Reject file extension requests — these are static assets, not pages
  if (id?.includes('.')) notFound();

  const formattedTitle = id
    ? id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : 'Destination';

  return {
    title: `eSIM for ${formattedTitle} | Stay Connected While Traveling`,
    description: `Get reliable and affordable eSIM data plans for ${formattedTitle}. Instant activation, no contracts, and 24/7 support.`,
  };
}

export default async function DestinationDetailPage({ params }) {
  const { id } = await params;

  // Reject file extension requests
  if (id?.includes('.')) notFound();

  return <DestinationDetail params={{ id }} />;
}