// app/layout.js
import { Poppins } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Layout/Footer";
import { AuthProvider } from "@/providers/AuthProvider";
import ClientLayout from "@/components/Layout/ClientLayout"; // New client component

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata = {
  title: "Fliday",
  description: "ESim for travelers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} antialiased font-poppins mx-auto`}>
        <AuthProvider>
          <ClientLayout>
            <main>{children}</main>
            <Footer />
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}