import db from '../config/db.js';

// @desc    Get student's activity feed
// @route   GET /api/student/activity
// @access  Private (Student)
export const getStudentActivity = async (req, res) => {
    try {
        const userId = req.user.id;
        const [activities] = await db.query(`
            SELECT * FROM activity_logs 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 50
        `, [userId]);

        res.json(activities);
    } catch (error) {
        console.error('Error fetching student activity:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Log a new activity
// @route   POST /api/student/activity/log
// @access  Private (Student)
export const logStudentActivity = async (req, res) => {
    try {
        const userId = req.user.id;
        const { action, details, ip_address } = req.body;

        if (!action) {
            return res.status(400).json({ message: 'Action is required' });
        }

        await db.query(`
            INSERT INTO activity_logs (user_id, action, details, ip_address)
            VALUES (?, ?, ?, ?)
        `, [userId, action, details || '', ip_address || req.ip]);

        res.status(201).json({ message: 'Activity logged' });
    } catch (error) {
        console.error('Error logging activity:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
// @desc    Get student stats (Streak, Minutes, Counts)
// @route   GET /api/student/stats
// @access  Private (Student)
export const getStudentStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Total Minutes (from learning_activity)
        const [activities] = await db.query(
            "SELECT SUM(time_spent_seconds) as total_seconds FROM learning_activity WHERE user_id = ?",
            [userId]
        );
        const totalMinutes = Math.round((activities[0].total_seconds || 0) / 60);

        // Calculate Streak (Dynamic & Accurate from All Activity Sources)
        // 1. Fetch all distinct activity dates from multiple sources
        const activityDatesSet = new Set();

        // Source A: Learning Activity (Time Spent)
        const [learningDates] = await db.query(
            "SELECT DISTINCT activity_date FROM learning_activity WHERE user_id = ?",
            [userId]
        );
        learningDates.forEach(row => activityDatesSet.add(new Date(row.activity_date).toISOString().split('T')[0]));

        // Source B: Coding Submissions (Accepted or Attempted? Let's say all attempts count as activity)
        const [submissionDates] = await db.query(
            "SELECT DISTINCT DATE_FORMAT(DATE_ADD(created_at, INTERVAL 330 MINUTE), '%Y-%m-%d') as date FROM submissions WHERE user_id = ?",
            [userId]
        );
        submissionDates.forEach(row => activityDatesSet.add(row.date));

        // Source C: General Activity Logs (Excluding Login/Register)
        const [logDates] = await db.query(
            "SELECT DISTINCT DATE_FORMAT(DATE_ADD(created_at, INTERVAL 330 MINUTE), '%Y-%m-%d') as date FROM activity_logs WHERE user_id = ? AND action NOT IN ('LOGIN', 'REGISTER')",
            [userId]
        );
        logDates.forEach(row => activityDatesSet.add(row.date));

        // Convert to sorted array
        const sortedDates = Array.from(activityDatesSet).sort((a, b) => new Date(b) - new Date(a)); // Descending

        let streak = 0;
        if (sortedDates.length > 0) {
            const today = new Date();
            // IST Adjustment if needed usually handled in query, but Javascript Date is local to server.
            // Assuming server is UTC or local, let's just match string formats.
            // Ideally we stick to one timezone. The queries above used +330 min (IST).
            // So we should compare against IST today.
            const istNow = new Date(today.getTime() + (330 * 60 * 1000));
            const todayStr = istNow.toISOString().split('T')[0];

            const yesterday = new Date(istNow);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            const mostRecentStr = sortedDates[0];

            // Check if chain starts today or yesterday
            if (mostRecentStr === todayStr || mostRecentStr === yesterdayStr) {
                streak = 1;

                // Iterate backwards
                for (let i = 0; i < sortedDates.length - 1; i++) {
                    const currentDate = new Date(sortedDates[i]);
                    const prevDate = new Date(sortedDates[i + 1]);

                    // Diff in days
                    const diffTime = Math.abs(currentDate - prevDate);
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays === 1) {
                        streak++;
                    } else {
                        break; // Chain broken
                    }
                }
            }
        }

        // Update the cache table
        await db.query(`
            INSERT INTO learning_streak (user_id, current_streak, last_active_date, max_streak)
            VALUES (?, ?, DATE(NOW()), ?)
            ON DUPLICATE KEY UPDATE current_streak = VALUES(current_streak)
        `, [userId, streak, streak]);

        // 2. Course Counts
        // Fetch Certificates for strictly Completed count
        // 3. Completed Courses
        let completedCourses = 0;
        try {
            // Count based on Enrollments (Source of truth)
            const [rows] = await db.query(`
                SELECT COUNT(*) as count 
                FROM enrollments 
                WHERE user_id = ? AND completed = 1
            `, [userId]);
            completedCourses = rows[0].count;
        } catch (error) {
            console.warn("Error counting completed courses:", error.message);
        }

        // Fetch User Progress for Active count
        const [progressRows] = await db.query(
            "SELECT status, completion_percent FROM user_progress WHERE user_id = ?",
            [userId]
        );

        let activeCourses = 0;
        progressRows.forEach(row => {
            // Count as active if not completed (includes Not Started as per student expectation)
            if (row.status !== 'Completed') {
                activeCourses++;
            }
        });

        // 3. Not Started Courses
        const [totalCoursesRes] = await db.query("SELECT COUNT(*) as count FROM courses");
        const totalCourses = totalCoursesRes[0].count;
        const enrolledCount = progressRows.length;
        const notStartedCourses = Math.max(0, totalCourses - enrolledCount);

        // --- EXTENDED PREMIUM METRICS ---

        // 4. Problems Solved (Coding)
        let problemsSolved = 0;
        try {
            const [codingRows] = await db.query("SELECT COUNT(DISTINCT question_id) as count FROM submissions WHERE user_id = ? AND status = 'Accepted'", [userId]);
            problemsSolved = codingRows[0].count;
        } catch (e) {
            console.error("Error fetching solved problems:", e);
        }

        // 5. Projects Stats (Pending vs Completed)
        let projectsSubmitted = 0; // Total applications
        let projectsPending = 0;
        let projectsCompleted = 0;

        try {
            const [projRows] = await db.query(
                "SELECT status FROM project_applications WHERE student_id = ?",
                [userId]
            );

            // projectsSubmitted should only count approved/completed projects
            // This way, the dashboard stat only increases when admin approves
            projectsSubmitted = 0;

            projRows.forEach(row => {
                const s = row.status || '';

                // Count as Submitted if it's actually submitted (not just interested)
                if (['Submitted', 'Changes Required', 'Completed', 'Approved'].includes(s)) {
                    projectsSubmitted++;
                }

                // Count as Pending if waiting for review
                if (['Submitted', 'Changes Required', 'Pending'].includes(s)) {
                    projectsPending++;
                }

                // Count as Completed/Approved
                if (s === 'Completed' || s === 'Approved') {
                    projectsCompleted++;
                }
            });

        } catch (e) { console.error("Error fetching project stats", e); }

        // 7. Jobs Applied
        let jobsApplied = 0;
        try {
            const [jobRows] = await db.query("SELECT COUNT(*) as count FROM job_applications WHERE user_id = ?", [userId]);
            jobsApplied = jobRows[0].count;
        } catch (e) { /* Table might not exist */ }

        // 8. Mentor Bookings (Upcoming)
        let mentorBookings = 0;
        let nextSession = null;
        try {
            const [mentorRows] = await db.query(
                "SELECT COUNT(*) as count FROM mentorship_sessions WHERE student_email = (SELECT email FROM users WHERE id = ?) AND (status = 'Scheduled' OR status = 'Pending')",
                [userId]
            );
            mentorBookings = mentorRows[0].count;

            // Get next session details if any
            // Filter slightly for future sessions if possible, or just take the next upcoming one sorted by time
            // Since slot_time format is "YYYY-MM-DD HH:mm", we can use string comparison for dates
            // Get next session details if any
            // Filter for sessions that haven't ended yet (assuming 1 hour duration)
            // Using DB timestamp comparison to avoid timezone mismatches with JS toISOString()
            const [nextSess] = await db.query(
                `SELECT ms.*, COALESCE(ms.meeting_link, m.meeting_url) as meeting_link,
                 STR_TO_DATE(ms.slot_time, '%Y-%m-%d %h:%i %p') as session_date
                 FROM mentorship_sessions ms
                 JOIN mentors m ON ms.mentor_id = m.id
                 WHERE ms.student_email = (SELECT email FROM users WHERE id = ?) 
                 AND (ms.status = 'Scheduled' OR ms.status = 'Pending') 
                 AND STR_TO_DATE(ms.slot_time, '%Y-%m-%d %h:%i %p') >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
                 ORDER BY session_date ASC 
                 LIMIT 1`,
                [userId]
            );

            if (nextSess.length > 0) {
                const session = nextSess[0];
                nextSession = {
                    ...session,
                    schedule_time: session.slot_time,
                    meeting_link: session.meeting_link
                };
            } else {
                // Fallback: If no future session, check if there are ANY scheduled (maybe today but slightly earlier?)
                // actually sticky "next" is better.
            }
        } catch (e) { /* Table might not exist */ }

        // --- 9. Badge Calculation (Auto-Healing) ---
        // Fetch missing stats for badge logic
        let scenariosActive = 0;
        let kitsActive = 0;
        try {
            const [sRows] = await db.query("SELECT COUNT(DISTINCT context_id) as count FROM submissions WHERE user_id = ? AND context_type = 'scenario'", [userId]);
            const [kRows] = await db.query("SELECT COUNT(DISTINCT context_id) as count FROM submissions WHERE user_id = ? AND context_type = 'kit'", [userId]);
            scenariosActive = sRows[0].count;
            kitsActive = kRows[0].count;
        } catch (e) { console.error("Error fetching extra stats", e); }

        // Run Checks & Award
        try {
            const checks = [
                { condition: problemsSolved >= 20, badge: 'Bronze Solver' },
                { condition: problemsSolved >= 100, badge: 'Silver Solver' },
                { condition: problemsSolved >= 200, badge: 'Gold Solver' },
                { condition: scenariosActive >= 10, badge: 'Scenario Master' },
                { condition: kitsActive >= 1, badge: 'Kit Champion' }
            ];

            for (const check of checks) {
                if (check.condition) {
                    const [bRows] = await db.query('SELECT id FROM badges WHERE name = ?', [check.badge]);
                    if (bRows.length > 0) {
                        await db.query('INSERT IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)', [userId, bRows[0].id]);
                    }
                }
            }
        } catch (e) { console.error("Auto-award badges dash error", e); }

        // Use user_badges table for consistency
        let badgesEarned = 0;
        try {
            const [badgeRows] = await db.query("SELECT COUNT(*) as count FROM user_badges WHERE user_id = ?", [userId]);
            badgesEarned = badgeRows[0].count;
        } catch (e) {
            console.error("Error fetching badge count", e);
        }


        // 9. Fetch Certificates List
        let certificates = [];
        try {
            const [certRows] = await db.query(`
                SELECT c.certificate_code as certificate_id, c.issued_at, co.title as course_title, co.instructor
                FROM certificates c
                JOIN courses co ON c.course_id = co.id
                WHERE c.user_id = ?
                ORDER BY c.issued_at DESC
            `, [userId]);
            certificates = certRows;
        } catch (e) {
            console.error("Error fetching certificates list", e);
        }

        res.json({
            totalMinutes,
            streak,
            completedCourses,  // Now accurate based on certs + progress
            activeCourses,
            notStartedCourses,
            problemsSolved, // Coding
            projectsSubmitted,
            projectsPending,
            projectsCompleted,
            badgesEarned,
            jobsApplied,
            mentorBookings,
            nextSession,
            certificates // <--- Added this
        });

    } catch (error) {
        console.error('Error fetching student stats:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get calendar activity data
// @route   GET /api/student/calendar
// @access  Private (Student)
export const getCalendarData = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch learning sessions (time spent)
        const [learningRows] = await db.query(`
            SELECT activity_date, time_spent_seconds, course_id
            FROM learning_activity 
            WHERE user_id = ?
                ORDER BY activity_date DESC
                    `, [userId]);

        // Fetch activity logs (events like completion)
        const [logRows] = await db.query(`
            SELECT created_at, action, details
            FROM activity_logs
            WHERE user_id = ?
            ORDER BY created_at DESC
        `, [userId]);

        // Merge Data by Date (YYYY-MM-DD)
        const calendarMap = {};

        // Process Learning Time
        learningRows.forEach(row => {
            // Fix: Shift to IST (UTC+5:30)
            const d = new Date(row.activity_date);
            const istDate = new Date(d.getTime() + (330 * 60 * 1000));
            const date = istDate.toISOString().split('T')[0];

            if (!calendarMap[date]) {
                calendarMap[date] = { date, timeSpent: 0, actions: [], courses: new Set() };
            }
            calendarMap[date].timeSpent += row.time_spent_seconds;
        });

        // Process Logs
        console.log('Log Rows Found:', logRows.length);
        logRows.forEach(row => {
            // Fix: Shift to IST (UTC+5:30)
            const d = new Date(row.created_at);
            const istDate = new Date(d.getTime() + (330 * 60 * 1000));
            const date = istDate.toISOString().split('T')[0];

            if (!calendarMap[date]) {
                calendarMap[date] = { date, timeSpent: 0, actions: [], courses: new Set() };
            }
            // Use details if avail, else formatted action
            const displayStr = row.details || row.action.replace(/_/g, ' ');
            // console.log('Action:', date, displayStr);
            calendarMap[date].actions.push(displayStr);
        });

        // Convert Map to Array
        const result = Object.values(calendarMap).map(day => ({
            ...day,
            courses: Array.from(day.courses) // Convert Set to Array
        }));

        res.json(result);

    } catch (error) {
        console.error('Error fetching calendar data:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
