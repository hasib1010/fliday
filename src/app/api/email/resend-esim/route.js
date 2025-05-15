import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import { sendEmail } from '@/lib/email-config';

// Helper function to parse SM-DP+ Address and Activation Code
const parseActivationCode = (ac) => {
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
};

// Helper function to format data size
const formatDataSize = (bytes) => {
    if (!bytes) return 'N/A';
    const gb = bytes / (1024 * 1024 * 1024);
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { orderId, email } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        // If email is not provided, use the session user's email
        const emailToUse = email || session.user.email;
        if (!emailToUse) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        await dbConnect();

        // Verify the user has access to this order
        const user = await User.findOne({
            $or: [{ _id: session.user.id }, { email: session.user.email }],
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get the order details
        const order = await Order.findOne({ orderId }).lean();
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Ensure the order belongs to the user
        if (order.userId.toString() !== user._id.toString()) {
            return NextResponse.json({ error: 'Unauthorized access to order' }, { status: 403 });
        }

        // Check if the order has eSIM details
        if (!order.esimDetails || !order.esimDetails.qrCodeUrl) {
            return NextResponse.json(
                { error: 'Order does not have complete eSIM details yet' },
                { status: 400 }
            );
        }

        // Parse SM-DP+ Address and Activation Code
        const { smdpAddress, activationCode } = parseActivationCode(order.esimDetails.ac);

        // Format dynamic data
        const dataAmount = order.dataAmount || formatDataSize(order.esimDetails.totalVolume);
        const duration = order.esimDetails.totalDuration || order.duration || 'N/A';
        const durationUnit = order.esimDetails.durationUnit || 'Days';
        const planDetails = `${order.location} • ${dataAmount} • ${duration} ${durationUnit}`;
        const packageName = order.packageName || 'eSIM Flame';
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
                                    <p style="margin:0; background:white; padding:12px; border-radius:6px; font-family:monospace; word-break:break-all;">${smdpAddress}</p>
                                    
                                    <p style="margin:16px 0 8px 0; font-weight:500; color:#334155;">Activation Code:</p>
                                    <p style="margin:0; background:white; padding:12px; border-radius:6px; font-family:monospace; word-break:break-all;">${activationCode}</p>
                                    
                                    <p style="margin:16px 0 8px 0; font-weight:500; color:#334155;">ICCID:</p>
                                    <p style="margin:0; background:white; padding:12px; border-radius:6px; font-family:monospace; word-break:break-all;">${order.esimDetails.iccid || 'N/A'}</p>
                                    
                                    ${order.esimDetails.apn ? `
                                    <p style="margin:16px 0 8px 0; font-weight:500; color:#334155;">APN:</p>
                                    <p style="margin:0; background:white; padding:12px; border-radius:6px; font-family:monospace; word-break:break-all;">${order.esimDetails.apn}</p>
                                    ` : ''}
                                    
                                    ${order.esimDetails.pin ? `
                                    <p style="margin:16px 0 8px 0; font-weight:500; color:#334155;">PIN:</p>
                                    <p style="margin:0; background:white; padding:12px; border-radius:6px; font-family:monospace; word-break:break-all;">${order.esimDetails.pin}</p>
                                    ` : ''}
                                    
                                    ${order.esimDetails.puk ? `
                                    <p style="margin:16px 0 8px 0; font-weight:500; color:#334155;">PUK:</p>
                                    <p style="margin:0; background:white; padding:12px; border-radius:6px; font-family:monospace; word-break:break-all;">${order.esimDetails.puk}</p>
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
        let countryName = countryCodeToName[order.location] || 'Unknown Country';
        // Send the email
        const emailSent = await sendEmail({

            to: emailToUse,

            subject: `Your eSIM for ${countryName}`,
            html: htmlBody,
            attachments: [
                {
                    filename: `esim-${order.orderId}.png`,
                    path: order.esimDetails.qrCodeUrl,
                    cid: 'esim-qrcode' // Content ID for embedding in HTML
                }
            ]
        });

        if (!emailSent) {
            return NextResponse.json(
                { error: 'Failed to send email. Please try again later.' },
                { status: 500 }
            );
        }

        console.log(`eSIM details email for order ${orderId} sent to ${emailToUse}`);

        return NextResponse.json({
            success: true,
            message: 'eSIM details email sent successfully',
        });
    } catch (error) {
        console.error('Error sending eSIM email:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send email' },
            { status: 500 }
        );
    }
}