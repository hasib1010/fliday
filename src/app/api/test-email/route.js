// app/api/test-email/route.js
import { NextResponse } from 'next/server';
import { sendESIMEmail } from '@/lib/email';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email') || 'test@example.com';

        console.log('='.repeat(80));
        console.log('TEST EMAIL ROUTE - Starting test');
        console.log('='.repeat(80));

        // Check environment variables
        console.log('\n[1] Checking environment variables:');
        const envCheck = {
            BREVO_SMTP_HOST: process.env.BREVO_SMTP_HOST || 'MISSING',
            BREVO_SMTP_PORT: process.env.BREVO_SMTP_PORT || 'MISSING',
            BREVO_SMTP_USER: process.env.BREVO_SMTP_USER || 'MISSING',
            BREVO_SMTP_PASSWORD: process.env.BREVO_SMTP_PASSWORD ?
                `${process.env.BREVO_SMTP_PASSWORD.substring(0, 10)}...` : 'MISSING',
            NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'MISSING'
        };
        console.log(JSON.stringify(envCheck, null, 2));

        // Check for missing variables
        const missing = Object.entries(envCheck)
            .filter(([key, value]) => value === 'MISSING')
            .map(([key]) => key);

        if (missing.length > 0) {
            console.log('\n❌ MISSING ENVIRONMENT VARIABLES:', missing);
            return NextResponse.json({
                success: false,
                error: 'Missing environment variables',
                missing,
                help: 'Add these to your .env.local file'
            }, { status: 500 });
        }

        console.log('✅ All environment variables present\n');

        // Prepare test eSIM data
        console.log('[2] Preparing test eSIM data...');
        const testData = {
            orderId: 'TEST-' + Date.now(),
            packageName: 'Bangladesh 1GB 7 Days',
            location: 'BD',
            dataAmount: '1GB',
            duration: '7 Days',
            qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=LPA:1$smdp.example.com$12345678',
            iccid: '8944501234567890123',
            smdpAddress: 'smdp.example.com',
            activationCode: 'TEST-ACTIVATION-CODE-12345',
            apn: 'internet',
            pin: '1234',
            puk: '12345678'
        };

        console.log('Test data:', {
            orderId: testData.orderId,
            location: testData.location,
            hasQrCode: !!testData.qrCode
        });

        // Send test email
        console.log('\n[3] Attempting to send test email...');
        console.log('Recipient:', email);

        const result = await sendESIMEmail(email, testData);

        if (result) {
            console.log('\n' + '='.repeat(80));
            console.log('✅ TEST PASSED - Email sent successfully!');
            console.log('='.repeat(80));

            return NextResponse.json({
                success: true,
                message: 'Test email sent successfully!',
                details: {
                    recipient: email,
                    orderId: testData.orderId,
                    envCheck,
                    note: 'Check your email inbox (and spam folder)'
                }
            });
        } else {
            console.log('\n' + '='.repeat(80));
            console.log('❌ TEST FAILED - Email function returned false');
            console.log('='.repeat(80));

            return NextResponse.json({
                success: false,
                error: 'Email function returned false',
                details: {
                    recipient: email,
                    envCheck,
                    note: 'Check server console for detailed error logs'
                }
            }, { status: 500 });
        }

    } catch (error) {
        console.error('\n' + '='.repeat(80));
        console.error('❌ TEST FAILED - Exception thrown');
        console.error('='.repeat(80));
        console.error('Error:', error);
        console.error('Stack:', error.stack);

        return NextResponse.json({
            success: false,
            error: error.message,
            code: error.code,
            details: {
                type: error.constructor.name,
                message: error.message,
                code: error.code,
                command: error.command,
                response: error.response
            }
        }, { status: 500 });
    }
}