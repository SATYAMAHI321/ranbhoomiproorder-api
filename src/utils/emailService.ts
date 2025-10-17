import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

/**
 * Send email
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'TrackMyORDER <noreply@TrackMyORDER.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${options.to}`);
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
};

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmail = async (
  email: string,
  customerName: string,
  trackingId: string,
  productName: string
): Promise<void> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .tracking-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
        .tracking-id { font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 2px; }
        .btn { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Order Confirmed!</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${customerName}</strong>,</p>
          <p>Thank you for your order! Your OTT subscription has been successfully placed.</p>
          
          <div class="tracking-box">
            <p style="margin: 0 0 10px 0;">Your Tracking ID:</p>
            <p class="tracking-id">${trackingId}</p>
          </div>
          
          <p><strong>Product:</strong> ${productName}</p>
          <p>You can track your order status anytime using your tracking ID on our website.</p>
          
          <a href="${process.env.FRONTEND_URL}/track?id=${trackingId}" class="btn">Track Your Order</a>
          
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            If you have any questions, feel free to contact us through our live chat support.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `Order Confirmed - Tracking ID: ${trackingId}`,
    html,
  });
};

/**
 * Send order status update email
 */
export const sendStatusUpdateEmail = async (
  email: string,
  customerName: string,
  trackingId: string,
  productName: string,
  status: string,
  activationCode?: string
): Promise<void> => {
  const statusMessages: { [key: string]: { title: string; message: string; color: string } } = {
    processing: {
      title: '⏳ Order Processing',
      message: 'Your order is being processed. We will notify you once it\'s ready.',
      color: '#f59e0b'
    },
    activated: {
      title: '✅ Subscription Activated',
      message: 'Great news! Your subscription has been activated and is ready to use.',
      color: '#10b981'
    },
    delivered: {
      title: '🎁 Order Delivered',
      message: 'Your order has been successfully delivered. Enjoy your subscription!',
      color: '#10b981'
    },
    failed: {
      title: '❌ Order Failed',
      message: 'Unfortunately, there was an issue with your order. Please contact support.',
      color: '#ef4444'
    },
    expired: {
      title: '⏰ Subscription Expired',
      message: 'Your subscription has expired. Renew now to continue enjoying the service.',
      color: '#6b7280'
    }
  };

  const statusInfo = statusMessages[status] || statusMessages.processing;

  const activationCodeHtml = activationCode ? `
    <div class="tracking-box">
      <p style="margin: 0 0 10px 0;">Your Activation Code:</p>
      <p class="tracking-id">${activationCode}</p>
    </div>
  ` : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${statusInfo.color}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .tracking-box { background: white; padding: 20px; border-left: 4px solid ${statusInfo.color}; margin: 20px 0; }
        .tracking-id { font-size: 24px; font-weight: bold; color: ${statusInfo.color}; letter-spacing: 2px; }
        .btn { display: inline-block; padding: 12px 30px; background: ${statusInfo.color}; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${statusInfo.title}</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${customerName}</strong>,</p>
          <p>${statusInfo.message}</p>
          
          <p><strong>Tracking ID:</strong> ${trackingId}</p>
          <p><strong>Product:</strong> ${productName}</p>
          <p><strong>Status:</strong> ${status.toUpperCase()}</p>
          
          ${activationCodeHtml}
          
          <a href="${process.env.FRONTEND_URL}/track?id=${trackingId}" class="btn">View Order Details</a>
          
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Need help? Contact us through our live chat support.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `Order Status Update - ${trackingId}: ${statusInfo.title}`,
    html,
  });
};
