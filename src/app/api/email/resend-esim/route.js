// app/api/email/resend-esim/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import { sendEmail } from '@/lib/email-config';

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

    // Format the HTML email body
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #F15A25;">Your eSIM for ${order.location}</h1>
        </div>
        
        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
          Thank you for your purchase. Your eSIM for <strong>${order.location}</strong> is ready to use.
        </p>
        
        <div style="background-color: #f7f7f7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h2 style="color: #444; font-size: 18px; margin-top: 0;">Order Details</h2>
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order.orderId}</p>
          <p style="margin: 5px 0;"><strong>Package:</strong> ${order.packageName}</p>
          <p style="margin: 5px 0;"><strong>Data:</strong> ${order.dataAmount}</p>
          <p style="margin: 5px 0;"><strong>Duration:</strong> ${order.duration}</p>
          <p style="margin: 5px 0;"><strong>ICCID:</strong> ${order.esimDetails.iccid || 'N/A'}</p>
          ${order.esimDetails.imsi ? `<p style="margin: 5px 0;"><strong>IMSI:</strong> ${order.esimDetails.imsi}</p>` : ''}
          ${order.esimDetails.apn ? `<p style="margin: 5px 0;"><strong>APN:</strong> ${order.esimDetails.apn}</p>` : ''}
          ${order.esimDetails.pin ? `<p style="margin: 5px 0;"><strong>PIN:</strong> ${order.esimDetails.pin}</p>` : ''}
          ${order.esimDetails.puk ? `<p style="margin: 5px 0;"><strong>PUK:</strong> ${order.esimDetails.puk}</p>` : ''}
          ${order.esimDetails.totalVolume ? `<p style="margin: 5px 0;"><strong>Data Allowance:</strong> ${(order.esimDetails.totalVolume / 1024 / 1024 / 1024).toFixed(2)} GB</p>` : ''}
          ${order.esimDetails.expiredTime ? `<p style="margin: 5px 0;"><strong>Expiry Date:</strong> ${new Date(order.esimDetails.expiredTime).toLocaleDateString()}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #444; font-size: 18px;">Your eSIM QR Code</h2>
          <p style="font-size: 14px; color: #666; margin-bottom: 15px;">Scan this QR code with your phone to install your eSIM</p>
          <img src="${order.esimDetails.qrCodeUrl}" alt="eSIM QR Code" style="max-width: 250px; border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
          ${order.esimDetails.shortUrl ? `<p style="margin-top: 10px;"><a href="${order.esimDetails.shortUrl}" style="color: #F15A25;">${order.esimDetails.shortUrl}</a></p>` : ''}
        </div>
        
        <div style="background-color: #f7f7f7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h2 style="color: #444; font-size: 18px; margin-top: 0;">Installation Instructions</h2>
          <ol style="margin: 10px 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Go to your phone settings</li>
            <li style="margin-bottom: 8px;">Navigate to Mobile Data or Cellular</li>
            <li style="margin-bottom: 8px;">Select Add Data Plan or Add eSIM</li>
            <li style="margin-bottom: 8px;">Scan the QR code provided</li>
            <li style="margin-bottom: 8px;">Follow on-screen instructions to activate</li>
          </ol>
          ${order.esimDetails.ac ? `<p style="margin-top: 15px;"><strong>Manual Activation Code:</strong> ${order.esimDetails.ac}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="font-size: 14px; color: #888; line-height: 1.5;">
            If you need any assistance, please contact our support team at
            <a href="mailto:support@esim.com" style="color: #F15A25; text-decoration: none;">support@esim.com</a>
          </p>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
            <p>© ${new Date().getFullYear()} eSIM Services. All rights reserved.</p>
          </div>
        </div>
      </div>
    `;

    // Send the email
    const emailSent = await sendEmail({
      to: emailToUse,
      subject: `Your eSIM for ${order.location} - Order #${order.orderId}`,
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