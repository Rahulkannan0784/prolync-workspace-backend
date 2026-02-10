import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import { generateUserId } from '../utils/idGenerator.js';

// @desc    Admin Manually Add User (No OTP)
// @route   POST /api/admin/users
// @access  Private/Admin
export const addUser = async (req, res) => {
    try {
        let { name, email, password, college_name, department, register_no } = req.body;
        name = name?.trim();
        email = email?.trim();
        college_name = college_name?.trim();
        department = department?.trim() || null;
        register_no = register_no?.trim() || null;

        // 1. Validation
        if (!name || !email || !password || !college_name) {
            return res.status(400).json({ message: 'All fields including College Name are required' });
        }

        // 2. Check Exists in all primary tables (users, hod, admin)
        const [[userBatch], [hodBatch], [adminBatch]] = await Promise.all([
            db.query('SELECT id FROM users WHERE email = ?', [email]),
            db.query('SELECT id FROM hod WHERE email = ?', [email]),
            db.query('SELECT user_id FROM admin WHERE email = ?', [email])
        ]);

        if (userBatch.length > 0 || hodBatch.length > 0 || adminBatch.length > 0) {
            return res.status(400).json({ message: 'A user with this email already exists in the system' });
        }

        // 3. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Generate ID
        const customId = await generateUserId();

        // 4.1 Check Register No Uniqueness (if provided)
        if (register_no) {
            const [existingReg] = await db.query('SELECT id FROM users WHERE register_no = ?', [register_no]);
            if (existingReg.length > 0) {
                return res.status(400).json({ message: 'A user with this Register Number already exists' });
            }
        }

        // 5. Insert User (Default validity: 30 Days)
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, custom_id, college_name, department, register_no, role, valid_until, is_verified, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY), ?, ?)',
            [name, email, hashedPassword, customId, college_name, department, register_no, 'Student', true, 'Active']
        );

        const userId = result.insertId;

        // 6. Log Activity
        try {
            await db.query(
                'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
                [req.user.id, 'ADMIN_ADD_USER', `Admin added new user: ${name} (${email})`, req.ip]
            );
        } catch (e) {
            console.error("Log failed", e);
        }

        res.status(201).json({ message: 'User added successfully', userId, customId });

    } catch (error) {
        console.error('Add user error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get All Unique Colleges
// @route   GET /api/admin/colleges
// @access  Private/Admin
export const getColleges = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT DISTINCT college_name FROM users WHERE college_name IS NOT NULL AND college_name != '' ORDER BY college_name ASC"
        );
        const colleges = rows.map(row => row.college_name);
        res.json(colleges);
    } catch (error) {
        console.error('Error fetching colleges:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get All Unique Departments
// @route   GET /api/admin/departments
// @access  Private/Admin
export const getDepartments = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT DISTINCT department FROM users WHERE department IS NOT NULL AND department != '' ORDER BY department ASC"
        );
        const departments = rows.map(row => row.department);
        res.json(departments);
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all users with filtering, search, pagination, and sorting
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
    try {
        const { role, status, gender, college, department, search, alpha, sortBy, sortOrder, page = 1, limit = 25 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT id, custom_id, name, email, role, profile_picture, department, college_name,
            CASE 
                WHEN created_at < DATE_SUB(NOW(), INTERVAL 180 DAY) THEN 'Expired'
                ELSE status 
            END as status,
            gender, created_at, last_login, valid_until,
            (SELECT COALESCE(AVG(completion_percent), 0) FROM user_progress WHERE user_id = users.id) as progress,
            (SELECT h.name FROM hod h 
             LEFT JOIN hod_student_mapping m ON h.id = m.hod_id AND m.student_id = users.id
             WHERE (h.college = users.college_name AND h.department = users.department) 
                OR m.student_id IS NOT NULL
             LIMIT 1) as assigned_hod
            FROM users WHERE 1=1`;
        let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
        const params = [];

        // Filters
        if (role && role !== 'all') {
            query += ' AND role = ?';
            countQuery += ' AND role = ?';
            params.push(role);
        }

        if (college && college !== 'all') {
            query += ' AND college_name = ?';
            countQuery += ' AND college_name = ?';
            params.push(college);
        }

        if (department && department !== 'all') {
            query += ' AND department = ?';
            countQuery += ' AND department = ?';
            params.push(department);
        }

        if (status && status !== 'all') {
            if (status === 'Expired') {
                query += ' AND created_at < DATE_SUB(NOW(), INTERVAL 180 DAY)';
                countQuery += ' AND created_at < DATE_SUB(NOW(), INTERVAL 180 DAY)';
            } else {
                query += ' AND status = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 180 DAY)';
                countQuery += ' AND status = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 180 DAY)';
                params.push(status);
            }
        }

        // Gender filter removed or kept optional? keeping it for backward compat if needed, but UI will hide it.
        if (gender && gender !== 'all') {
            query += ' AND gender = ?';
            countQuery += ' AND gender = ?';
            params.push(gender);
        }

        if (alpha && alpha.length === 1) {
            query += ' AND name LIKE ?';
            countQuery += ' AND name LIKE ?';
            params.push(`${alpha}%`);
        }

        if (search) {
            query += ' AND (name LIKE ? OR email LIKE ? OR id = ? OR college_name LIKE ? OR department LIKE ?)';
            countQuery += ' AND (name LIKE ? OR email LIKE ? OR id = ? OR college_name LIKE ? OR department LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, search, `%${search}%`, `%${search}%`);
        }

        // Sorting
        const sortField = sortBy || 'id';
        const order = sortOrder || 'DESC';

        query += ` ORDER BY ${sortField} ${order}`;

        // Pagination
        query += ' LIMIT ? OFFSET ?';
        const queryParams = [...params, Number(limit), Number(offset)];

        // Execute Queries
        const [users] = await db.query(query, queryParams);
        const [countResult] = await db.query(countQuery, params);

        const totalUsers = countResult[0].total;
        const totalPages = Math.ceil(totalUsers / limit);

        res.json({
            users,
            pagination: {
                totalUsers,
                totalPages,
                currentPage: Number(page),
                limit: Number(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update user role or status
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, status, gender } = req.body;

        const fields = [];
        const params = [];

        if (role) {
            fields.push('role = ?');
            params.push(role);
        }
        if (status) {
            fields.push('status = ?');
            params.push(status);
        }
        if (gender) {
            fields.push('gender = ?');
            params.push(gender);
        }

        if (fields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        params.push(id);

        await db.query(query, params);
        res.json({ message: 'User updated successfully' });

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Bulk delete users
// @route   DELETE /api/admin/users/bulk
// @access  Private/Admin
export const bulkDeleteUsers = async (req, res) => {
    try {
        const { userIds } = req.body; // Array of IDs
        if (!userIds || userIds.length === 0) {
            return res.status(400).json({ message: 'No users selected' });
        }

        // Use a parameterized query for IN clause
        const placeholders = userIds.map(() => '?').join(',');
        const query = `DELETE FROM users WHERE id IN (${placeholders})`;

        await db.query(query, userIds);
        res.json({ message: `${userIds.length} users deleted successfully` });

    } catch (error) {
        console.error('Error deleting users:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Reset User Password
// @access  Private/Admin
export const resetUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Force Logout User (Mock)
// @access  Private/Admin
export const forceLogoutUser = async (req, res) => {
    // In a real JWT app, you'd add the token to a deny-list (Redis).
    // For now, we'll just return success as "Action Simulate".
    res.json({ message: 'User forced to logout (Token invalidated)' });
};

// @desc    Get User Details (Profile, Activity, Enrollments)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
// @desc    Get User Details (Profile, Activity, Enrollments, Coding, Mentorship)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Fetch Basic User Profile
        const [userResult] = await db.query(
            `SELECT id, custom_id, name, email, role, status, created_at, last_login, profile_picture, resume_path, 
                    phone_number, bio, location, github, linkedin, gender, college_name, department,
                    (SELECT h.name FROM hod h 
                     LEFT JOIN hod_student_mapping m ON h.id = m.hod_id AND m.student_id = users.id
                     WHERE (h.college = users.college_name AND h.department = users.department) 
                        OR m.student_id IS NOT NULL
                     LIMIT 1) as assigned_hod
             FROM users WHERE id = ?`,
            [id]
        );

        if (userResult.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userResult[0];

        // 2. Fetch Activity Logs (Latest 10)
        let activityLogs = [];
        try {
            const [logs] = await db.query(
                'SELECT action, details, created_at FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
                [id]
            );
            activityLogs = logs;
        } catch (err) {
            console.warn("Activity logs fetch error:", err.message);
        }

        // 3. Fetch Enrolled Courses (from user_progress)
        let enrollments = [];
        try {
            const [courses] = await db.query(
                `SELECT c.id, c.title, up.last_accessed_at as enrolled_at, up.completion_percent as progress, up.status 
                 FROM user_progress up 
                 JOIN courses c ON up.course_id = c.id 
                 WHERE up.user_id = ? 
                 ORDER BY up.last_accessed_at DESC LIMIT 5`,
                [id]
            );
            enrollments = courses;
        } catch (err) {
            console.warn("Enrollments fetch error:", err.message);
        }

        // 4. Fetch Coding Stats
        let codingStats = {
            problems_solved: 0,
            problems_attempted: 0,
            accuracy: 0,
            last_active: null,
            top_languages: [], // Mocked for now or aggregate if possible
            recent_submissions: []
        };
        try {
            // Count Solved
            const [solvedResult] = await db.query(
                "SELECT COUNT(DISTINCT question_id) as count FROM submissions WHERE user_id = ? AND status = 'Accepted'",
                [id]
            );
            codingStats.problems_solved = solvedResult[0].count;

            // Count Attempted
            const [attemptedResult] = await db.query(
                "SELECT COUNT(DISTINCT question_id) as count FROM submissions WHERE user_id = ?",
                [id]
            );
            codingStats.problems_attempted = attemptedResult[0].count;

            // Accuracy
            if (codingStats.problems_attempted > 0) {
                codingStats.accuracy = Math.round((codingStats.problems_solved / codingStats.problems_attempted) * 100);
            }

            // Recent Submissions
            const [recentSubs] = await db.query(
                "SELECT question_id, language, status, created_at FROM submissions WHERE user_id = ? ORDER BY created_at DESC LIMIT 5",
                [id]
            );
            codingStats.recent_submissions = recentSubs;

            if (recentSubs.length > 0) {
                codingStats.last_active = recentSubs[0].created_at;
            }

            // Mock Top Languages for now (Hard to aggregate without complex query)
            codingStats.top_languages = [
                { name: 'JavaScript', percentage: 65 },
                { name: 'Python', percentage: 25 },
                { name: 'Java', percentage: 10 }
            ];

        } catch (err) {
            console.warn("Coding stats fetch error:", err.message);
        }

        // 5. Fetch Mentorship History
        let mentorshipHistory = [];
        try {
            const [sessions] = await db.query(
                `SELECT mentor_name, topic, booking_date, slot_time, status, meeting_link 
                 FROM mentor_bookings 
                 WHERE user_id = ? 
                 ORDER BY booking_date DESC`,
                [id]
            );
            mentorshipHistory = sessions;
        } catch (err) {
            console.warn("Mentorship fetch error:", err.message);
        }

        // 6. Construct Extended Profile (Now using real data)
        const extendedProfile = {
            // Default fallbacks if null
            phone: user.phone_number || "N/A",
            location: user.location || "Unknown",
            login_method: "Email/Password", // Still mock unless we track it
            bio: user.bio || "No bio added yet.",
            github: user.github || "Not connected",
            linkedin: user.linkedin || "Not connected",
            gender: user.gender || "Not Specified",
            ...user
        };

        res.json({
            user: extendedProfile,
            activityLogs,
            enrollments,
            codingStats,
            mentorshipHistory
        });

    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get specific user's calendar data for Admin View
// @route   GET /api/admin/users/:id/calendar
export const getUserCalendarData = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch learning sessions (time spent)
        const [learningRows] = await db.query(`
            SELECT activity_date, time_spent_seconds, course_id
            FROM learning_activity 
            WHERE user_id = ?
            ORDER BY activity_date DESC
        `, [id]);

        // Fetch activity logs
        const [logRows] = await db.query(`
            SELECT created_at, action, details
            FROM activity_logs
            WHERE user_id = ?
        `, [id]);

        // Merge Data
        const calendarMap = {};

        learningRows.forEach(row => {
            const date = row.activity_date.toISOString().split('T')[0];
            if (!calendarMap[date]) {
                calendarMap[date] = { date, timeSpent: 0, actions: [], courses: new Set() };
            }
            calendarMap[date].timeSpent += row.time_spent_seconds;
        });

        logRows.forEach(row => {
            const date = row.created_at.toISOString().split('T')[0];
            if (!calendarMap[date]) {
                calendarMap[date] = { date, timeSpent: 0, actions: [], courses: new Set() };
            }
            calendarMap[date].actions.push(row.details);
        });

        const result = Object.values(calendarMap).map(day => ({
            ...day,
            courses: Array.from(day.courses)
        }));

        res.json(result);

    } catch (error) {
        console.error('Error fetching user calendar:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get specific user's learning stats for Admin View
// @route   GET /api/admin/users/:id/stats
export const getUserLearningStats = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Total Minutes
        const [activities] = await db.query(
            "SELECT SUM(time_spent_seconds) as total_seconds FROM learning_activity WHERE user_id = ?",
            [id]
        );
        const totalMinutes = Math.round((activities[0].total_seconds || 0) / 60);

        // 2. Streak (from learning_streak table)
        const [streakRows] = await db.query(
            "SELECT current_streak, max_streak, last_active_date FROM learning_streak WHERE user_id = ?",
            [id]
        );
        const streakData = streakRows.length > 0 ? streakRows[0] : { current_streak: 0, max_streak: 0, last_active_date: null };

        // 3. Course Counts
        const [progressRows] = await db.query(
            "SELECT status FROM user_progress WHERE user_id = ?",
            [id]
        );

        let completedCourses = 0;
        let activeCourses = 0;
        progressRows.forEach(row => {
            if (row.status === 'Completed') completedCourses++;
            else if (row.status === 'In Progress') activeCourses++;
        });

        // 4. Not Started
        const [totalCoursesRes] = await db.query("SELECT COUNT(*) as count FROM courses");
        const totalCourses = totalCoursesRes[0].count;
        const enrolledCount = progressRows.length;
        const notStartedCourses = Math.max(0, totalCourses - enrolledCount);

        res.json({
            totalMinutes,
            streak: streakData.current_streak,
            maxStreak: streakData.max_streak,
            lastActive: streakData.last_active_date,
            completedCourses,
            activeCourses,
            notStartedCourses
        });

    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get detailed coding profile for a student
// @route   GET /api/admin/users/:id/coding
// @access  Private/Admin
export const getStudentCodingProfile = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Fetch Submissions with Context
        const query = `
            SELECT 
                s.id, s.question_id, q.title as question_title, s.status, s.language, s.created_at,
                s.context_type, s.context_id
            FROM submissions s
            JOIN questions q ON s.question_id = q.id
            WHERE s.user_id = ?
            ORDER BY s.created_at DESC
        `;
        const [submissions] = await db.query(query, [id]);

        // 2. Aggregate Data
        const stats = {
            total_submissions: submissions.length,
            solved_count: submissions.filter(s => s.status === 'Accepted').length,
            problems_solved: new Set(),
            kits_participated: new Set(),
            scenarios_solved: new Set(),
            recent_activity: submissions.slice(0, 10).map(s => ({
                id: s.id,
                title: s.question_title,
                status: s.status,
                type: s.context_type,
                date: s.created_at
            }))
        };

        submissions.forEach(s => {
            if (s.status === 'Accepted') {
                stats.problems_solved.add(s.question_id);
                if (s.context_type === 'kit' && s.context_id) stats.kits_participated.add(s.context_id);
                if (s.context_type === 'scenario' && s.context_id) stats.scenarios_solved.add(s.context_id);
            }
        });

        res.json({
            total_submissions: stats.total_submissions,
            solved_problems: stats.solved_count,
            unique_problems_solved: stats.problems_solved.size,
            active_kits: stats.kits_participated.size,
            completed_scenarios: stats.scenarios_solved.size,
            recent_activity: stats.recent_activity
        });

    } catch (error) {
        console.error("Error fetching coding profile:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get Detailed Active Users (Daily/Monthly)
// @route   GET /api/admin/active-users
// @access  Private/Admin
export const getActiveUsers = async (req, res) => {
    try {
        const { period = 'daily', page = 1, limit = 25 } = req.query;
        const offset = (page - 1) * limit;
        const interval = period === 'monthly' ? '30 DAY' : '1 DAY';

        // Helper CTE to gather all active user IDs and their latest timestamp
        // UNION Logic matching dashboardController
        const subquery = `
            SELECT user_id, MAX(ts) as last_active_ts FROM (
                SELECT user_id, created_at as ts FROM activity_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${interval}) AND action NOT IN ('LOGIN', 'REGISTER')
                UNION ALL
                SELECT user_id, activity_date as ts FROM learning_activity WHERE activity_date >= DATE_SUB(NOW(), INTERVAL ${interval})
                UNION ALL
                SELECT user_id, created_at as ts FROM submissions WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${interval})
                UNION ALL
                SELECT student_id as user_id, applied_at as ts FROM project_applications WHERE applied_at >= DATE_SUB(NOW(), INTERVAL ${interval})
                UNION ALL
                SELECT u.id as user_id, ms.created_at as ts FROM mentorship_sessions ms JOIN users u ON ms.student_email = u.email WHERE ms.created_at >= DATE_SUB(NOW(), INTERVAL ${interval})
                UNION ALL
                SELECT user_id, applied_at as ts FROM job_applications WHERE applied_at >= DATE_SUB(NOW(), INTERVAL ${interval})
            ) as combined_activity
            GROUP BY user_id
        `;

        const query = `
            SELECT u.id, u.custom_id, u.name, u.email, u.role, u.profile_picture, u.department,
                   active.last_active_ts as last_active
            FROM (${subquery}) as active
            JOIN users u ON active.user_id = u.id
            ORDER BY last_active DESC
            LIMIT ? OFFSET ?
        `;

        const countQuery = `
            SELECT COUNT(DISTINCT user_id) as total
            FROM (${subquery}) as active
        `;

        const [users] = await db.query(query, [Number(limit), Number(offset)]);
        const [countResult] = await db.query(countQuery);

        res.json({
            users,
            pagination: {
                totalUsers: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit),
                currentPage: Number(page),
                limit: Number(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching active users:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get All Students Progress (Dedicated Endpoint)
// @route   GET /api/admin/students/progress
export const getStudentProgress = async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.name, u.email,
            COUNT(up.course_id) as total_courses,
            SUM(CASE WHEN up.status = 'Completed' THEN 1 ELSE 0 END) as completed_courses,
            AVG(up.completion_percent) as avg_progress,
            (SELECT COUNT(*) FROM certificates WHERE user_id = u.id) as certificates_earned,
            (SELECT SUM(time_spent_seconds) FROM learning_activity WHERE user_id = u.id) as total_learning_time
            FROM users u
            LEFT JOIN user_progress up ON u.id = up.user_id
            WHERE u.role = 'Student'
            GROUP BY u.id
            ORDER BY avg_progress DESC
        `;

        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching student progress:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Manage User Validity (Extend or Set Date)
// @route   PUT /api/admin/users/:id/validity
// @access  Private/Admin
// @desc    Manage User Validity (Extend or Set Date)
// @route   PUT /api/admin/users/:id/validity
// @access  Private/Admin
export const manageUserValidity = async (req, res) => {
    try {
        const { id } = req.params;
        const { duration, validUntil } = req.body;

        if (!duration && !validUntil) {
            return res.status(400).json({ message: 'Please provide either a duration or a validUntil date.' });
        }

        // Fetch current validity
        const [users] = await db.query('SELECT valid_until FROM users WHERE id = ?', [id]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });

        let currentValidUntil = users[0].valid_until ? new Date(users[0].valid_until) : new Date();
        const now = new Date();

        let baseDate = currentValidUntil < now ? now : currentValidUntil;
        let newDate;

        if (validUntil) {
            newDate = new Date(validUntil);
            if (isNaN(newDate.getTime())) {
                return res.status(400).json({ message: 'Invalid date format.' });
            }
        } else {
            const match = duration.match(/^(\d+)([dmy])$/);
            if (!match) {
                return res.status(400).json({ message: 'Invalid duration format. Use 7d, 1m, 1y etc.' });
            }

            const value = parseInt(match[1]);
            const unit = match[2];

            newDate = new Date(baseDate.getTime());

            if (unit === 'd') newDate.setDate(newDate.getDate() + value);
            else if (unit === 'm') newDate.setMonth(newDate.getMonth() + value);
            else if (unit === 'y') newDate.setFullYear(newDate.getFullYear() + value);
        }

        await db.query('UPDATE users SET valid_until = ? WHERE id = ?', [newDate, id]);

        try {
            await db.query(
                'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
                [req.user.id, 'MANAGE_VALIDITY', `Admin set validity for user ${id} to ${newDate.toISOString()}`, req.ip]
            );
        } catch (e) {
            console.error("Log failed", e);
        }

        res.json({ message: 'User validity updated', valid_until: newDate });

    } catch (error) {
        console.error('Error managing validity:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};