// src\app\api\webhooks\stripe\route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import { sendEmail } from '@/lib/email-config'; // Use your working email config
console.log('Webhook handler loaded');
export const config = {
  api: {
    bodyParser: false,
  },
};
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const ESIM_API_BASE_URL = process.env.ESIM_API_BASE_URL || 'https://api.esimaccess.com/api/v1';
const ESIM_ACCESS_CODE = process.env.ESIM_ACCESS_CODE;

export async function POST(request) {
 
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    console.log('Webhook signature available:', !!signature);

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
      console.log('Event constructed successfully:', event.type);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }
    const paymentIntent = event.data.object;
    const metadata = paymentIntent.metadata || {};
    const orderId = metadata.orderId;
    const type = metadata.type || 'order'; // Provide fallback

    console.log(`Processing ${event.type} for orderID: ${orderId}, type: ${type}`);

    await dbConnect();
    console.log(`Received Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`Payment succeeded: ${paymentIntent.id}`);
        await handleSuccessfulPayment(paymentIntent);
        break;
      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object;
        console.log(`Payment failed: ${failedPaymentIntent.id}`);
        await handleFailedPayment(failedPaymentIntent);
        break;
      case 'charge.succeeded':
        const charge = event.data.object;
        console.log(`Charge succeeded: ${charge.id}`);
        break;
      case 'payment_method.attached':
        const paymentMethod = event.data.object;
        console.log(`Payment method attached: ${paymentMethod.id}`);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, type: event.type });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleSuccessfulPayment(paymentIntent) {
  const { orderId, type } = paymentIntent.metadata;
  if (!orderId) {
    console.error('No order ID found in payment intent metadata', { paymentIntentId: paymentIntent.id });
    return;
  }

  console.log(`Processing successful payment for ${type || 'order'}: ${orderId}`);

  try {
    await dbConnect();

    if (type === 'topup') {
      console.log(`Payment for TopUp ${orderId} already processed via API`);
      return;
    }
    const order = await Order.findOne({ orderId });
    if (!order) {
      console.error(`Order not found: ${orderId}`);
      return;
    }

    const user = await User.findById(order.userId);
    if (!user) {
      console.error(`User not found for order: ${orderId}`);
      return;
    }

    // Update order to reflect payment
    await Order.findOneAndUpdate(
      { orderId },
      {
        $set: {
          paymentStatus: 'completed',
          orderStatus: 'processing',
          paymentIntentId: paymentIntent.id,
          updatedAt: new Date(),
        },
      }
    );
    console.log(`Updated order ${orderId} to paymentStatus: completed, orderStatus: processing`);

    // Call eSIM API
    console.log(`Ordering eSIM for order: ${orderId}`);
    const esimDetails = await orderESIM(order, orderId);

    if (esimDetails.status === 'error') {
      let failureReason = esimDetails.errorMessage || 'Failed to order eSIM';
      if (esimDetails.errorMessage?.includes('insufficient balance')) {
        failureReason = 'The admin has insufficient balance, please contact us.';
        try {
          await stripe.refunds.create({
            payment_intent: paymentIntent.id,
          });
          console.log(`Refund issued for order: ${orderId}`);
          await Order.findOneAndUpdate(
            { orderId },
            {
              $set: {
                orderStatus: 'failed',
                paymentStatus: 'refunded',
                failureReason,
                updatedAt: new Date(),
              },
            }
          );
        } catch (refundError) {
          console.error(`Failed to issue refund for order ${orderId}:`, refundError);
          failureReason += `; Refund failed: ${refundError.message}`;
          await Order.findOneAndUpdate(
            { orderId },
            {
              $set: {
                orderStatus: 'failed',
                paymentStatus: 'completed',
                failureReason,
                updatedAt: new Date(),
              },
            }
          );
        }
      } else {
        await Order.findOneAndUpdate(
          { orderId },
          {
            $set: {
              orderStatus: 'failed',
              paymentStatus: 'completed',
              failureReason,
              updatedAt: new Date(),
            },
          }
        );
      }
      console.error(`Order failed: ${orderId}, reason: ${failureReason}`);
      return;
    }

    // Update order with eSIM details
    await Order.findOneAndUpdate(
      { orderId },
      {
        $set: {
          orderStatus: esimDetails.qrCodeUrl ? 'completed' : 'processing',
          esimDetails,
          completedAt: esimDetails.qrCodeUrl ? new Date() : null,
          updatedAt: new Date(),
        },
      }
    );
    console.log(`Updated order ${orderId} with esimDetails`, {
      qrCodeUrl: esimDetails.qrCodeUrl ? 'Present' : 'Missing',
      orderNo: esimDetails.orderNo,
      iccid: esimDetails.iccid,
    });

    // Fetch the updated order to ensure we have latest details
    const updatedOrder = await Order.findOne({ orderId });

    // Check if we have a QR code before sending the email
    if (updatedOrder.esimDetails && updatedOrder.esimDetails.qrCodeUrl) {
      // Parse SM-DP+ Address and Activation Code
      const { smdpAddress, activationCode } = parseActivationCode(updatedOrder.esimDetails.ac);

      // Format dynamic data
      const dataAmount = updatedOrder.esimDetails.totalVolume
        ? `${(updatedOrder.esimDetails.totalVolume / (1024 * 1024 * 1024)).toFixed(2)} GB`
        : updatedOrder.dataAmount;
      const duration = updatedOrder.esimDetails.totalDuration || updatedOrder.duration || 'N/A';
      const durationUnit = updatedOrder.esimDetails.durationUnit || 'Days';
      const planDetails = `${updatedOrder.location} • ${dataAmount} • ${duration} ${durationUnit}`;
      const packageName = updatedOrder.esimDetails.packageList?.[0]?.packageName || updatedOrder.packageName || 'N/A';
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
                                    <p style="margin:0; background:white; padding:12px; border-radius:6px; font-family:monospace; word-break:break-all;">${updatedOrder.esimDetails.iccid || 'N/A'}</p>
                                    
                                    ${updatedOrder.esimDetails.apn ? `
                                    <p style="margin:16px 0 8px 0; font-weight:500; color:#334155;">APN:</p>
                                    <p style="margin:0; background:white; padding:12px; border-radius:6px; font-family:monospace; word-break:break-all;">${updatedOrder.esimDetails.apn}</p>
                                    ` : ''}
                                    
                                    ${updatedOrder.esimDetails.pin ? `
                                    <p style="margin:16px 0 8px 0; font-weight:500; color:#334155;">PIN:</p>
                                    <p style="margin:0; background:white; padding:12px; border-radius:6px; font-family:monospace; word-break:break-all;">${updatedOrder.esimDetails.pin}</p>
                                    ` : ''}
                                    
                                    ${updatedOrder.esimDetails.puk ? `
                                    <p style="margin:16px 0 8px 0; font-weight:500; color:#334155;">PUK:</p>
                                    <p style="margin:0; background:white; padding:12px; border-radius:6px; font-family:monospace; word-break:break-all;">${updatedOrder.esimDetails.puk}</p>
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
                             <div style="display: flex; align-items: center; gap: 8px;">
    <img src="https://cdn-icons-png.flaticon.com/512/0/747.png" alt="Apple Logo" width="20" height="20" style="display:inline-block;">
    <span style="font-weight:600;">iPhone Instructions</span>
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
                            <div style="display: flex; align-items: center; gap: 8px;">
    <img src="https://cdn-icons-png.flaticon.com/512/174/174836.png" alt="Android Logo" width="20" height="20" style="display:inline-block;">
    <span style="font-weight:600;">Android Instructions</span>
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
                        <img src="${process.env.NEXT_PUBLIC_SITE_URL}/logo.png" width="32" style="opacity:0.7; margin-bottom:12px;">
                        <p style="margin:8px 0;">© ${new Date().getFullYear()} Fliday. All rights reserved.</p>
                        <p style="margin:8px 0;">GIBCO LTD, 27 Old Gloucester Street, London</p>
                        
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>

</body>
</html>
      `;

      try {
        console.log(`Attempting to send eSIM email to ${user.email}`);
        const countryCodeToName = {
          AF: 'Afghanistan',
          AX: 'Åland Islands',
          AL: 'Albania',
          DZ: 'Algeria',
          AS: 'American Samoa',
          AD: 'Andorra',
          AO: 'Angola',
          AI: 'Anguilla',
          AQ: 'Antarctica',
          AG: 'Antigua and Barbuda',
          AR: 'Argentina',
          AM: 'Armenia',
          AW: 'Aruba',
          AU: 'Australia',
          AT: 'Austria',
          AZ: 'Azerbaijan',
          BS: 'Bahamas',
          BH: 'Bahrain',
          BD: 'Bangladesh',
          BB: 'Barbados',
          BY: 'Belarus',
          BE: 'Belgium',
          BZ: 'Belize',
          BJ: 'Benin',
          BM: 'Bermuda',
          BT: 'Bhutan',
          BO: 'Bolivia',
          BQ: 'Bonaire, Sint Eustatius and Saba',
          BA: 'Bosnia and Herzegovina',
          BW: 'Botswana',
          BV: 'Bouvet Island',
          BR: 'Brazil',
          IO: 'British Indian Ocean Territory',
          BN: 'Brunei Darussalam',
          BG: 'Bulgaria',
          BF: 'Burkina Faso',
          BI: 'Burundi',
          CV: 'Cabo Verde',
          KH: 'Cambodia',
          CM: 'Cameroon',
          CA: 'Canada',
          KY: 'Cayman Islands',
          CF: 'Central African Republic',
          TD: 'Chad',
          CL: 'Chile',
          CN: 'China',
          CX: 'Christmas Island',
          CC: 'Cocos (Keeling) Islands',
          CO: 'Colombia',
          KM: 'Comoros',
          CG: 'Congo',
          CD: 'Congo (Democratic Republic)',
          CK: 'Cook Islands',
          CR: 'Costa Rica',
          CI: "Côte d'Ivoire",
          HR: 'Croatia',
          CU: 'Cuba',
          CW: 'Curaçao',
          CY: 'Cyprus',
          CZ: 'Czech Republic',
          DK: 'Denmark',
          DJ: 'Djibouti',
          DM: 'Dominica',
          DO: 'Dominican Republic',
          EC: 'Ecuador',
          EG: 'Egypt',
          SV: 'El Salvador',
          GQ: 'Equatorial Guinea',
          ER: 'Eritrea',
          EE: 'Estonia',
          SZ: 'Eswatini',
          ET: 'Ethiopia',
          FK: 'Falkland Islands',
          FO: 'Faroe Islands',
          FJ: 'Fiji',
          FI: 'Finland',
          FR: 'France',
          GF: 'French Guiana',
          PF: 'French Polynesia',
          TF: 'French Southern Territories',
          GA: 'Gabon',
          GM: 'Gambia',
          GE: 'Georgia',
          DE: 'Germany',
          GH: 'Ghana',
          GI: 'Gibraltar',
          GR: 'Greece',
          GL: 'Greenland',
          GD: 'Grenada',
          GP: 'Guadeloupe',
          GU: 'Guam',
          GT: 'Guatemala',
          GG: 'Guernsey',
          GN: 'Guinea',
          GW: 'Guinea-Bissau',
          GY: 'Guyana',
          HT: 'Haiti',
          HM: 'Heard Island and McDonald Islands',
          VA: 'Holy See',
          HN: 'Honduras',
          HK: 'Hong Kong',
          HU: 'Hungary',
          IS: 'Iceland',
          IN: 'India',
          ID: 'Indonesia',
          IR: 'Iran',
          IQ: 'Iraq',
          IE: 'Ireland',
          IM: 'Isle of Man',
          IL: 'Israel',
          IT: 'Italy',
          JM: 'Jamaica',
          JP: 'Japan',
          JE: 'Jersey',
          JO: 'Jordan',
          KZ: 'Kazakhstan',
          KE: 'Kenya',
          KI: 'Kiribati',
          KP: 'Korea (North)',
          KR: 'Korea (South)',
          KW: 'Kuwait',
          KG: 'Kyrgyzstan',
          LA: 'Laos',
          LV: 'Latvia',
          LB: 'Lebanon',
          LS: 'Lesotho',
          LR: 'Liberia',
          LY: 'Libya',
          LI: 'Liechtenstein',
          LT: 'Lithuania',
          LU: 'Luxembourg',
          MO: 'Macao',
          MG: 'Madagascar',
          MW: 'Malawi',
          MY: 'Malaysia',
          MV: 'Maldives',
          ML: 'Mali',
          MT: 'Malta',
          MH: 'Marshall Islands',
          MQ: 'Martinique',
          MR: 'Mauritania',
          MU: 'Mauritius',
          YT: 'Mayotte',
          MX: 'Mexico',
          FM: 'Micronesia',
          MD: 'Moldova',
          MC: 'Monaco',
          MN: 'Mongolia',
          ME: 'Montenegro',
          MS: 'Montserrat',
          MA: 'Morocco',
          MZ: 'Mozambique',
          MM: 'Myanmar',
          NA: 'Namibia',
          NR: 'Nauru',
          NP: 'Nepal',
          NL: 'Netherlands',
          NC: 'New Caledonia',
          NZ: 'New Zealand',
          NI: 'Nicaragua',
          NE: 'Niger',
          NG: 'Nigeria',
          NU: 'Niue',
          NF: 'Norfolk Island',
          MK: 'North Macedonia',
          MP: 'Northern Mariana Islands',
          NO: 'Norway',
          OM: 'Oman',
          PK: 'Pakistan',
          PW: 'Palau',
          PS: 'Palestine',
          PA: 'Panama',
          PG: 'Papua New Guinea',
          PY: 'Paraguay',
          PE: 'Peru',
          PH: 'Philippines',
          PN: 'Pitcairn',
          PL: 'Poland',
          PT: 'Portugal',
          PR: 'Puerto Rico',
          QA: 'Qatar',
          RE: 'Réunion',
          RO: 'Romania',
          RU: 'Russia',
          RW: 'Rwanda',
          BL: 'Saint Barthélemy',
          SH: 'Saint Helena',
          KN: 'Saint Kitts and Nevis',
          LC: 'Saint Lucia',
          MF: 'Saint Martin',
          PM: 'Saint Pierre and Miquelon',
          VC: 'Saint Vincent and the Grenadines',
          WS: 'Samoa',
          SM: 'San Marino',
          ST: 'Sao Tome and Principe',
          SA: 'Saudi Arabia',
          SN: 'Senegal',
          RS: 'Serbia',
          SC: 'Seychelles',
          SL: 'Sierra Leone',
          SG: 'Singapore',
          SX: 'Sint Maarten',
          SK: 'Slovakia',
          SI: 'Slovenia',
          SB: 'Solomon Islands',
          SO: 'Somalia',
          ZA: 'South Africa',
          GS: 'South Georgia and the South Sandwich Islands',
          SS: 'South Sudan',
          ES: 'Spain',
          LK: 'Sri Lanka',
          SD: 'Sudan',
          SR: 'Suriname',
          SJ: 'Svalbard and Jan Mayen',
          SE: 'Sweden',
          CH: 'Switzerland',
          SY: 'Syria',
          TW: 'Taiwan',
          TJ: 'Tajikistan',
          TZ: 'Tanzania',
          TH: 'Thailand',
          TL: 'Timor-Leste',
          TG: 'Togo',
          TK: 'Tokelau',
          TO: 'Tonga',
          TT: 'Trinidad and Tobago',
          TN: 'Tunisia',
          TR: 'Turkey',
          TM: 'Turkmenistan',
          TC: 'Turks and Caicos Islands',
          TV: 'Tuvalu',
          UG: 'Uganda',
          UA: 'Ukraine',
          AE: 'United Arab Emirates',
          GB: 'United Kingdom',
          US: 'United States',
          UM: 'United States Minor Outlying Islands',
          UY: 'Uruguay',
          UZ: 'Uzbekistan',
          VU: 'Vanuatu',
          VE: 'Venezuela',
          VN: 'Vietnam',
          VG: 'Virgin Islands (British)',
          VI: 'Virgin Islands (U.S.)',
          WF: 'Wallis and Futuna',
          EH: 'Western Sahara',
          YE: 'Yemen',
          ZM: 'Zambia',
          ZW: 'Zimbabwe'
        };
        let countryName = countryCodeToName[updatedOrder.location] || 'Unknown Country';
        // Send the email using your working email configuration
        const emailSent = await sendEmail({
          to: user.email,
          subject: `Your eSIM for ${countryName} is ready!`,
          html: htmlBody,
          attachments: [
            {
              filename: `esim-${updatedOrder.orderId}.png`,
              path: updatedOrder.esimDetails.qrCodeUrl,
              cid: 'esim-qrcode' // Content ID for embedding in HTML
            }
          ]
        });

        if (emailSent) {
          console.log(`eSIM email successfully sent to ${user.email}`);
        } else {
          console.error(`Failed to send eSIM email to ${user.email}`);
        }
      } catch (emailError) {
        console.error(`Error sending eSIM email for order ${orderId}:`, emailError);
      }
    } else {
      console.warn(`Order ${orderId} doesn't have QR code yet, skipping email`);
    }
  } catch (error) {
    console.error(`Error processing order ${orderId}:`, error);
    await Order.findOneAndUpdate(
      { orderId },
      {
        $set: {
          orderStatus: 'failed',
          paymentStatus: 'completed',
          failureReason: error.message || 'Failed to process eSIM order',
          updatedAt: new Date(),
        },
      }
    );
  }
}

async function handleFailedPayment(paymentIntent) {
  const { orderId } = paymentIntent.metadata;
  if (!orderId) {
    console.error('No order ID found in payment intent metadata');
    return;
  }

  console.log(`Processing failed payment for order: ${orderId}`);

  try {
    await Order.findOneAndUpdate(
      { orderId },
      {
        $set: {
          paymentStatus: 'failed',
          orderStatus: 'failed',
          paymentIntentId: paymentIntent.id,
          failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
          updatedAt: new Date(),
        },
      }
    );
    console.log(`Order ${orderId} marked as failed`);
  } catch (error) {
    console.error(`Error processing failed payment for order ${orderId}:`, error);
  }
}

async function orderESIM(order, txnId) {
  try {
    if (!process.env.ESIM_ACCESS_CODE || !process.env.ESIM_API_BASE_URL) {
      throw new Error('Missing eSIM API configuration');
    }

    // IMPORTANT: Use originalPrice (provider's price without markup) for the API call
    const apiAmount = order.originalPrice; // Price without markup

    const orderRequest = {
      transactionId: txnId,
      amount: apiAmount,
      packageInfoList: [
        {
          packageCode: order.packageCode,
          count: 1,
          price: apiAmount
        },
      ],
    };

    console.log('eSIM API order request:', {
      txnId,
      packageCode: order.packageCode,
      amount: apiAmount,
      customerPrice: order.finalPrice,
      markup: order.markupAmount || (order.finalPrice - order.originalPrice)
    });

    const orderResponse = await fetch(`${process.env.ESIM_API_BASE_URL}/open/esim/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RT-AccessCode': process.env.ESIM_ACCESS_CODE,
      },
      body: JSON.stringify(orderRequest),
    });

    const orderData = await orderResponse.json();
    console.log('eSIM API order response:', orderData);

    if (!orderResponse.ok || !orderData.success) {
      if (orderData.errorCode === '200007') {
        return {
          status: 'error',
          errorMessage: 'the balance is insufficient',
        };
      }
      throw new Error(orderData.errorMsg || `Failed to order eSIM: ${orderResponse.status}`);
    }

    if (!orderData.obj || !orderData.obj.orderNo) {
      throw new Error('Invalid eSIM order response: missing orderNo');
    }

    const { orderNo } = orderData.obj;
    console.log(`Order placed, orderNo: ${orderNo}`);

    let esimDetails = {
      orderNo,
      transactionId: txnId,
      esimStatus: 'PAYING',
      packageList: [],
    };

    // Query for eSIM profiles - make multiple attempts
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Querying eSIM profiles, attempt ${attempt}/3 for orderNo: ${orderNo}`);
        const queryResponse = await fetch(`${process.env.ESIM_API_BASE_URL}/open/esim/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'RT-AccessCode': process.env.ESIM_ACCESS_CODE,
          },
          body: JSON.stringify({
            orderNo,
            iccid: '',
            pager: { pageNum: 1, pageSize: 20 },
          }),
        });

        const queryData = await queryResponse.json();
        console.log(`eSIM query response (attempt ${attempt}):`, queryData);

        if (queryData.success && queryData.obj?.esimList?.length > 0) {
          const esimData = queryData.obj.esimList[0];
          esimDetails = {
            esimTranNo: esimData.esimTranNo || '',
            orderNo: esimData.orderNo || orderNo,
            transactionId: esimData.transactionId || txnId,
            imsi: esimData.imsi || '',
            iccid: esimData.iccid || '',
            smsStatus: esimData.smsStatus || 0,
            msisdn: esimData.msisdn || '',
            ac: esimData.ac || '',
            qrCodeUrl: esimData.qrCodeUrl || '',
            shortUrl: esimData.shortUrl || '',
            smdpStatus: esimData.smdpStatus || '',
            eid: esimData.eid || '',
            activeType: esimData.activeType || 1,
            dataType: esimData.dataType || 1,
            activateTime: esimData.activateTime || null,
            expiredTime: esimData.expiredTime || '',
            totalVolume: esimData.totalVolume || 0,
            totalDuration: esimData.totalDuration || 0,
            durationUnit: esimData.durationUnit || '',
            orderUsage: esimData.orderUsage || 0,
            pin: esimData.pin || '',
            puk: esimData.puk || '',
            apn: esimData.apn || '',
            esimStatus: esimData.esimStatus || 'GOT_RESOURCE',
            packageList: esimData.packageList?.length
              ? esimData.packageList
              : [
                {
                  packageName: order.packageName || '',
                  packageCode: order.packageCode || '',
                  slug: esimData.packageList?.[0]?.slug || '',
                  duration: order.duration || esimData.totalDuration || 0,
                  volume: esimData.totalVolume || 0,
                  locationCode: order.location || '',
                  createTime: new Date().toISOString(),
                },
              ],
            instructions: generateInstructions(esimData),
          };
          console.log(`eSIM profile found for orderNo: ${orderNo}`, {
            qrCodeUrl: esimDetails.qrCodeUrl ? 'Present' : 'Missing',
            iccid: esimDetails.iccid,
          });
          break;
        } else if (queryData.errorCode === '200010') {
          console.log(`Profiles not ready for orderNo: ${orderNo}, attempt ${attempt}`);
        } else {
          console.warn(`No profiles found for orderNo: ${orderNo}, attempt ${attempt}`);
        }
      } catch (queryError) {
        console.warn(`eSIM query attempt ${attempt} failed for orderNo: ${orderNo}:`, queryError.message);
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    return esimDetails;
  } catch (error) {
    console.error(`Error ordering eSIM for order: ${txnId}:`, error);
    return {
      status: 'error',
      errorMessage: error.message || 'Failed to order eSIM',
    };
  }
}

// Helper function to parse SM-DP+ Address and Activation Code
function parseActivationCode(ac) {
  if (!ac || typeof ac !== 'string') {
    return { smdpAddress: 'N/A', activationCode: 'N/A' };
  }
  const parts = ac.split('$');
  if (parts.length !== 3 || !parts[1] || !parts[2]) {
    return { smdpAddress: 'N/A', activationCode: ac };
  }
  return {
    smdpAddress: parts[1],
    activationCode: parts[2]
  };
}

function generateInstructions(esimData) {
  const apn = esimData.apn || 'Default APN';
  const { smdpAddress, activationCode } = parseActivationCode(esimData.ac);
  return `
# eSIM Installation Instructions
## Scan QR Code
1. Go to your phone settings
2. Navigate to Mobile Data or Cellular
3. Select Add Data Plan or Add eSIM
4. Scan the QR code provided
5. Follow on-screen instructions to activate
## Manual Installation
- SM-DP+ Address: ${smdpAddress}
- Activation Code: ${activationCode}
- APN: ${apn}
## Important Information
- Valid for: ${esimData.totalDuration || ''} ${esimData.durationUnit || 'DAYS'}
- Data: ${esimData.totalVolume ? (esimData.totalVolume / 1024 / 1024 / 1024).toFixed(2) + ' GB' : 'N/A'}
- Expiry: ${esimData.expiredTime ? new Date(esimData.expiredTime).toLocaleDateString() : 'N/A'}
Contact support if you need assistance.
  `;
}