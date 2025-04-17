import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";
import { AuthProvider } from "@/providers/AuthProvider";

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
        <Navbar />
        <main>
          {children}
        </main>
        <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}