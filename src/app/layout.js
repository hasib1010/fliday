import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";

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
    <html lang="en">
      <body className={`${poppins.variable} antialiased font-poppins max-w-[1440px] mx-auto `}>
        <Navbar />
        {children}
        <Footer/>
      </body>
    </html>
  );
}