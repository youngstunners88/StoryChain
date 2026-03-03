import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  template?: string;
  data?: Record<string, any>;
  html?: string;
  text?: string;
}

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });
};

// Simple template renderer
const renderTemplate = (template: string, data: Record<string, any>): string => {
  let html = getTemplate(template);
  Object.keys(data).forEach((key) => {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), String(data[key]));
  });
  return html;
};

// Get template by name
const getTemplate = (name: string): string => {
  const templates: Record<string, string> = {
    'verify-email': `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #E63946; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #E63946; color: white; text-decoration: none; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚕 Boober</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email</h2>
            <p>Hello {{name}},</p>
            <p>Thank you for registering with Boober! Please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="{{verificationLink}}" class="button">Verify Email</a>
            </p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account with Boober, please ignore this email.</p>
            <p>Best regards,<br>The Boober Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    'reset-password': `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #E63946; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #E63946; color: white; text-decoration: none; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚕 Boober</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hello {{name}},</p>
            <p>You requested to reset your password. Click the button below to set a new password:</p>
            <p style="text-align: center;">
              <a href="{{resetLink}}" class="button">Reset Password</a>
            </p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, please ignore this email.</p>
            <p>Best regards,<br>The Boober Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    'ride-confirmation': `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #E63946; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚕 Boober</h1>
          </div>
          <div class="content">
            <h2>Ride Confirmed!</h2>
            <p>Hello {{name}},</p>
            <p>Your ride has been confirmed.</p>
            <p><strong>Pickup:</strong> {{pickup}}</p>
            <p><strong>Drop-off:</strong> {{dropoff}}</p>
            <p><strong>Fare:</strong> R{{fare}}</p>
            <p><strong>Driver:</strong> {{driverName}}</p>
            <p>Track your ride in the Boober app.</p>
            <p>Best regards,<br>The Boober Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return templates[name] || '<p>{{content}}</p>';
};

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    let html = options.html;
    if (options.template && options.data) {
      html = renderTemplate(options.template, options.data);
    }

    const mailOptions = {
      from: config.email.from,
      to: options.to,
      subject: options.subject,
      html,
      text: options.text,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${options.to}: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send email to ${options.to}: ${error}`);
    return false;
  }
};

export default sendEmail;
