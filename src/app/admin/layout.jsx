import { headers } from 'next/headers';

export default function AdminRootLayout({ children }) {
  // This layout wraps all /admin/* routes and prevents the footer
  return <>{children}</>;
}