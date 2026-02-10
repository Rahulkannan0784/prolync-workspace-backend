
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

console.log("--- Email Config Debug ---");
console.log("HOST:", process.env.SMTP_HOST);
console.log("PORT:", process.env.SMTP_PORT);
console.log("USER:", process.env.SMTP_USER);
console.log("PASS length:", process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0);
console.log("FROM:", process.env.APP_EMAIL_FROM);
console.log("--------------------------");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function verifyAndSend() {
    try {
        console.log("Verifying connection...");
        await transporter.verify();
        console.log("✅ Server is ready to take our messages");

        console.log("Attempting to send test email...");
        const info = await transporter.sendMail({
            from: `"${process.env.APP_EMAIL_FROM}" <${process.env.APP_EMAIL_FROM}>`,
            to: process.env.SMTP_USER,
            subject: "Test Email from Support Debugger",
            text: "If you receive this, the email configuration is correct.",
        });

        console.log("✅ Message sent: %s", info.messageId);
    } catch (error) {
        console.error("❌ Error found:", error);
    }
}

verifyAndSend();
