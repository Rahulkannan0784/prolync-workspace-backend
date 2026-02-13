import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validatePassword } from '../utils/validation.js';
import { generateUserId } from '../utils/idGenerator.js';

const ADMIN_EMAIL = 'admin@prolync.in';

const getRole = (email) => {
    return email === ADMIN_EMAIL ? 'Admin' : 'Student';
};

export const register = async (req, res) => {
    let { name, email, password } = req.body;
    email = email.trim(); // Trim input email
    name = name.trim();

    // 1. Validate Name
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(name)) {
        return res.status(400).json({ message: 'Name must contain only alphabets and spaces.' });
    }

    // 2. Validate Password Strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
        return res.status(400).json({ message: passwordValidation.message });
    }
    try {
        // Check Exists in all primary tables (users, hod, admin)
        const [[userBatch], [hodBatch], [adminBatch]] = await Promise.all([
            db.query('SELECT id FROM users WHERE email = ?', [email]),
            db.query('SELECT id FROM hod WHERE email = ?', [email]),
            db.query('SELECT user_id FROM admin WHERE email = ?', [email])
        ]);

        if (userBatch.length > 0 || hodBatch.length > 0 || adminBatch.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate Structured User ID
        const customId = await generateUserId();

        let registerNo = req.body.register_no ? req.body.register_no.trim() : null;
        if (registerNo === '') registerNo = null;

        // Check if register_no is unique if provided
        if (registerNo) {
            const [existingReg] = await db.query('SELECT * FROM users WHERE register_no = ?', [registerNo]);
            if (existingReg.length > 0) {
                return res.status(400).json({ message: 'Register Object already exists.' });
            }
        }

        // Insert user with custom_id, valid_until (14 days default), role and register_no
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, custom_id, register_no, role, valid_until) VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))',
            [name, email, hashedPassword, customId, registerNo, 'Student']
        );

        const userId = result.insertId; // Capture ID correctly

        // Log Activity
        try {
            await db.query(
                'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
                [userId, 'REGISTER', `New user registered: ${name}`, req.ip]
            );

            // Emit Real-time Event
            const io = req.app.get('io');
            if (io) {
                io.emit('new_activity', {
                    user_id: userId,
                    user_name: name,
                    action: 'REGISTER',
                    details: `New user registered: ${name}`,
                    created_at: new Date()
                });
                // Also trigger stats update if needed, clients can just refetch or increment
                io.emit('stats_update', { type: 'USER_REGISTERED' });
            }
        } catch (logError) {
            console.error('Activity logging failed:', logError);
            // Don't block registration success
        }

        const role = getRole(email);
        const token = jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });

        res.status(201).json({ token, user: { id: userId, name, email, role, profile_picture: null, resume_path: null, onboarding_completed: false } });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

import { sendOtpEmail } from '../services/EmailService.js';

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const verifyAdminOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    try {
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

        // Verify Admin Exists (Double Check)
        const [admins] = await db.query('SELECT * FROM admin WHERE email = ?', [email]);
        if (admins.length === 0) {
            return res.status(400).json({ message: 'Admin not found' });
        }
        const admin = admins[0];

        // Login Success
        const role = 'Admin';
        const token = jwt.sign({ id: admin.user_id, role }, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });

        // Delete OTP
        await db.query('DELETE FROM otp_codes WHERE email = ?', [email]);

        return res.json({ token, user: { id: admin.user_id, name: admin.full_name, email: admin.email, role } });

    } catch (error) {
        console.error('Verify Admin OTP error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const login = async (req, res) => {
    let { email, password } = req.body;
    email = email.trim(); // Trim input email
    try {
        // Check admin table FIRST
        const [admins] = await db.query('SELECT * FROM admin WHERE email = ?', [email]);

        if (admins.length > 0) {
            const admin = admins[0];

            // Compare plain text password as per requirement for admin
            if (password !== admin.password) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            // *** ADMIN OTP FLOW ***
            const otp = generateOTP();
            const expiresAt = new Date(Date.now() + 5 * 60000); // 5 mins

            // Store OTP
            await db.query(`
                INSERT INTO otp_codes (email, otp_code, expires_at, created_at)
                VALUES (?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE 
                otp_code = VALUES(otp_code), expires_at = VALUES(expires_at), created_at = NOW()
            `, [email, otp, expiresAt]);

            // Send Email
            const emailSent = await sendOtpEmail(email, otp);
            if (!emailSent) {
                return res.status(500).json({ message: 'Failed to send verification email' });
            }

            return res.json({
                status: 'OTP_SENT',
                message: 'OTP has been sent to your email for admin verification',
                email: email
            });
        }



        // Check HOD table
        const [hods] = await db.query('SELECT * FROM hod WHERE email = ?', [email]);
        if (hods.length > 0) {
            const hod = hods[0];
            const isMatch = await bcrypt.compare(password, hod.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            if (hod.status === 'Blocked') {
                return res.status(403).json({ message: 'Your account has been blocked by the administrator.' });
            }

            const role = 'HOD';
            const token = jwt.sign({ id: hod.id, role }, process.env.JWT_SECRET, {
                expiresIn: '1d',
            });

            return res.json({
                token,
                user: {
                    id: hod.id,
                    name: hod.name,
                    email: hod.email,
                    role,
                    college: hod.college,
                    department: hod.department
                }
            });
        }

        // Then check users table (Students)
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length > 0) {
            const user = users[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            // Update last_login
            await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

            // Log Activity
            try {
                await db.query(
                    'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
                    [user.id, 'LOGIN', `User logged in`, req.ip]
                );
            } catch (e) { console.error("Login log error", e); }

            // Check Validity
            if (user.valid_until && new Date(user.valid_until) < new Date()) {
                return res.status(403).json({
                    message: 'Account Expired: Your access period has ended. Please contact admin.'
                });
            }

            const role = 'Student';
            const token = jwt.sign({ id: user.id, role }, process.env.JWT_SECRET, {
                expiresIn: '1d',
            });

            return res.json({
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role,
                    profile_picture: user.profile_picture,
                    resume_path: user.resume_path,
                    phone_number: user.phone_number,
                    college_name: user.college_name,
                    bio: user.bio,
                    location: user.location,
                    github: user.github,
                    linkedin: user.linkedin,
                    gender: user.gender,
                    current_role: user.current_role,
                    created_at: user.created_at,
                    status: user.status,
                    valid_until: user.valid_until,
                    custom_id: user.custom_id,
                    onboarding_completed: user.onboarding_completed === 1 || user.onboarding_completed === true
                }
            });
        }

        return res.status(400).json({ message: 'Invalid credentials' });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login Error: ' + error.message, error: error.message });
    }
};

// Get current user (Admin or Student)
export const getMe = async (req, res) => {
    try {
        const role = req.user.role?.toUpperCase(); // Middleware should populate this from token
        let user;

        if (role === 'ADMIN') {
            const [admins] = await db.query('SELECT user_id as id, full_name as name, email, role FROM admin WHERE user_id = ?', [req.user.id]);
            if (admins.length > 0) user = admins[0];
        } else if (role === 'HOD') {
            const [hods] = await db.query('SELECT id, name, email, college, department, status FROM hod WHERE id = ?', [req.user.id]);
            if (hods.length > 0) user = hods[0];
        } else {
            const [users] = await db.query('SELECT id, custom_id, name, email, phone_number, college_name, department, profile_picture, resume_path, role, created_at, bio, location, github, linkedin, leetcode, hackerrank, codechef, gender, current_role, status, valid_until, onboarding_completed, show_email, show_phone, show_location FROM users WHERE id = ?', [req.user.id]);
            if (users.length > 0) user = users[0];
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Ensure role is in the response (admins query has it, users query doesn't explicitly have it in select unless I add it)
        // Helper function wasn't strictly robust for DB vs hardcoded.
        // Let's explicitly set it.
        // Explicitly set role if not present in DB object (common for Admin/HOD)
        if (!user.role) {
            if (role === 'Admin') user.role = 'Admin';
            else if (role === 'HOD') user.role = 'HOD';
            else if (user.email === 'admin@prolync.in') user.role = 'Admin';
        }

        res.json(user);
    } catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// ... existing code ...

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
        const [[users], [admins], [hods]] = await Promise.all([
            db.query('SELECT id FROM users WHERE email = ?', [email]),
            db.query('SELECT user_id FROM admin WHERE email = ?', [email]),
            db.query('SELECT id FROM hod WHERE email = ?', [email])
        ]);

        if (users.length === 0 && admins.length === 0 && hods.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 mins

        await db.query(`
            INSERT INTO otp_codes (email, otp_code, expires_at, created_at)
            VALUES (?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE 
            otp_code = VALUES(otp_code), expires_at = VALUES(expires_at), created_at = NOW()
        `, [email, otp, expiresAt]);

        await sendOtpEmail(email, otp);

        res.json({ message: 'OTP sent to your email' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const [otpRecord] = await db.query('SELECT * FROM otp_codes WHERE email = ? AND otp_code = ? AND expires_at > NOW()', [email, otp]);
        if (otpRecord.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            return res.status(400).json({ message: passwordValidation.message });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 1. Try updating user (hashed)
        const [userUpdate] = await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);

        if (userUpdate.affectedRows === 0) {
            // 2. Try updating HOD (hashed)
            const [hodUpdate] = await db.query('UPDATE hod SET password = ? WHERE email = ?', [hashedPassword, email]);

            if (hodUpdate.affectedRows === 0) {
                // 3. Try updating admin (plain text - as per current code)
                const [adminUpdate] = await db.query('UPDATE admin SET password = ? WHERE email = ?', [newPassword, email]);
                if (adminUpdate.affectedRows === 0) {
                    return res.status(404).json({ message: 'User not found' });
                }
            }
        }

        // Delete OTP
        await db.query('DELETE FROM otp_codes WHERE email = ?', [email]);

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        if (role === 'Admin') {
            const [admins] = await db.query('SELECT * FROM admin WHERE user_id = ?', [userId]);
            if (admins.length === 0) return res.status(404).json({ message: 'User not found' });

            const admin = admins[0];
            if (admin.password !== currentPassword) {
                return res.status(400).json({ message: 'Incorrect current password' });
            }

            const passwordValidation = validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                return res.status(400).json({ message: passwordValidation.message });
            }

            await db.query('UPDATE admin SET password = ? WHERE user_id = ?', [newPassword, userId]);
        } else if (role === 'HOD') {
            const [hods] = await db.query('SELECT * FROM hod WHERE id = ?', [userId]);
            if (hods.length === 0) return res.status(404).json({ message: 'User not found' });

            const hod = hods[0];
            const isMatch = await bcrypt.compare(currentPassword, hod.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Incorrect current password' });
            }

            const passwordValidation = validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                return res.status(400).json({ message: passwordValidation.message });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            await db.query('UPDATE hod SET password = ? WHERE id = ?', [hashedPassword, userId]);
        } else {
            const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
            if (users.length === 0) return res.status(404).json({ message: 'User not found' });

            const user = users[0];
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Incorrect current password' });
            }

            const passwordValidation = validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                return res.status(400).json({ message: passwordValidation.message });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
        }

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
