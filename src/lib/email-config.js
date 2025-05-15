import nodemailer from 'nodemailer';

/**
 * Create a transporter for sending emails via Brevo SMTP
 */
export function createBrevoTransporter() {
  return nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST,
    port: parseInt(process.env.BREVO_SMTP_PORT),
    secure: false, // Use TLS
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASSWORD,
    },
  });
}

/**
 * Helper function to send an email
 * @param {Object} options - Email options (to, subject, html, etc.)
 * @returns {Promise<boolean>} - Whether the email was sent successfully
 */
export async function sendEmail(options) {
  try {
    const transporter = createBrevoTransporter();
    
    const mailOptions = {
      from: `"Fliday" <support@fliday.com>`,
      ...options,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}