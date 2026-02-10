
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false
    },
    logger: true,
    debug: true,
    connectionTimeout: 30000,
});

export const sendOtpEmail = async (toEmail, otp) => {
    try {
        const mailOptions = {
            from: process.env.APP_EMAIL_FROM,
            to: toEmail,
            subject: 'Verify Your Email - OTP',
            text: `Your OTP for account verification is: ${otp}\n\nThis OTP expires in 5 minutes.`,
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Verify Your Email</h2>
          <p>Your One-Time Password (OTP) for account verification is:</p>
          <h1 style="color: #4F46E5; letter-spacing: 5px;">${otp}</h1>
          <p>This OTP is valid for 5 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};
