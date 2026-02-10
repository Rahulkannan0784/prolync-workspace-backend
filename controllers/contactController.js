import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendContactEmail = async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    try {
        // 1. Send email to Office
        const officeMailOptions = {
            from: `"${name}" <${email}>`, // sender address
            to: process.env.SMTP_USER, // list of receivers
            subject: `New Contact Inquiry: ${subject || 'General'}`, // Subject line
            html: `
                <h3>New Contact Message</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `,
        };

        // 2. Send Auto-Reply to User
        const userMailOptions = {
            from: `"Prolync Support" <${process.env.APP_EMAIL_FROM}>`,
            to: email,
            subject: 'We received your message - Prolync',
            html: `
                <h3>Hi ${name},</h3>
                <p>Thank you for reaching out to Prolync.</p>
                <p>We have received your message regarding "<strong>${subject}</strong>" and our team will get back to you within 24 hours.</p>
                <br>
                <p>Best regards,</p>
                <p><strong>Team Prolync</strong></p>
                <p><a href="https://prolync.in">www.prolync.in</a></p>
            `,
        };

        // Send both emails
        await transporter.sendMail(officeMailOptions);
        await transporter.sendMail(userMailOptions);

        res.status(200).json({ message: 'Message sent successfully' });

    } catch (error) {
        console.error('Email send error:', error);
        res.status(500).json({ message: 'Failed to send message', error: error.message });
    }
};
