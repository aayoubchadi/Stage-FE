import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT, 10) || 465,
  secure: process.env.SMTP_PORT == '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(email, resetToken) {
  if (process.env.EMAIL_DELIVERY_MODE !== 'SMTP') {
    console.log('[Dev] Password reset token for', email, ':', resetToken);
    return;
  }

  const resetLink = \http://localhost:5173/reset-password?token=\\;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'lavadomplateform@gmail.com',
    to: email,
    subject: 'Password Reset - StockPro',
    html: \
      <p>Hello,</p>
      <p>You requested to reset your password. Click the link below to set a new password:</p>
      <a href="\">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
    \,
  });
}
