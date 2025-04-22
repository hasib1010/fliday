// components/Layout/ClientLayout.js
"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Layout/Navbar";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <>
      {!isAdminRoute && <Navbar />}
      {children}
    </>
  );
}