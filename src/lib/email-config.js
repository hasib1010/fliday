// src/lib/email-config.js
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
    // Add debug logging
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development',
  });
}

/**
 * Helper function to send an email
 * @param {Object} options - Email options (to, subject, html, attachments, etc.)
 * @returns {Promise<boolean>} - Whether the email was sent successfully
 */
export async function sendEmail(options) {
  try {
    console.log('[Email-Config] Preparing to send email to:', options.to);
    
    const transporter = createBrevoTransporter();
    
    // Verify SMTP connection
    console.log('[Email-Config] Verifying SMTP connection...');
    await transporter.verify();
    console.log('[Email-Config] ✅ SMTP connection verified');
    
    // Process attachments - download URLs if needed
    let processedAttachments = options.attachments || [];
    
    if (processedAttachments.length > 0) {
      console.log('[Email-Config] Processing attachments...');
      processedAttachments = await Promise.all(
        processedAttachments.map(async (attachment) => {
          // If attachment has a URL path, download it
          if (attachment.path && attachment.path.startsWith('http')) {
            try {
              console.log(`[Email-Config] Downloading attachment from: ${attachment.path}`);
              
              const response = await fetch(attachment.path);
              
              if (!response.ok) {
                throw new Error(`Failed to download: HTTP ${response.status}`);
              }
              
              const buffer = await response.arrayBuffer();
              console.log(`[Email-Config] ✅ Downloaded ${buffer.byteLength} bytes`);
              
              return {
                filename: attachment.filename,
                content: Buffer.from(buffer),
                cid: attachment.cid,
                contentType: attachment.contentType || 'image/png'
              };
            } catch (downloadError) {
              console.error(`[Email-Config] ❌ Failed to download attachment:`, downloadError);
              // Skip this attachment if download fails
              return null;
            }
          }
          
          // Return attachment as-is if it's not a URL
          return attachment;
        })
      );
      
      // Filter out failed downloads
      processedAttachments = processedAttachments.filter(att => att !== null);
      console.log(`[Email-Config] Processed ${processedAttachments.length} attachments`);
    }
    
    const mailOptions = {
      from: `"Fliday" <support@fliday.com>`,
      ...options,
      attachments: processedAttachments  // Use processed attachments
    };

    console.log('[Email-Config] Sending email...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`[Email-Config] ✅ Email sent: ${info.messageId}`);
    console.log(`[Email-Config] Response: ${info.response}`);
    
    return true;
  } catch (error) {
    console.error('[Email-Config] ❌ Error sending email:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    return false;
  }
}