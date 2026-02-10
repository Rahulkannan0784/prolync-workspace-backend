
import db from '../config/db.js';
import { sendOtpEmail } from '../services/EmailService.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { generateUserId } from '../utils/idGenerator.js';

// Generate 6 digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        // 1. Check if user already registered
        const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // 2. Check rate limit (optional simple check: if recently requested)
        const [existingOtps] = await db.query('SELECT created_at FROM otp_codes WHERE email = ?', [email]);
        if (existingOtps.length > 0) {
            const lastRequest = new Date(existingOtps[0].created_at).getTime();
            const now = Date.now();
            if (now - lastRequest < 60000) { // 60 seconds
                return res.status(429).json({ message: 'Please wait 1 minute before requesting another OTP' });
            }
        }

        // 3. Generate OTP and Expiry (5 mins)
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60000); // 5 mins from now

        // 4. Store in DB (UPSERT behavior via Replace ot Insert On Duplicate Key Update)
        // Using Insert On Duplicate Key Update since email is PK
        await db.query(`
            INSERT INTO otp_codes (email, otp_code, expires_at, created_at)
            VALUES (?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE 
            otp_code = VALUES(otp_code), expires_at = VALUES(expires_at), created_at = NOW()
        `, [email, otp, expiresAt]);

        // 5. Send Email
        const sent = await sendOtpEmail(email, otp);
        if (!sent) {
            // Need to decide: safe fail? User asked "If SMTP is missing in production, signup must fail safely."
            // But here "fail safely" usually means don't crash, but tell user it failed?
            // "If SMTP is missing... signup must fail safely." -> If send fails, we probably shouldn't let them register?
            // Or maybe "fail safely" means handle the error.
            return res.status(500).json({ message: 'Failed to send verification email' });
        }

        res.json({ message: 'OTP sent successfully to your email' });

    } catch (error) {
        console.error('Error in sendOtp:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

import jwt from 'jsonwebtoken';

const ADMIN_EMAIL = 'admin@prolync.in'; // Keep consistent with authController

const getRole = (email) => {
    return email === ADMIN_EMAIL ? 'Admin' : 'Student';
};

export const registerWithOtp = async (req, res) => {
    const { name, email, password, otp } = req.body;

    if (!name || !email || !password || !otp) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // 1. Validate OTP
        const [otpRecord] = await db.query('SELECT * FROM otp_codes WHERE email = ?', [email]);

        if (otpRecord.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const record = otpRecord[0];
        const now = new Date();

        if (now > new Date(record.expires_at)) {
            return res.status(400).json({ message: 'OTP has expired' });
        }

        if (record.otp_code !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // 2. Check if user exists again (race condition check)
        const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // 3. Create User
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate Structured User ID
        const customId = await generateUserId();

        const [result] = await db.query(
            'INSERT INTO users (name, email, password, is_verified, role, custom_id) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, hashedPassword, true, 'Student', customId]
        );

        const userId = result.insertId;

        // 4. Delete OTP
        await db.query('DELETE FROM otp_codes WHERE email = ?', [email]);

        // 5. Log Activity (replicated from authController)
        try {
            await db.query(
                'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
                [userId, 'REGISTER', `New user registered via OTP: ${name}`, req.ip]
            );

            // Emit Real-time Event
            const io = req.app.get('io');
            if (io) {
                io.emit('new_activity', {
                    user_id: userId,
                    user_name: name,
                    action: 'REGISTER',
                    details: `New user registered via OTP: ${name}`,
                    created_at: new Date()
                });
                io.emit('stats_update', { type: 'USER_REGISTERED' });
            }
        } catch (logError) {
            console.error('Activity logging failed:', logError);
        }

        // 6. Generate Token
        const role = getRole(email);
        const token = jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });

        res.status(201).json({ token, user: { id: userId, name, email, role } });

    } catch (error) {
        console.error('Error in registerWithOtp:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
