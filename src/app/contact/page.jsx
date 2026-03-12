import ContactPage from '@/components/Contact/ContactPage';

export const metadata = {
  title: 'Contact Support – Travel eSIM Help & Assistance',
  description:
    'Contact our support team for help with activating your eSIM, troubleshooting connectivity issues, or questions about travel eSIM data plans.',
  alternates: {
    canonical: 'https://fliday.com/contact',
  },
  openGraph: {
    title: 'Contact Support – Travel eSIM Help',
    description:
      'Need help activating your eSIM or managing your travel data plan? Contact our support team.',
    url: 'https://fliday.com/contact',
    siteName: 'Fliday',
    type: 'website',
  },
};

export default function Page() {
  return <ContactPage />;
}