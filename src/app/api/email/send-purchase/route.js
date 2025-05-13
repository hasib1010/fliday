import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import { sendESIMEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, email, includeQrCode = true } = await request.json();
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    if (!email) {
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

    // Prepare email data
    const emailData = {
      orderId,
      packageName: order.packageName,
      location: order.location,
      dataAmount: order.dataAmount,
      duration: order.duration,
      qrCode: includeQrCode ? order.esimDetails.qrCodeUrl : '',
      shortUrl: order.esimDetails.shortUrl || '',
      iccid: order.esimDetails.iccid || '',
      totalAmount: `${order.currency} ${(order.finalPrice / 100).toFixed(2)}`,
      activationDate: new Date().toLocaleDateString(),
      expiryDate: order.esimDetails.expiredTime 
        ? new Date(order.esimDetails.expiredTime).toLocaleDateString() 
        : 'N/A',
      pin: order.esimDetails.pin || '',
      puk: order.esimDetails.puk || '',
      apn: order.esimDetails.apn || '',
      smdpAddress: parseActivationCode(order.esimDetails.ac).smdpAddress,
      activationCode: parseActivationCode(order.esimDetails.ac).activationCode,
      dataAllowance: order.esimDetails.totalVolume
        ? `${(order.esimDetails.totalVolume / (1024 * 1024 * 1024)).toFixed(2)} GB`
        : order.dataAmount,
      installationInstructions: generateInstallationInstructions(order.esimDetails),
    };

    // Send the email
    await sendESIMEmail(email, emailData);

    console.log(`Resent eSIM details email for order ${orderId} to ${email}`);

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

function generateInstallationInstructions(esimDetails) {
  const { smdpAddress, activationCode } = parseActivationCode(esimDetails.ac);
  return `
# eSIM Installation Instructions

## Scan QR Code
1. Go to your phone settings
2. Navigate to Mobile Data or Cellular
3. Select Add Data Plan or Add eSIM
4. Scan the QR code provided
5. Follow on-screen instructions to activate

## Manual Installation (if needed)
- SM-DP+ Address: ${smdpAddress}
- Activation Code: ${activationCode}
- APN: ${esimDetails.apn || 'Default APN'}

## Important Information
- ICCID: ${esimDetails.iccid || 'N/A'}
- PIN: ${esimDetails.pin || 'N/A'}
- PUK: ${esimDetails.puk || 'N/A'}
- Data: ${esimDetails.totalVolume ? (esimDetails.totalVolume / 1024 / 1024 / 1024).toFixed(2) + ' GB' : 'N/A'}
- Valid for: ${esimDetails.totalDuration || ''} ${esimDetails.durationUnit || 'DAYS'}
- Expiry: ${esimDetails.expiredTime ? new Date(esimDetails.expiredTime).toLocaleDateString() : 'N/A'}

## Need help?
Contact our support team at support@fliday.com if you need assistance.
  `;
}