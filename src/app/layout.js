// app/layout.js
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import ClientLayout from "@/components/Layout/ClientLayout";
import ConditionalFooter from "@/components/Layout/ConditionalFooter"; 
import AnalyticsTracker from "@/components/Analytics/AnalyticsTracker";
const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata = {
  title: "Fliday: Your Travel eSIM Companion | Fast, Easy & Affordable Connectivity",
  description: "Say goodbye to roaming fees. Fliday offers instant eSIMs for 100+ countries. Get connected in minutes with affordable prepaid data plans starting at just $3.99.",
  keywords: [
    "esim",
    "travel esim",
    "international esim",
    "esim for travel",
    "buy esim online",
    "best esim",
    "digital sim",
    "global esim",
    "prepaid esim",
    "esim for iPhone",
    "esim for Android",
    "esim app",
    "instant esim delivery",
    "esim plans",
    "esim countries",
    "mobile data for travel",
    "no roaming charges",
    "travel sim",
    "e sim card",
    "virtual sim",
    "esim europe",
    "esim usa",
    "esim france",
    "esim japan",
    "esim canada",
    "esim australia",
    "esim for tourists",
    "data roaming alternative"
  ].join(", "),
  openGraph: {
    title: "Fliday: Your Travel eSIM Companion | Fast, Easy & Affordable Connectivity",
    description: "Say goodbye to roaming fees. Fliday offers instant eSIMs for 100+ countries. Get connected in minutes with affordable prepaid data plans starting at just $3.99.",
    url: 'https://fliday.com',
    siteName: 'Fliday',
    images: [
      {
        url: 'https://fliday.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Fliday eSIM - Your Travel Connectivity Companion',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: "summary_large_image",
    title: "Fliday: Your Travel eSIM Companion | Fast, Easy & Affordable Connectivity",
    description: "Say goodbye to roaming fees. Fliday offers instant eSIMs for 100+ countries. Get connected in minutes with affordable prepaid data plans starting at just $3.99.",
    images: ['https://fliday.com/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  verification: {

  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} antialiased font-poppins`}>
        <AuthProvider>
          <ClientLayout>
            <AnalyticsTracker />
            {children}
            <ConditionalFooter />
            <ConditionalFooter />
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}