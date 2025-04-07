// app/recharge/[id]/page.js
import RechargeDetail from '@/components/Recharge/RechargeDetail';

export async function generateMetadata({ params }) {
    try {
        // Await the params before accessing properties
        const resolvedParams = await params;
        const id = resolvedParams?.id || 'default';

        const formattedTitle = id
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        return {
            title: `Recharge eSIM for ${formattedTitle} | Fliday`,
            description: `Quickly recharge your eSIM for ${formattedTitle}. Instant top-up with no new QR codes needed.`
        };
    } catch (error) {
        console.error('Error generating metadata:', error);
        return {
            title: 'Recharge eSIM | Fliday',
            description: 'Quickly recharge your eSIM. Instant top-up with no new QR codes needed.'
        };
    }
}

export default function RechargeDetailPage({ params }) {
    return <RechargeDetail params={params} />;
}