// app/api/test-smtp/route.js
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email') || 'test@example.com';

        console.log('\n' + '='.repeat(80));
        console.log('SMTP CONNECTION TEST');
        console.log('='.repeat(80));

        // Step 1: Check environment variables
        console.log('\n[Step 1] Environment Variables:');
        const config = {
            host: process.env.BREVO_SMTP_HOST,
            port: process.env.BREVO_SMTP_PORT,
            user: process.env.BREVO_SMTP_USER,
            hasPassword: !!process.env.BREVO_SMTP_PASSWORD,
            passwordLength: process.env.BREVO_SMTP_PASSWORD?.length || 0,
            passwordPrefix: process.env.BREVO_SMTP_PASSWORD?.substring(0, 10) || 'MISSING'
        };

        console.log(JSON.stringify(config, null, 2));

        // Check for issues
        const issues = [];
        if (!config.host) issues.push('BREVO_SMTP_HOST is missing');
        if (!config.port) issues.push('BREVO_SMTP_PORT is missing');
        if (!config.user) issues.push('BREVO_SMTP_USER is missing');
        if (!config.hasPassword) issues.push('BREVO_SMTP_PASSWORD is missing');
        if (config.passwordLength < 30) issues.push('BREVO_SMTP_PASSWORD seems too short (should be 40-60 chars)');

        if (issues.length > 0) {
            console.log('\n❌ CONFIGURATION ISSUES:');
            issues.forEach(issue => console.log(`  - ${issue}`));

            return NextResponse.json({
                success: false,
                error: 'Configuration issues',
                issues,
                config,
                help: {
                    message: 'Fix these issues in your .env.local file',
                    example: {
                        BREVO_SMTP_HOST: 'smtp-relay.brevo.com',
                        BREVO_SMTP_PORT: '587',
                        BREVO_SMTP_USER: 'your-email@example.com',
                        BREVO_SMTP_PASSWORD: 'xsmtpsib-your-smtp-key-here (NOT your account password!)'
                    }
                }
            }, { status: 500 });
        }

        console.log('✅ Configuration looks good');

        // Step 2: Create transporter
        console.log('\n[Step 2] Creating transporter...');
        const transporter = nodemailer.createTransport({
            host: config.host,
            port: parseInt(config.port),
            secure: false,
            auth: {
                user: config.user,
                pass: process.env.BREVO_SMTP_PASSWORD,
            },
            debug: true,
            logger: true
        });

        console.log('✅ Transporter created');

        // Step 3: Verify connection
        console.log('\n[Step 3] Verifying SMTP connection...');
        try {
            await transporter.verify();
            console.log('✅ SMTP connection verified successfully!');
        } catch (verifyError) {
            console.error('❌ SMTP verification failed:', verifyError);

            return NextResponse.json({
                success: false,
                error: 'SMTP connection failed',
                details: {
                    message: verifyError.message,
                    code: verifyError.code,
                    command: verifyError.command
                },
                help: getErrorHelp(verifyError)
            }, { status: 500 });
        }

        // Step 4: Send test email
        console.log('\n[Step 4] Sending test email to:', email);
        const info = await transporter.sendMail({
            from: `"Fliday Test" <support@fliday.com>`,
            to: email,
            subject: 'SMTP Test - ' + new Date().toLocaleString(),
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #F15A25;">✅ SMTP Test Successful!</h1>
          <p>If you're reading this, your Brevo SMTP configuration is working correctly!</p>
          
          <div style="background-color: #f7f7f7; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2>Test Details</h2>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>SMTP Host:</strong> ${config.host}</p>
            <p><strong>SMTP Port:</strong> ${config.port}</p>
            <p><strong>From:</strong> support@fliday.com</p>
            <p><strong>To:</strong> ${email}</p>
          </div>
          
          <p>Your email configuration is working! You can now send eSIM emails to customers.</p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This is an automated test email from your Fliday eSIM platform.
          </p>
        </div>
      `
        });

        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);

        console.log('\n' + '='.repeat(80));
        console.log('✅ ALL TESTS PASSED!');
        console.log('='.repeat(80) + '\n');

        return NextResponse.json({
            success: true,
            message: 'SMTP test successful! Check your email inbox.',
            details: {
                messageId: info.messageId,
                response: info.response,
                recipient: email,
                config: {
                    host: config.host,
                    port: config.port,
                    user: config.user
                }
            }
        });

    } catch (error) {
        console.error('\n' + '='.repeat(80));
        console.error('❌ SMTP TEST FAILED');
        console.error('='.repeat(80));
        console.error('Error:', error);

        return NextResponse.json({
            success: false,
            error: error.message,
            details: {
                type: error.constructor.name,
                message: error.message,
                code: error.code,
                command: error.command,
                response: error.response,
                responseCode: error.responseCode
            },
            help: getErrorHelp(error)
        }, { status: 500 });
    }
}

function getErrorHelp(error) {
    const errorCode = error.code || error.responseCode;
    const errorMsg = error.message?.toLowerCase() || '';

    if (errorMsg.includes('invalid login') || errorCode === 535) {
        return {
            issue: 'Invalid SMTP credentials',
            solution: 'Make sure you\'re using your SMTP KEY (starts with xsmtpsib-), NOT your account password!',
            steps: [
                'Go to https://app.brevo.com',
                'Navigate to Settings → SMTP & API',
                'Click the SMTP tab',
                'Copy your SMTP Key (it starts with xsmtpsib-)',
                'Update BREVO_SMTP_PASSWORD in .env.local',
                'Restart your server'
            ]
        };
    }

    if (errorMsg.includes('sender') || errorMsg.includes('from address')) {
        return {
            issue: 'Sender email not verified',
            solution: 'Verify support@fliday.com in your Brevo account',
            steps: [
                'Go to https://app.brevo.com',
                'Navigate to Senders & IP',
                'Add support@fliday.com',
                'Verify it via the confirmation email',
                'Try again'
            ]
        };
    }

    if (errorMsg.includes('enotfound') || errorMsg.includes('getaddrinfo')) {
        return {
            issue: 'Cannot resolve SMTP host',
            solution: 'Check your BREVO_SMTP_HOST setting',
            steps: [
                'Verify BREVO_SMTP_HOST=smtp-relay.brevo.com',
                'Check your internet connection',
                'Make sure there are no typos'
            ]
        };
    }

    if (errorMsg.includes('timeout') || errorMsg.includes('etimedout')) {
        return {
            issue: 'Connection timeout',
            solution: 'Port might be blocked or wrong',
            steps: [
                'Verify BREVO_SMTP_PORT=587',
                'Check if your firewall is blocking port 587',
                'Try port 465 with secure: true'
            ]
        };
    }

    return {
        issue: 'Unknown error',
        solution: 'Check the error details above',
        steps: [
            'Review your .env.local file',
            'Make sure all Brevo credentials are correct',
            'Restart your development server',
            'Check Brevo dashboard for any account issues'
        ]
    };
}