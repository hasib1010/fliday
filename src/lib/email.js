// src/lib/email.js
import nodemailer from 'nodemailer';

// Configure email transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.sendgrid.net',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send eSIM details to customer via email
 */
export async function sendESIMEmail(email, esimData) {
  if (!email || !esimData) {
    console.error('Missing email or eSIM data for sending email');
    return false;
  }

  try {
    const { orderId, packageName, location, dataAmount, duration, qrCode, iccid, apn, pin, puk, smdpAddress, activationCode } = esimData;

    // Format the HTML email body using the provided template
    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your eSIM Flame is Ready</title>
    <style>
        /* Base Styles */
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            margin: 0;
            padding: 0;
            line-height: 1.6;
        }
        
        /* Flame-inspired Gradient */
        .flame-gradient {
            background: linear-gradient(135deg, #ff5e00 0%, #ff3c00 50%, #ff1a00 100%);
        }
        
        /* Card Styles */
        .card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.05);
            overflow: hidden;
            margin-bottom: 24px;
        }
        
        .card-header {
            padding: 20px;
            border-bottom: 1px solid #f1f5f9;
            font-weight: 600;
            display: flex;
            align-items: center;
        }
        
        .card-icon {
            width: 24px;
            height: 24px;
            margin-right: 12px;
        }
        
        .card-body {
            padding: 20px;
        }
        
        /* Navigation Links */
        .nav-links {
            padding: 16px 0;
            text-align: center;
        }
        
        .nav-links a {
            color: #ff5e00;
            text-decoration: none;
            font-weight: 600;
            margin: 0 16px;
            font-size: 15px;
        }
        
        /* Tip Boxes */
        .tip-container {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin: 24px 0;
        }
        
        .tip-box {
            flex: 1;
            min-width: 200px;
            background: #fff7ed;
            border-radius: 12px;
            padding: 16px;
            display: flex;
            align-items: flex-start;
        }
        
        .tip-icon {
            width: 24px;
            height: 24px;
            margin-right: 12px;
            flex-shrink: 0;
        }
        
        /* Unique Flame Elements */
        .flame-divider {
            height: 4px;
            background: linear-gradient(90deg, #ff5e00 0%, #ff3c00 50%, #ff1a00 100%);
            border-radius: 2px;
            margin: 24px 0;
        }
        
        /* QR Code Section */
        .qr-container {
            text-align: center;
            padding: 32px 0 16px;
        }
        
        .qr-code {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 12px;
            display: inline-block;
            margin: 0 auto 20px;
        }
        
        .steps {
            max-width: 400px;
            margin: 0 auto;
            text-align: center;
            padding: 0;
            list-style-position: inside;
        }
        
        /* Responsive Adjustments */
        @media only screen and (max-width: 640px) {
            .responsive-column {
                display: block !important;
                width: 100% !important;
            }
            .mobile-padding {
                padding: 16px !important;
            }
            .mobile-center {
                text-align: center !important;
            }
            .card {
                border-radius: 12px !important;
            }
            .nav-links a {
                display: inline-block;
                margin: 8px 12px;
            }
            .tip-box {
                min-width: 100%;
            }
        }
    </style>
</head>
<body style="margin:0; padding:0; font-family:'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color:#f8fafc; color:#1e293b; line-height:1.6;">

<!-- Main Container -->
<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f8fafc">
    <tr>
        <td align="center" style="padding:32px 16px;">
            <!-- Email Width -->
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;">
                <!-- Header with Logo -->
                <tr>
                    <td align="center" style="padding-bottom:16px;">
                        <img src="${process.env.NEXT_PUBLIC_SITE_URL}/logo.png" alt="eSIM Flame" width="140" style="max-width:140px;">
                    </td>
                </tr>
                
                <!-- Navigation Links -->
                <tr>
                    <td class="nav-links" style="padding-bottom:24px;">
                        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/orders">My Orders</a>
                        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/destinations">Browse Destinations</a>
                        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/support">Support</a>
                    </td>
                </tr>
                
                <!-- Hero Section -->
                <tr>
                    <td class="card" style="background:white; border-radius:16px; box-shadow:0 4px 24px rgba(0,0,0,0.05); overflow:hidden; margin-bottom:24px;">
                        <div class="flame-gradient" style="padding:32px; text-align:center; color:white;">
                            <h1 style="margin:0; font-size:28px; font-weight:700;">Your eSIM Is Ready</h1>
                            <p style="font-size:18px; opacity:0.9;">${packageName}</p>
                        </div>
                        
                        <!-- QR Code Section -->
                        <div class="qr-container">
                            <div class="qr-code">
                                <img src="cid:esim-qrcode" width="200" height="200" alt="QR Code" style="max-width:100%;">
                            </div>
                            <h2 style="margin:0 0 16px 0;">Scan this QR code with your device</h2>
                            
                            <ol class="steps" style="margin:0 auto; padding:0; max-width:300px; text-align:center; list-style-position:inside;">
                                <li style="margin-bottom:8px;">Open your phone's Settings</li>
                                <li style="margin-bottom:8px;">Select "Cellular/Mobile"</li>
                                <li style="margin-bottom:8px;">Choose "Add Cellular Plan"</li>
                                <li>Scan this QR code</li>
                            </ol>
                            
                            <p style="color:#64748b; max-width:400px; margin:24px auto 0; font-size:15px;">If you can't scan the QR code, follow the manual installation guide below</p>
                        </div>
                        
                        <!-- Installation Tips -->
                        <div style="padding:0 24px 24px;">
                            <div class="tip-container">
                                <div class="tip-box">
                                    <img src="https://cdn-icons-png.flaticon.com/512/3043/3043707.png" class="tip-icon" alt="Don't interrupt">
                                    <div>
                                        <p style="margin:0; font-weight:600;">Don't interrupt the installation</p>
                                    </div>
                                </div>
                                <div class="tip-box">
                                    <img src="https://cdn-icons-png.flaticon.com/512/1828/1828843.png" class="tip-icon" alt="Stable connection">
                                    <div>
                                        <p style="margin:0; font-weight:600;">Make sure your internet connection is stable</p>
                                    </div>
                                </div>
                                <div class="tip-box">
                                    <img src="https://cdn-icons-png.flaticon.com/512/3524/3524636.png" class="tip-icon" alt="Don't delete">
                                    <div>
                                        <p style="margin:0; font-weight:600;">Don't delete the eSIM, it can be installed once</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
                
                <!-- Manual Installation Card -->
                <tr>
                    <td>
                        <div class="card">
                            <div class="card-header">
                                <img src="https://cdn-icons-png.flaticon.com/512/2985/2985161.png" class="card-icon" alt="Manual">
                                <span>Manual Installation</span>
                            </div>
                            <div class="card-body">
                                <div style="background:#f1f5f9; padding:16px; border-radius:8px; margin-bottom:16px;">
                                    <p style="margin:0 0 8px 0; font-weight:500; color:#334155;">SM-DP+ Address:</p>
                                    <p style="margin:0; background:white; padding:12px; border-radius:6px; font-family:monospace; word-break:break-all;">${smdpAddress || 'N/A'}</p>
                                    
                                    <p style="margin:16px 0 8px 0; font-weight:500; color:#334155;">Activation Code:</p>
                                    <p style="margin:0; background:white; padding:12px; border-radius:6px; font-family:monospace; word-break:break-all;">${activationCode || 'N/A'}</p>
                                    
                                    <p style="margin:16px 0 8px 0; font-weight:500; color:#334155;">ICCID:</p>
                                    <p style="margin:0; background:white; padding:12px; border-radius:6px; font-family:monospace; word-break:break-all;">${iccid || 'N/A'}</p>
                                    
                                    ${apn ? `
                                    <p style="margin:16px 0 8px 0; font-weight:500; color:#334155;">APN:</p>
                                    <p style="margin:0; background:white; padding:12px; border-radius:6px; font-family:monospace; word-break:break-all;">${apn}</p>
                                    ` : ''}
                                    
                                    ${pin ? `
                                    <p style="margin:16px 0 8px 0; font-weight:500; color:#334155;">PIN:</p>
                                    <p style="margin:0; background:white; padding:12px; border-radius:6px; font-family:monospace; word-break:break-all;">${pin}</p>
                                    ` : ''}
                                    
                                    ${puk ? `
                                    <p style="margin:16px 0 8px 0; font-weight:500; color:#334155;">PUK:</p>
                                    <p style="margin:0; background:white; padding:12px; border-radius:6px; font-family:monospace; word-break:break-all;">${puk}</p>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
                
                <!-- Flame Divider -->
                <tr>
                    <td>
                        <div class="flame-divider"></div>
                    </td>
                </tr>
                
                <!-- Device-Specific Guides -->
                <tr>
                    <td>
                        <div class="card">
                            <div class="card-header">
                                <img src="https://cdn-icons-png.flaticon.com/512/226/226772.png" class="card-icon" alt="iPhone">
                                <span>iPhone Instructions</span>
                            </div>
                            <div class="card-body">
                                <div style="display:flex; margin-bottom:16px;">
                                    <div style="flex:1; padding-right:16px;">
                                        <p style="font-weight:600; margin-top:0;">Installation:</p>
                                        <ol style="padding-left:20px; margin:0;">
                                            <li style="margin-bottom:8px;">Settings → Cellular</li>
                                            <li style="margin-bottom:8px;">Tap "Add Cellular Plan"</li>
                                            <li>Scan QR or enter details manually</li>
                                        </ol>
                                    </div>
                                    <div style="flex:1;">
                                        <p style="font-weight:600; margin-top:0;">At Destination:</p>
                                        <ol style="padding-left:20px; margin:0;">
                                            <li style="margin-bottom:8px;">Settings → Cellular</li>
                                            <li style="margin-bottom:8px;">Select "eSIM Flame"</li>
                                            <li>Enable "Data Roaming"</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card" style="margin-top:16px;">
                            <div class="card-header">
                                <img src="https://cdn-icons-png.flaticon.com/512/888/888847.png" class="card-icon" alt="Android">
                                <span>Android Instructions</span>
                            </div>
                            <div class="card-body">
                                <div style="display:flex;">
                                    <div style="flex:1; padding-right:16px;">
                                        <p style="font-weight:600; margin-top:0;">Installation:</p>
                                        <ol style="padding-left:20px; margin:0;">
                                            <li style="margin-bottom:8px;">Settings → Connections</li>
                                            <li style="margin-bottom:8px;">SIM manager → Add eSIM</li>
                                            <li>Scan QR or enter details</li>
                                        </ol>
                                    </div>
                                    <div style="flex:1;">
                                        <p style="font-weight:600; margin-top:0;">At Destination:</p>
                                        <ol style="padding-left:20px; margin:0;">
                                            <li style="margin-bottom:8px;">Settings → Connections</li>
                                            <li style="margin-bottom:8px;">Mobile networks</li>
                                            <li>Enable "Roaming"</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
                
                <!-- Support Card -->
                <tr>
                    <td>
                        <div class="card" style="margin-top:24px; border-left:4px solid #10b981;">
                            <div class="card-header">
                                <img src="https://cdn-icons-png.flaticon.com/512/3081/3081559.png" class="card-icon" alt="Support">
                                <span>Need Help? We're Here</span>
                            </div>
                            <div class="card-body">
                                <p style="margin-top:0;">Our team is available 24/7 to help with your eSIM installation.</p>
                                <a href="mailto:support@fliday.com" style="color:#ff5e00; font-weight:600; text-decoration:none;">Contact Support →</a>
                            </div>
                        </div>
                    </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                    <td style="padding:32px 0; text-align:center; color:#64748b; font-size:14px;">
                        <img src="${process.env.NEXT_PUBLIC_SITE_URL}/logo-icon.png" width="32" style="opacity:0.7; margin-bottom:12px;">
                        <p style="margin:8px 0;">© ${new Date().getFullYear()} Fliday. All rights reserved.</p>
                        <p style="margin:8px 0;">GIBCO LTD, 27 Old Gloucester Street, London</p>
                        <p style="margin:16px 0 0 0;">
                            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/privacy" style="color:#64748b; text-decoration:none; margin:0 8px;">Privacy</a>
                            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/terms" style="color:#64748b; text-decoration:none; margin:0 8px;">Terms</a>
                            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe" style="color:#64748b; text-decoration:none; margin:0 8px;">Unsubscribe</a>
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>

</body>
</html>
    `;

    // Prepare attachments only if qrCode is provided
    const attachments = qrCode ? [
      {
        filename: 'esim-qrcode.png',
        path: qrCode,
        cid: 'esim-qrcode' // Content ID for embedding in HTML
      }
    ] : [];

    // Send the email
    const info = await transporter.sendMail({
      from: `"eSIM Service" <${process.env.EMAIL_FROM || 'noreply@esim.com'}>`,
      to: email,
      subject: `Your eSIM for ${location} is Ready!`,
      html: htmlBody,
      attachments
    });

    console.log(`eSIM email sent to ${email}, messageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending eSIM email:', error);
    return false;
  }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(email, orderData) {
  if (!email || !orderData) {
    console.error('Missing email or order data for sending confirmation');
    return false;
  }

  try {
    const { orderId, packageName, location, dataAmount, duration, finalPrice, currency } = orderData;

    // Format the HTML email body
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${process.env.NEXT_PUBLIC_SITE_URL}/logo.png" alt="eSIM Logo" style="max-width: 150px;">
        </div>
        
        <h1 style="color: #F15A25; text-align: center; margin-bottom: 30px;">Order Confirmation</h1>
        
        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
          Thank you for your order. We've received your payment and are processing your eSIM.
          You will receive another email shortly with your eSIM details.
        </p>
        
        <div style="background-color: #f7f7f7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h2 style="color: #444; font-size: 18px; margin-top: 0;">Order Summary</h2>
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
          <p style="margin: 5px 0;"><strong>Package:</strong> ${packageName}</p>
          <p style="margin: 5px 0;"><strong>Location:</strong> ${location}</p>
          <p style="margin: 5px 0;"><strong>Data:</strong> ${dataAmount}</p>
          <p style="margin: 5px 0;"><strong>Duration:</strong> ${duration}</p>
          <p style="margin: 5px 0;"><strong>Total:</strong> ${currency} ${(finalPrice / 10000).toFixed(2)}</p>
        </div>
        
        <div style="background-color: #f7f7f7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h2 style="color: #444; font-size: 18px; margin-top: 0;">What's Next?</h2>
          <ol style="margin: 10px 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
            <li>We are now processing your eSIM order.</li>
            <li>You will receive another email with your eSIM QR code and installation instructions.</li>
            <li>Once received, follow the instructions to install your eSIM on your device.</li>
            <li>Your eSIM will be active and ready to use immediately after installation.</li>
          </ol>
        </div>
        
        <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; text-align: center;">
          <p style="font-size: 14px; color: #666; line-height: 1.5;">
            If you don't receive your eSIM within 30 minutes, please check your spam folder or contact our support team.
          </p>
          
          <div style="margin-top: 20px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/my-account/orders/${orderId}" style="background-color: #F15A25; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">View Order Details</a>
          </div>
          
          <p style="font-size: 14px; color: #888; margin-top: 30px; line-height: 1.5;">
            If you need any assistance, please contact our support team at
            <a href="mailto:support@fliday.com" style="color: #F15A25; text-decoration: none;">support@fliday.com</a>
          </p>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
            <p>© ${new Date().getFullYear()} eSIM Services. All rights reserved.</p>
          </div>
        </div>
      </div>
    `;

    // Send the email
    const info = await transporter.sendMail({
      from: `"eSIM Service" <${process.env.EMAIL_FROM || 'noreply@esim.com'}>`,
      to: email,
      subject: `Order Confirmation: ${orderId}`,
      html: htmlBody
    });

    console.log(`Order confirmation email sent to ${email}, messageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return false;
  }
}

/**
 * Send payment failure notification email
 */
export async function sendPaymentFailureEmail(email, orderData) {
  if (!email || !orderData) {
    console.error('Missing email or order data for sending payment failure notification');
    return false;
  }

  try {
    const { orderId, packageName, location, failureReason } = orderData;

    // Format the HTML email body
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${process.env.NEXT_PUBLIC_SITE_URL}/logo.png" alt="eSIM Logo" style="max-width: 150px;">
        </div>
        
        <h1 style="color: #F15A25; text-align: center; margin-bottom: 30px;">Payment Issue Detected</h1>
        
        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
          We encountered an issue processing your payment for your eSIM order. 
          Your order has not been completed, and you have not been charged.
        </p>
        
        <div style="background-color: #fff2f2; border-radius: 8px; padding: 20px; margin-bottom: 30px; border: 1px solid #ffcccc;">
          <h2 style="color: #d44; font-size: 18px; margin-top: 0;">Payment Failed</h2>
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
          <p style="margin: 5px 0;"><strong>Package:</strong> ${packageName}</p>
          <p style="margin: 5px 0;"><strong>Location:</strong> ${location}</p>
          <p style="margin: 5px 0;"><strong>Reason:</strong> ${failureReason || 'Your payment could not be processed. Please check your payment details.'}</p>
        </div>
        
        <div style="background-color: #f7f7f7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h2 style="color: #444; font-size: 18px; margin-top: 0;">What to Do Next</h2>
          <ol style="margin: 10px 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
            <li>Please check your payment details to ensure they are accurate.</li>
            <li>Verify that your card has sufficient funds and is not expired.</li>
            <li>Try again with a different payment method if possible.</li>
            <li>If you continue to experience issues, please contact our support team.</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/checkout?packageCode=${orderData.packageCode}" style="background-color: #F15A25; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Try Again</a>
          
          <p style="font-size: 14px; color: #888; margin-top: 30px; line-height: 1.5;">
            If you need assistance, please contact our support team at
            <a href="mailto:support@fliday.com" style="color: #F15A25; text-decoration: none;">support@fliday.com</a>
          </p>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
            <p>© ${new Date().getFullYear()} eSIM Services. All rights reserved.</p>
          </div>
        </div>
      </div>
    `;

    // Send the email
    const info = await transporter.sendMail({
      from: `"eSIM Service" <${process.env.EMAIL_FROM || 'noreply@esim.com'}>`,
      to: email,
      subject: `Payment Issue: Your eSIM Order ${orderId}`,
      html: htmlBody
    });

    console.log(`Payment failure email sent to ${email}, messageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending payment failure email:', error);
    return false;
  }
}

/**
 * Format price for display
 */
function formatPrice(price) {
  if (!price) return '0.00';
  return typeof price === 'number' ? (price / 10000).toFixed(2) : price;
}