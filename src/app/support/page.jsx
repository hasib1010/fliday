// app/support/page.js
import Support from '@/components/Support/Support';

export const metadata = {
  title: 'eSIM Support – Help, Setup & Troubleshooting',

  description:
    'Get help with activating your eSIM, troubleshooting connectivity issues, or setting up eSIM on iPhone and Android devices.',

  alternates: {
    canonical: 'https://fliday.com/support',
  },

  openGraph: {
    title: 'eSIM Support – Help & Troubleshooting',
    description:
      'Need help activating your eSIM or fixing connectivity issues? Visit our support center for setup guides and answers.',
    url: 'https://fliday.com/support',
    siteName: 'Fliday',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'eSIM Support – Setup & Troubleshooting',
    description:
      'Find help for activating your eSIM, troubleshooting issues, and setting up eSIM on iPhone or Android.',
  },
};

export default function SupportPage() {
  return <Support />;
}