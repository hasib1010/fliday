// app/destinations/[id]/page.js
import DestinationDetail from '@/components/Destinations/DestinationDetail';

export async function generateMetadata({ params }) {
  try {
    // Safely access params.id with optional chaining
    const id = params?.id || 'default';
    
    // Format the destination name for the metadata
    const formattedTitle = id
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return {
      title: `eSIM for ${formattedTitle} | Fliday`,
      description: `Get affordable and reliable eSIM data plans for ${formattedTitle}. Instant activation, no roaming fees.`
    };
  } catch (error) {
    // Fallback metadata if there's an error
    console.error('Error generating metadata:', error);
    return {
      title: 'eSIM Details | Fliday',
      description: 'Get affordable and reliable eSIM data plans. Instant activation, no roaming fees.'
    };
  }
}

export default function DestinationDetailPage({ params }) {
  // Ensure params is properly passed to the component
  return <DestinationDetail params={params} />;
}