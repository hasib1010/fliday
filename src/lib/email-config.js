// lib/email-config.js
import nodemailer from 'nodemailer';

/**
 * Create a transporter for sending emails via Gmail with app password
 */
export function createGmailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // This should be an app password, not your regular Gmail password
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
    const transporter = createGmailTransporter();
    
    const mailOptions = {
      from: `"eSIM Service" <${process.env.GMAIL_USER}>`,
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