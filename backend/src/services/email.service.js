const nodemailer = require('nodemailer');

const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

const sendOtpEmail = async (to, otp) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"REakMusic" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Your REakMusic Verification Code',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2>Email Verification</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing:8px;color:#6200ea">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (to, resetToken) => {
  const transporter = createTransporter();
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  await transporter.sendMail({
    from: `"REakMusic" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'REakMusic Password Reset',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password. This link expires in 15 minutes.</p>
        <a href="${resetLink}" style="background:#6200ea;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px">Reset Password</a>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
};

const sendPurchaseConfirmationEmail = async (to, order) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"REakMusic" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'REakMusic Purchase Confirmation',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2>Purchase Confirmed!</h2>
        <p>Thank you for your purchase.</p>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Total:</strong> $${order.totalPrice.toFixed(2)}</p>
        <p>You can now download your songs from your account.</p>
      </div>
    `,
  });
};

const sendAccountUnlockEmail = async (to, unlockToken) => {
  const transporter = createTransporter();
  const unlockLink = `${process.env.FRONTEND_URL}/unlock-account?token=${unlockToken}`;
  await transporter.sendMail({
    from: `"REakMusic" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'REakMusic Account Unlock',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2>Unlock Your Account</h2>
        <p>Your account has been locked due to multiple failed login attempts.</p>
        <a href="${unlockLink}" style="background:#6200ea;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px">Unlock Account</a>
        <p>This link expires in 1 hour.</p>
      </div>
    `,
  });
};

module.exports = { sendOtpEmail, sendPasswordResetEmail, sendPurchaseConfirmationEmail, sendAccountUnlockEmail };
