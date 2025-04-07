// app/destinations/page.js
import AllDestinations from '@/components/Destinations/AllDestinations';

export const metadata = {
  title: 'All Destinations | Fliday',
  description: 'Explore eSIM plans for 100+ countries worldwide',
};

export default function DestinationsPage() {
  return <AllDestinations />;
}