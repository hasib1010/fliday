// app/recharge/page.js
import RechargePage from '@/components/Recharge/RechargePage';

export const metadata = {
  title: 'Recharge Your eSIM | Fliday',
  description: 'Instantly top up your eSIM data. No new QR codes needed - just choose your destination and continue browsing.',
};

export default function RechargePageRoute() {
  return <RechargePage />;
}