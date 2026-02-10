
import db from '../config/db.js';
import bcrypt from 'bcryptjs';

// Get Profile Details
export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const [users] = await db.query(
            'SELECT id, name, email, phone_number, college_name, profile_picture, resume_path, role, created_at, bio, location, github, linkedin, leetcode, hackerrank, codechef, gender, current_role, onboarding_completed FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update Profile Details
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updates = req.body;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'No fields provided for update' });
        }

        const allowedFields = [
            'name', 'phone_number', 'college_name', 'bio', 'location',
            'github', 'linkedin', 'leetcode', 'hackerrank', 'codechef', 'gender', 'current_role', 'onboarding_completed'
        ];

        let query = 'UPDATE users SET ';
        const params = [];
        const setClauses = [];

        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                setClauses.push(`${key} = ?`);
                params.push(updates[key]);
            }
        });

        if (setClauses.length === 0) {
            return res.status(400).json({ message: 'No valid fields provided for update' });
        }

        query += setClauses.join(', ') + ' WHERE id = ?';
        params.push(userId);

        await db.query(query, params);

        // Fetch updated user to return
        const [updatedUsers] = await db.query('SELECT id, name, email, phone_number, college_name, profile_picture, resume_path, role, created_at, bio, location, github, linkedin, leetcode, hackerrank, codechef, gender, current_role, onboarding_completed FROM users WHERE id = ?', [userId]);

        res.json({ message: 'Profile updated successfully', user: updatedUsers[0] });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Upload Avatar
export const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const userId = req.user.id;
        // Construct public URL path (assuming /uploads is served statically)
        // Adjust 'http://localhost:5000' based on env if needed, but relative path is usually safer for frontend to handle or full path
        // Storing relative path: /uploads/profile-images/filename
        const profilePicturePath = `/uploads/profile-images/${req.file.filename}`;

        await db.query('UPDATE users SET profile_picture = ? WHERE id = ?', [profilePicturePath, userId]);

        res.json({ message: 'Avatar uploaded successfully', profile_picture: profilePicturePath });
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Upload Resume
export const uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const userId = req.user.id;
        const resumePath = `/uploads/resumes/${req.file.filename}`;

        await db.query('UPDATE users SET resume_path = ? WHERE id = ?', [resumePath, userId]);

        res.json({ message: 'Resume uploaded successfully', resume_path: resumePath });
    } catch (error) {
        console.error('Upload resume error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Change Password
export const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Please provide current and new passwords' });
        }

        const [users] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = users[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get Settings (Legacy support if needed, or alias to getProfile)
export const getSettings = getProfile;
export const updateSettings = updateProfile;
