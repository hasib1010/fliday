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
  title: "Fliday: Travel eSIM for 100+ Countries | Instant Prepaid Data",
  description:
    "Buy travel eSIMs for 100+ countries with instant activation. Affordable prepaid data plans for iPhone and Android with no roaming fees.",

  alternates: {
    canonical: "https://fliday.com",
  },

  openGraph: {
    title: "Travel eSIM for 100+ Countries | Instant Prepaid Data – Fliday",
    description:
      "Buy travel eSIMs for 100+ countries with instant activation. Affordable prepaid data plans for iPhone and Android with no roaming fees.",
    url: "https://fliday.com",
    siteName: "Fliday",
    images: [
      {
        url: "https://fliday.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fliday travel eSIM",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Travel eSIM for 100+ Countries | Instant Prepaid Data – Fliday",
    description:
      "Buy travel eSIMs for 100+ countries with instant activation and affordable prepaid data plans.",
    images: ["https://fliday.com/og-image.png"],
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
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}