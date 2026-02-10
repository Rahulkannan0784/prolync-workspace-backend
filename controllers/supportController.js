
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') }); // Explicit path to ensure load

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendSupportEmail = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        const mailOptions = {
            from: `"${name}" <${process.env.APP_EMAIL_FROM}>`, // Sender address
            to: process.env.SMTP_USER, // Admin receives the support request
            replyTo: email, // Reply directly to user
            subject: `[Support Request] ${subject} - ${name}`,
            html: `
                <h3>New Support Request</h3>
                <p><strong>From:</strong> ${name} (${email})</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <hr/>
                <p><strong>Message:</strong></p>
                <p style="white-space: pre-wrap;">${message}</p>
                <hr/>
                <p><em>Sent from Prolync Workspace</em></p>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Support Email Sent: %s", info.messageId);

        res.status(200).json({ message: 'Support request sent successfully' });
    } catch (error) {
        console.error("Support Email Error:", error);
        res.status(500).json({ message: 'Failed to send support request' });
    }
};
