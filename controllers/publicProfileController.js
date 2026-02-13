import db from '../config/db.js';

// Get Public Profile by ID
export const getPublicProfile = async (req, res) => {
    try {
        let paramId = req.params.id;

        if (!paramId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        // 1. Fetch Basic User Info (Strict Allow-list)
        // EXCLUDING: password, tokens, internal flags
        // We include 'email' internally to fetch mentorship data, but we DO NOT expose it in the final response.
        // 1. Fetch User Basics
        const baseColumns = `
            id, name, email, phone_number, bio, role, profile_picture, location, github, linkedin, leetcode, hackerrank, codechef, current_role, custom_id, created_at, college_name, department, cgpa, degree,
            show_email, show_phone, show_location,
            resume_path,
            resume_path as resume_url,
            CASE WHEN resume_path IS NOT NULL AND resume_path != '' THEN TRUE ELSE FALSE END as has_resume
        `;

        let userQuery;
        let queryParams;

        // Check if paramId is likely a custom_id (non-numeric)
        if (isNaN(paramId)) {
            userQuery = `SELECT ${baseColumns} FROM users WHERE custom_id = ?`;
            queryParams = [paramId];
        } else {
            userQuery = `SELECT ${baseColumns} FROM users WHERE id = ?`;
            queryParams = [paramId];
        }

        const [users] = await db.query(userQuery, queryParams);

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        const user = users[0];
        const userId = user.id; // Ensure we use numeric ID for relation queries

        // 2. Fetch Stats
        // Coding Stats - Solved Count
        const [submissionStats] = await db.query(`
            SELECT COUNT(DISTINCT question_id) as solved_count 
            FROM submissions 
            WHERE user_id = ? AND status = 'Accepted'
        `, [userId]);

        // Coding Stats - Difficulty Breakdown
        let codingBreakdown = { Easy: 0, Medium: 0, Hard: 0 };
        try {
            const [diffRows] = await db.query(`
                SELECT q.difficulty, COUNT(DISTINCT s.question_id) as count
                FROM submissions s
                JOIN questions q ON s.question_id = q.id
                WHERE s.user_id = ? AND s.status = 'Accepted'
                GROUP BY q.difficulty
            `, [userId]);

            diffRows.forEach(row => {
                if (row.difficulty) codingBreakdown[row.difficulty] = row.count;
            });
        } catch (e) {
            console.warn("Difficulty breakdown fetch failed", e.message);
        }

        // Weekly Activity
        let weeklyActivity = [];
        try {
            const [activityRows] = await db.query(`
                SELECT DATE_FORMAT(DATE_ADD(created_at, INTERVAL 330 MINUTE), '%Y-%m-%d') as date, COUNT(*) as count
                FROM submissions
                WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE_FORMAT(DATE_ADD(created_at, INTERVAL 330 MINUTE), '%Y-%m-%d')
                ORDER BY date ASC
            `, [userId]);
            weeklyActivity = activityRows;
        } catch (e) {
            console.warn("Weekly activity fetch failed", e.message);
        }

        let codingStreak = 0;
        try {
            const [cStreak] = await db.query(`
                SELECT current_streak, DATEDIFF(CURDATE(), last_active_date) as days_since_active 
                FROM coding_streak 
                WHERE user_id = ?
            `, [userId]);
            if (cStreak.length > 0) {
                const daysDiff = cStreak[0].days_since_active;
                // Valid if active Today (0) or Yesterday (1)
                if (daysDiff <= 1) {
                    codingStreak = cStreak[0].current_streak;
                }
            }
        } catch (e) {
            console.warn("Coding streak table missing or error", e.message);
        }

        // Learning Stats
        const [courseStats] = await db.query(`
            SELECT COUNT(*) as completed_courses 
            FROM enrollments 
            WHERE user_id = ? AND completed = 1
        `, [userId]);

        let learningStreak = 0;
        try {
            const [lStreak] = await db.query(`
                SELECT current_streak, DATEDIFF(CURDATE(), last_active_date) as days_since_active 
                FROM learning_streak 
                WHERE user_id = ?
            `, [userId]);
            if (lStreak.length > 0) {
                const daysDiff = lStreak[0].days_since_active;
                // Valid if active Today (0) or Yesterday (1)
                if (daysDiff <= 1) {
                    learningStreak = lStreak[0].current_streak;
                }
            }
        } catch (e) {
            console.warn("Learning streak table missing or error", e.message);
        }


        // Learning Time Estimate (Video Only - Formatted)
        let totalHours = "0h 0m";
        try {
            // 1. Get real video watch time
            const [videoStats] = await db.query(
                'SELECT SUM(watched_seconds) as total_seconds FROM student_video_progress WHERE user_id = ?',
                [userId]
            );

            const totalSeconds = videoStats[0].total_seconds || 0;
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);

            totalHours = `${hours}h ${minutes}m`;

        } catch (e) {
            console.warn("Error calculating video hours:", e.message);
        }

        // Total Active Questions
        let totalQuestions = { Easy: 0, Medium: 0, Hard: 0 };
        try {
            const [totalRows] = await db.query(`
                SELECT difficulty, COUNT(*) as count 
                FROM questions 
                WHERE is_active = TRUE 
                GROUP BY difficulty
            `);
            totalRows.forEach(row => {
                if (row.difficulty) totalQuestions[row.difficulty] = row.count;
            });
        } catch (e) {
            console.warn("Total questions fetch failed", e.message);
        }

        // Languages Used Breakdown
        let languagesUsed = {};
        try {
            const [langRows] = await db.query(`
                SELECT language, COUNT(DISTINCT question_id) as count
                FROM submissions
                WHERE user_id = ? AND status = 'Accepted'
                GROUP BY language
            `, [userId]);
            langRows.forEach(row => {
                languagesUsed[row.language] = row.count;
            });
        } catch (e) {
            console.warn("Languages used fetch failed", e.message);
        }

        const stats = {
            coding_streak: codingStreak,
            learning_streak: learningStreak,
            questions_solved: submissionStats[0].solved_count,
            courses_completed: courseStats[0].completed_courses,
            total_learning_hours: totalHours,
            coding_breakdown: codingBreakdown,
            total_questions: totalQuestions,
            languages_used: languagesUsed,
            weekly_activity: weeklyActivity
        };

        // 3. Fetch Badges
        let badges = [];
        try {
            // Assuming table user_badges stores badge_id or similar, and badges table has icon/name
            // Or if simple structure:
            const [badgeRows] = await db.query(`
                SELECT b.name, b.icon, b.description 
                FROM user_badges ub
                JOIN badges b ON ub.badge_id = b.id
                WHERE ub.user_id = ?
            `, [userId]);
            badges = badgeRows;
        } catch (e) {
            console.warn("Badges fetch failed", e.message);
        }

        // 4. Fetch Projects
        // Only Submitted or Approved projects
        let projects = [];
        try {
            const [projRows] = await db.query(`
                SELECT p.title, p.technology_stack, pa.status, pa.github_url, pa.live_url
                FROM project_applications pa
                JOIN projects p ON pa.project_id = p.id
                WHERE pa.student_id = ? AND pa.status IN ('Submitted', 'Approved', 'Completed')
                ORDER BY pa.applied_at DESC
                LIMIT 5
            `, [userId]);

            projects = projRows.map(p => {
                let stack = [];
                try {
                    const parsed = typeof p.technology_stack === 'string' ? JSON.parse(p.technology_stack || '[]') : p.technology_stack;
                    if (Array.isArray(parsed)) stack = parsed;
                } catch (e) { }

                return {
                    title: p.title,
                    technology_stack: stack,
                    status: p.status || 'Submitted',
                    github_link: p.github_url,
                    demo_link: p.live_url
                };
            });
        } catch (e) {
            console.warn("Projects fetch failed", e.message);
        }

        // 5. Fetch Mentors (New)
        let mentors = [];
        try {
            // Link by email as user_id is missing in mentorship_sessions
            const [mentorRows] = await db.query(`
                SELECT m.name as mentor_name, m.role as topic, 'Active' as status
                FROM mentorship_sessions ms
                JOIN mentors m ON ms.mentor_id = m.id
                WHERE ms.student_email = ?
                GROUP BY m.id, m.name, m.role
                ORDER BY MAX(ms.created_at) DESC
                LIMIT 5
            `, [user.email]);
            mentors = mentorRows;
        } catch (e) { console.warn("Mentors fetch failed", e.message); }

        // 6. Fetch Enrolled Courses (New)
        let enrolledCourses = [];
        try {
            const [enrollRows] = await db.query(`
                SELECT c.title, c.thumbnail, e.progress, e.completed
                FROM enrollments e
                JOIN courses c ON e.course_id = c.id
                WHERE e.user_id = ?
                ORDER BY e.progress DESC
                LIMIT 5
            `, [userId]);
            enrolledCourses = enrollRows;
        } catch (e) { console.warn("Enrolled courses fetch failed", e.message); }

        // 7. Fetch Certificates (New)
        let certificates = [];
        try {
            const [certRows] = await db.query(`
                SELECT c.title as course_title, c.thumbnail as course_thumbnail, cert.issued_at, cert.certificate_code
                FROM certificates cert
                JOIN courses c ON cert.course_id = c.id
                WHERE cert.user_id = ?
                ORDER BY cert.issued_at DESC
            `, [userId]);
            certificates = certRows;
        } catch (e) { console.warn("Certificates fetch failed", e.message); }

        // 6. Construct Response
        const publicProfile = {
            id: userId, // Safe to return ID as it's in the URL
            name: user.name,
            role: user.role, // Student
            bio: user.bio,
            location: user.show_location ? user.location : null,
            college_name: user.college_name,
            department: user.department,
            cgpa: user.cgpa,
            degree: user.degree,
            profile_picture: user.profile_picture,
            current_role: user.current_role,
            is_verified: true, // You can add logic for verification (e.g. if college_name is present)
            social_links: {
                github: user.github,
                linkedin: user.linkedin,
                leetcode: user.leetcode,
                hackerrank: user.hackerrank,
                codechef: user.codechef
            },
            stats: stats,
            badges: badges,
            projects: projects,
            mentors: mentors,
            enrolled_courses: enrolledCourses,
            certificates: certificates,
            has_resume: !!user.resume_path, // Boolean flag only
            resume_url: user.resume_path ? user.resume_path : null, // Or separate endpoint to view

            // Conditionally add contact info
            email: user.show_email ? user.email : null,
            phone_number: user.show_phone ? user.phone_number : null
        };

        res.json(publicProfile);

    } catch (error) {
        console.error("Get Public Profile Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
