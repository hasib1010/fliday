import DestinationDetail from '@/components/Destinations/DestinationDetail';

export async function generateMetadata({ params }) {
  try {
    // In Next.js 13+, the params object itself is not a promise, but we need to destructure it properly
    const { id } = params;

    // Format the destination name for the metadata
    const formattedTitle = id
      ? id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      : 'Destination';

    return {
      title: `eSIM for ${formattedTitle} | Stay Connected While Traveling`,
      description: `Get reliable and affordable eSIM data plans for ${formattedTitle}. Instant activation, no contracts, and 24/7 support.`,
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "eSIM for Travel | Stay Connected Worldwide",
      description: "Get reliable and affordable eSIM data plans for your travels. Instant activation, no contracts, and 24/7 support.",
    };
  }
}

// In Next.js App Router, for server components like page.js, we don't need 'use client'
export default function DestinationDetailPage({ params }) {
  // Pass params directly to the DestinationDetail component
  return <DestinationDetail params={params} />;
}