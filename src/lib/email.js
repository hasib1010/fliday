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
    const { orderId, packageName, location, dataAmount, duration, qrCode, installationInstructions } = esimData;

    // Format the HTML email body
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${process.env.NEXT_PUBLIC_SITE_URL}/logo.png" alt="eSIM Logo" style="max-width: 150px;">
        </div>
        
        <h1 style="color: #F15A25; text-align: center; margin-bottom: 30px;">Your eSIM is Ready!</h1>
        
        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
          Thank you for your purchase. Your eSIM for <strong>${location}</strong> is ready to use.
        </p>
        
        <div style="background-color: #f7f7f7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h2 style="color: #444; font-size: 18px; margin-top: 0;">Order Details</h2>
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
          <p style="margin: 5px 0;"><strong>Package:</strong> ${packageName}</p>
          <p style="margin: 5px 0;"><strong>Data:</strong> ${dataAmount}</p>
          <p style="margin: 5px 0;"><strong>Duration:</strong> ${duration}</p>
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #444; font-size: 18px;">Your eSIM QR Code</h2>
          <p style="font-size: 14px; color: #666; margin-bottom: 15px;">Scan this QR code with your phone to install your eSIM</p>
          <img src="${qrCode}" alt="eSIM QR Code" style="max-width: 250px; border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
        </div>
        
        <div style="background-color: #f7f7f7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h2 style="color: #444; font-size: 18px; margin-top: 0;">Installation Instructions</h2>
          <div style="font-size: 14px; line-height: 1.5;">
            ${installationInstructions.replace(/\n/g, '<br>')}
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="font-size: 14px; color: #888; line-height: 1.5;">
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
      subject: `Your eSIM for ${location} is Ready!`,
      html: htmlBody,
      attachments: [
        {
          filename: 'esim-qrcode.png',
          path: qrCode,
          cid: 'esim-qrcode' // Content ID for embedding in HTML
        }
      ]
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