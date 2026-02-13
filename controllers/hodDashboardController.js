
import db from '../config/db.js';

const getFilters = (req) => {
    return {
        college: req.hod.college,
        department: req.hod.department,
        hodId: req.hod.id
    };
};

export const getOverview = async (req, res) => {
    try {
        const { college, department, hodId } = getFilters(req);

        // 1. Total Students
        const [totalStudentsResult] = await db.query(
            `SELECT COUNT(*) as count FROM users u
             WHERE ((u.college_name = ? AND u.department = ?) 
                OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
             AND u.role = 'Student'`,
            [college, department, hodId]
        );
        const totalStudents = totalStudentsResult[0].count;

        // 2. Active in last 7 days (Logins)
        const [activeStudentsResult] = await db.query(
            `SELECT COUNT(DISTINCT user_id) as count FROM activity_logs a 
             JOIN users u ON a.user_id = u.id 
             WHERE ((u.college_name = ? AND u.department = ?) 
                OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
             AND a.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
            [college, department, hodId]
        );
        const activeStudents = activeStudentsResult[0].count;

        // 3. Dept Coding Solves (Accepted submissions)
        const [codingResult] = await db.query(`
            SELECT COUNT(*) as count 
            FROM submissions s
            JOIN users u ON s.user_id = u.id
            WHERE ((u.college_name = ? AND u.department = ?) 
                OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
            AND u.role = 'Student'
            AND s.status = 'Accepted'
        `, [college, department, hodId]);
        const totalCodingSolves = codingResult[0].count;

        // 4. Mentor Booked (Count distinct students who booked a session)
        const [mentorResult] = await db.query(`
            SELECT COUNT(DISTINCT ms.student_email) as count
            FROM mentorship_sessions ms
            JOIN users u ON ms.student_email = u.email
            WHERE (u.college_name = ? AND u.department = ?) 
               OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?))
        `, [college, department, hodId]);
        const mentorBookedCount = mentorResult[0].count;

        // 5. Top Active Students (Optimized: Just check activity logs count > 5)
        // This is much faster than correlated subqueries for every user
        // 5. Top Active Students (Optimized: Just check activity logs count > 5)
        const [topActiveResult] = await db.query(`
            SELECT COUNT(DISTINCT t.user_id) as count
            FROM (
                SELECT user_id, COUNT(*) as c FROM activity_logs 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY user_id
                HAVING c >= 5
            ) t
            JOIN users u ON t.user_id = u.id
            WHERE (u.college_name = ? AND u.department = ?) 
               OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?))
        `, [college, department, hodId]);
        const topActiveStudentCount = topActiveResult[0].count;

        // 6. Daily Active (Last 24 hours)
        const [dailyActiveResult] = await db.query(`
            SELECT COUNT(DISTINCT user_id) as count FROM activity_logs a 
            JOIN users u ON a.user_id = u.id 
            WHERE ((u.college_name = ? AND u.department = ?) 
               OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?))) 
            AND a.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
        `, [college, department, hodId]);
        const dailyActiveCount = dailyActiveResult[0].count;

        // 6. JOBS VIEWED (Replaced At-Risk)
        const [jobsResult] = await db.query(`
             SELECT COUNT(*) as count FROM job_applications ja
             JOIN users u ON ja.user_id = u.id
             WHERE (u.college_name = ? AND u.department = ?) 
                OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?))
        `, [college, department, hodId]);
        const jobsViewedCount = jobsResult[0].count;

        const [projectResult] = await db.query(`
             SELECT COUNT(*) as count FROM project_applications pa
             JOIN users u ON pa.student_id = u.id
             WHERE (u.college_name = ? AND u.department = ?) 
                OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?))
        `, [college, department, hodId]);
        const projectCount = projectResult[0].count;


        res.json({
            totalStudents,
            activeStudents,
            mentorBookedCount,
            topActiveStudentCount,
            totalCodingSolves,
            jobsViewedCount,
            projectCount,
            dailyActiveCount
        });
    } catch (error) {
        console.error("HOD Overview Error:", error);
        res.status(500).json({ message: "Error fetching overview stats" });
    }
};

export const getActivityTrends = async (req, res) => {
    try {
        const { college, department, hodId } = getFilters(req);

        // --- DAILY (Last 7 Days) ---
        const [dailyLogins] = await db.query(`
            SELECT DATE(a.created_at) as period_key, COUNT(*) as count 
            FROM activity_logs a JOIN users u ON a.user_id = u.id
            WHERE ((u.college_name = ? AND u.department = ?) 
               OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
            AND a.action = 'LOGIN'
            AND a.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY period_key ORDER BY period_key ASC
        `, [college, department, hodId]);

        const [dailySubmissions] = await db.query(`
            SELECT DATE(s.created_at) as period_key, COUNT(*) as count 
            FROM submissions s JOIN users u ON s.user_id = u.id
            WHERE ((u.college_name = ? AND u.department = ?) 
               OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
            AND s.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY period_key ORDER BY period_key ASC
        `, [college, department, hodId]);

        // --- WEEKLY (Last 8 Weeks) ---
        // Normalizing to Monday start
        const [weeklyLogins] = await db.query(`
            SELECT DATE(DATE_SUB(a.created_at, INTERVAL WEEKDAY(a.created_at) DAY)) as period_key, COUNT(*) as count 
            FROM activity_logs a JOIN users u ON a.user_id = u.id
            WHERE ((u.college_name = ? AND u.department = ?) 
               OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
            AND a.action = 'LOGIN'
            AND a.created_at >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
            GROUP BY period_key ORDER BY period_key ASC
        `, [college, department, hodId]);

        const [weeklySubmissions] = await db.query(`
            SELECT DATE(DATE_SUB(s.created_at, INTERVAL WEEKDAY(s.created_at) DAY)) as period_key, COUNT(*) as count 
            FROM submissions s JOIN users u ON s.user_id = u.id
            WHERE ((u.college_name = ? AND u.department = ?) 
               OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
            AND s.created_at >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
            GROUP BY period_key ORDER BY period_key ASC
        `, [college, department, hodId]);

        // --- MONTHLY (Last 6 Months) ---
        const [monthlyLogins] = await db.query(`
            SELECT DATE_FORMAT(a.created_at, '%Y-%m-01') as period_key, COUNT(*) as count 
            FROM activity_logs a JOIN users u ON a.user_id = u.id
            WHERE ((u.college_name = ? AND u.department = ?) 
               OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
            AND a.action = 'LOGIN'
            AND a.created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
            GROUP BY period_key ORDER BY period_key ASC
        `, [college, department, hodId]);

        const [monthlySubmissions] = await db.query(`
            SELECT DATE_FORMAT(s.created_at, '%Y-%m-01') as period_key, COUNT(*) as count 
            FROM submissions s JOIN users u ON s.user_id = u.id
            WHERE ((u.college_name = ? AND u.department = ?) 
               OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
            AND s.created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
            GROUP BY period_key ORDER BY period_key ASC
        `, [college, department, hodId]);

        res.json({
            daily: { logins: dailyLogins, submissions: dailySubmissions },
            weekly: { logins: weeklyLogins, submissions: weeklySubmissions },
            monthly: { logins: monthlyLogins, submissions: monthlySubmissions }
        });

    } catch (error) {
        console.error("HOD Activity Trends Error:", error);
        res.status(500).json({ message: "Error fetching activity trends" });
    }
};

export const getStudentPerformance = async (req, res) => {
    try {
        const { college, department, hodId } = getFilters(req);
        console.log(`[Dashboard] Fetching Student Performance for ${college} - ${department}`);

        // List students with derived stats
        const [students] = await db.query(`
            SELECT 
                u.id, 
                u.name, 
                u.email,
                u.last_login,
                (SELECT COUNT(*) FROM submissions s WHERE s.user_id = u.id) as problems_attempted,
                (SELECT COUNT(*) FROM submissions s WHERE s.user_id = u.id AND s.status = 'Accepted') as problems_solved,
                (SELECT AVG(up.completion_percent) FROM user_progress up WHERE up.user_id = u.id) as avg_course_progress
            FROM users u
            WHERE ((u.college_name = ? AND u.department = ?) 
                OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
            AND u.role = 'Student'
            ORDER BY u.name ASC
            LIMIT 100
        `, [college, department, hodId]);

        console.log(`[Dashboard] Found ${students.length} students for performance chart.`);

        // Process data for frontend (e.g. badges/labels)
        const processedStudents = students.map(s => {
            const progress = Number(s.avg_course_progress || 0);
            let label = 'Needs Attention';
            if (progress > 75) label = 'Excellent';
            else if (progress > 40) label = 'Average';

            return {
                ...s,
                avg_course_progress: Math.round(progress),
                performance_label: label
            };
        });

        res.json(processedStudents);

    } catch (error) {
        console.error("HOD Student Performance Error:", error);
        res.status(500).json({ message: "Error fetching student performance" });
    }
};

export const getTopPerformers = async (req, res) => {
    try {
        const { college, department, hodId } = getFilters(req);

        // Fetch top 5 students highest avg progress across courses + problem solving
        // We'll trust Avg Progress as main indicator
        const [performers] = await db.query(`
            SELECT 
                u.id,
                u.name, 
                u.email,
                u.profile_picture,
                ROUND(AVG(COALESCE(up.completion_percent, 0))) as avg_progress,
                (SELECT COUNT(*) FROM submissions s WHERE s.user_id = u.id AND s.status = 'Accepted') as problems_solved
            FROM users u
            LEFT JOIN user_progress up ON u.id = up.user_id
            WHERE ((u.college_name = ? AND u.department = ?) 
                OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
            AND u.role = 'Student'
            GROUP BY u.id
            ORDER BY avg_progress DESC, problems_solved DESC
            LIMIT 5
        `, [college, department, hodId]);

        res.json(performers);
    } catch (error) {
        console.error("HOD Top Performers Error:", error);
        res.status(500).json({ message: "Error fetching top performers" });
    }
};

export const getEngagementMetrics = async (req, res) => {
    try {
        const { college, department, hodId } = getFilters(req);

        // Total Code Runs (Submissions)
        const [runsResult] = await db.query(`
            SELECT COUNT(*) as count 
            FROM submissions s
            JOIN users u ON s.user_id = u.id
            WHERE ((u.college_name = ? AND u.department = ?) 
               OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
            AND u.role = 'Student'
         `, [college, department, hodId]);

        // Language Distribution
        const [languages] = await db.query(`
            SELECT 
                s.language, 
                COUNT(*) as count 
            FROM submissions s
            JOIN users u ON s.user_id = u.id
            WHERE ((u.college_name = ? AND u.department = ?) 
               OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
            AND u.role = 'Student'
            GROUP BY s.language
         `, [college, department, hodId]);

        res.json({
            totalCodeRuns: runsResult[0].count,
            languageDistribution: languages
        });

    } catch (error) {
        console.error("HOD Engagement Error:", error);
        res.status(500).json({ message: "Error fetching engagement metrics" });
    }
};

export const getAllDepartmentStudents = async (req, res) => {
    try {
        const { college, department, hodId } = getFilters(req);
        // Fetch all students with detailed profile info
        const [students] = await db.query(`
            SELECT 
                id, custom_id, name, email, phone_number, 
                gender, created_at, last_login, status, 
                profile_picture
            FROM users u
            WHERE ((u.college_name = ? AND u.department = ?) 
                OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
            AND u.role = 'Student'
            ORDER BY name ASC
        `, [college, department, hodId]);

        res.json(students);
    } catch (error) {
        console.error("HOD All Students Error:", error);
        res.status(500).json({ message: "Error fetching student list" });
    }
};

export const getRecentActivity = async (req, res) => {
    try {
        const { college, department, hodId } = getFilters(req);

        // Fetch latest 10 activities (Login)
        const [logs] = await db.query(`
            SELECT 
                u.name, 
                u.email,
                a.action,
                a.created_at,
                u.profile_picture
            FROM activity_logs a
            JOIN users u ON a.user_id = u.id
            WHERE ((u.college_name = ? AND u.department = ?) 
               OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
            ORDER BY a.created_at DESC
            LIMIT 10
        `, [college, department, hodId]);

        res.json(logs);
    } catch (error) {
        console.error("HOD Recent Activity Error:", error);
        res.status(500).json({ message: "Error fetching recent activity" });
    }
};

export const getStudentDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { college, department, hodId } = getFilters(req);

        // 1. Verify Student Exists & Belongs to Dept OR Assigned
        const [studentRows] = await db.query(`
            SELECT id, name, email, profile_picture, last_login 
            FROM users u
            WHERE id = ? 
            AND ((u.college_name = ? AND u.department = ?) OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
            AND u.role = 'Student'
        `, [id, college, department, hodId]);

        if (studentRows.length === 0) {
            return res.status(404).json({ message: "Student not found or unauthorized" });
        }
        const student = studentRows[0];

        // PROLYNC_FIX: Helper to safely fetch data sections without crashing the whole request
        const safelyFetch = async (promise, fallback = []) => {
            try {
                return await promise;
            } catch (error) {
                console.error(`Partial Data Error (${req.path}):`, error.message);
                return fallback;
            }
        };

        // 2. Courses (Enrollments)
        const courses = await safelyFetch((async () => {
            const [rows] = await db.query(`
                SELECT c.title, up.completion_percent as progress, up.last_accessed_at as last_accessed
                FROM user_progress up
                JOIN courses c ON up.course_id = c.id
                WHERE up.user_id = ?
            `, [id]);
            return rows;
        })());

        // 3. Coding (Submissions)
        const coding = await safelyFetch((async () => {
            const [rows] = await db.query(`
                SELECT 
                    COUNT(*) as total_runs,
                    SUM(CASE WHEN status = 'Accepted' THEN 1 ELSE 0 END) as solved,
                    MAX(created_at) as last_activity
                FROM submissions 
                WHERE user_id = ?
            `, [id]);
            return {
                total_runs: rows[0]?.total_runs || 0,
                solved: rows[0]?.solved || 0,
                last_activity: rows[0]?.last_activity
            };
        })(), { total_runs: 0, solved: 0, last_activity: null });

        // 4. Projects (Applications) - Table uses student_id
        const projects = await safelyFetch((async () => {
            const [rows] = await db.query(`
                SELECT p.title, pa.status, pa.applied_at
                FROM project_applications pa
                JOIN projects p ON pa.project_id = p.id
                WHERE pa.student_id = ?
            `, [id]);
            return rows;
        })());

        // 5. Mentor (Sessions) - Table uses student_email
        const mentor = await safelyFetch((async () => {
            // Check if student has email
            if (!student.email) return { total_booked: 0, completed: 0, last_booking: null };

            const [rows] = await db.query(`
                SELECT COUNT(*) as total, 
                    SUM(CASE WHEN ms.status = 'Completed' THEN 1 ELSE 0 END) as completed,
                    MAX(ms.slot_time) as last_booking
                FROM mentorship_sessions ms
                WHERE ms.student_email = ?
            `, [student.email]);
            return {
                total_booked: rows[0]?.total || 0,
                completed: rows[0]?.completed || 0,
                last_booking: rows[0]?.last_booking
            };
        })(), { total_booked: 0, completed: 0, last_booking: null });

        // 6. Jobs (Applications) - Replaced Placements with Jobs Viewed
        const jobs = await safelyFetch((async () => {
            const [rows] = await db.query(`
                SELECT j.job_title, j.company_name, ja.applied_at, ja.status
                FROM job_applications ja
                JOIN jobs j ON ja.job_id = j.job_id
                WHERE ja.user_id = ?
                ORDER BY ja.applied_at DESC
            `, [id]);
            return rows;
        })());

        // 7. Content & Engagement (Activity Logs)
        const activity_log = await safelyFetch((async () => {
            const [rows] = await db.query(`
                SELECT action, details, created_at
                FROM activity_logs
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT 10
            `, [id]);
            return rows;
        })());

        res.json({
            profile: {
                name: student.name,
                email: student.email,
                last_login: student.last_login,
                profile_picture: student.profile_picture
            },
            courses,
            coding,
            projects,
            mentor,
            jobs,
            activity_log
        });

    } catch (error) {
        console.error("HOD Student Details Fatal Error:", error);
        res.status(500).json({ message: "Error fetching student details" });
    }
};

export const getMetricDetails = async (req, res) => {
    try {
        const { college, department, hodId } = getFilters(req);
        const { metric } = req.query;

        let data = [];

        if (metric === 'mentor_booked') {
            const [rows] = await db.query(`
                SELECT u.name, u.email, u.profile_picture, COUNT(*) as value,
                       GROUP_CONCAT(DISTINCT CONCAT(ms.mentor_name, ' (', ms.topic, ')') SEPARATOR ', ') as mentor_names
                FROM mentorship_sessions ms
                JOIN users u ON ms.student_email = u.email
                WHERE ((u.college_name = ? AND u.department = ?) 
                   OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
                GROUP BY u.email
                ORDER BY value DESC
            `, [college, department, hodId]);
            data = rows;

        } else if (metric === 'projects') {
            const [rows] = await db.query(`
                SELECT u.name, u.email, u.profile_picture, COUNT(pa.id) as value,
                       GROUP_CONCAT(DISTINCT p.title SEPARATOR ', ') as project_titles
                FROM project_applications pa
                JOIN users u ON pa.student_id = u.id
                JOIN projects p ON pa.project_id = p.id
                WHERE ((u.college_name = ? AND u.department = ?) 
                   OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
                GROUP BY u.id
                ORDER BY value DESC
            `, [college, department, hodId]);
            data = rows;

        } else if (metric === 'daily_active') {
            const [rows] = await db.query(`
                SELECT u.name, u.email, u.profile_picture, 
                       (SELECT MAX(created_at) FROM activity_logs WHERE user_id = u.id) as value
                FROM users u
                WHERE ((u.college_name = ? AND u.department = ?) 
                   OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
                AND u.role = 'Student'
                ORDER BY value DESC
            `, [college, department, hodId]);
            data = rows;

        } else if (metric === 'jobs_viewed') {
            const [rows] = await db.query(`
                SELECT u.name, u.email, u.profile_picture, COUNT(*) as value,
                       GROUP_CONCAT(DISTINCT j.job_title SEPARATOR ', ') as job_titles
                FROM job_applications ja
                JOIN users u ON ja.user_id = u.id
                JOIN jobs j ON ja.job_id = j.job_id
                WHERE ((u.college_name = ? AND u.department = ?) 
                   OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
                GROUP BY u.id
                ORDER BY value DESC
            `, [college, department, hodId]);
            data = rows;

        } else if (metric === 'active') {
            // Students active in last 7 days
            const [rows] = await db.query(`
                SELECT u.name, u.email, u.profile_picture, 
                       (SELECT MAX(created_at) FROM activity_logs WHERE user_id = u.id) as value
                FROM users u
                WHERE ((u.college_name = ? AND u.department = ?) 
                   OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
                AND u.role = 'Student'
                ORDER BY value DESC
            `, [college, department, hodId]);
            data = rows;

        } else if (metric === 'top_active') {
            // Top active based on log count (same logic as KPI)
            const [rows] = await db.query(`
                SELECT u.name, u.email, u.profile_picture, COUNT(*) as value
                FROM activity_logs a
                JOIN users u ON a.user_id = u.id
                WHERE ((u.college_name = ? AND u.department = ?) 
                   OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
                GROUP BY u.id
                ORDER BY value DESC
                LIMIT 20
            `, [college, department, hodId]);
            data = rows;
        } else if (metric === 'performance') {
            const { courseId } = req.query;

            if (courseId) {
                // Return students who completed this specific course
                const [rows] = await db.query(`
                    SELECT u.name, u.email, u.profile_picture, up.completion_percent as value
                    FROM user_progress up
                    JOIN users u ON up.user_id = u.id
                    WHERE up.course_id = ? AND up.completion_percent = 100
                    AND ((u.college_name = ? AND u.department = ?) 
                       OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
                    ORDER BY u.name ASC
                `, [courseId, college, department, hodId]);
                data = rows;
            } else {
                // Return courses with student completion counts
                const [rows] = await db.query(`
                    SELECT c.id, c.title as name, COUNT(up.id) as value,
                           'Students Completed' as subtext
                    FROM courses c
                    JOIN user_progress up ON c.id = up.course_id
                    JOIN users u ON up.user_id = u.id
                    WHERE up.completion_percent = 100
                    AND ((u.college_name = ? AND u.department = ?) 
                       OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
                    GROUP BY c.id
                    ORDER BY value DESC
                `, [college, department, hodId]);
                data = rows.map(r => ({ ...r, isCourse: true }));
            }
        } else if (metric === 'total_solves') {
            // Return list of students and their solve counts
            const [rows] = await db.query(`
                SELECT u.name, u.email, u.profile_picture, COUNT(*) as value
                FROM submissions s
                JOIN users u ON s.user_id = u.id
                WHERE ((u.college_name = ? AND u.department = ?) 
                   OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
                AND s.status = 'Accepted'
                GROUP BY u.id
                ORDER BY value DESC
            `, [college, department, hodId]);
            data = rows;

        } else if (metric === 'daily_logins_detail') {
            const { date, period } = req.query; // date in YYYY-MM-DD format
            if (!date) return res.status(400).json({ message: "Date is required" });

            let dateCondition = "AND DATE(a.created_at) = ?";
            let queryParams = [college, department, hodId, date];

            if (period === 'weekly') {
                dateCondition = "AND DATE(a.created_at) BETWEEN ? AND DATE_ADD(?, INTERVAL 6 DAY)";
                queryParams = [college, department, hodId, date, date];
            } else if (period === 'monthly') {
                dateCondition = "AND YEAR(a.created_at) = YEAR(?) AND MONTH(a.created_at) = MONTH(?)";
                queryParams = [college, department, hodId, date, date];
            }

            const [rows] = await db.query(`
                SELECT u.name, u.email, u.profile_picture, 
                       DATE_FORMAT(MIN(a.created_at), '%H:%i') as first_login_time,
                       DATE_FORMAT(MIN(a.created_at), '%Y-%m-%d') as login_date,
                       COUNT(*) as login_count
                FROM activity_logs a
                JOIN users u ON a.user_id = u.id
                WHERE ((u.college_name = ? AND u.department = ?) 
                   OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
                AND a.action = 'LOGIN'
                ${dateCondition}
                GROUP BY u.id, DATE(a.created_at)
                ORDER BY MIN(a.created_at) ASC
            `, queryParams);
            data = rows;

        } else if (metric === 'daily_submissions_detail') {
            const { date, period } = req.query; // date in YYYY-MM-DD format
            if (!date) return res.status(400).json({ message: "Date is required" });

            let dateCondition = "AND DATE(s.created_at) = ?";
            let queryParams = [college, department, hodId, date];

            if (period === 'weekly') {
                dateCondition = "AND DATE(s.created_at) BETWEEN ? AND DATE_ADD(?, INTERVAL 6 DAY)";
                queryParams = [college, department, hodId, date, date];
            } else if (period === 'monthly') {
                dateCondition = "AND YEAR(s.created_at) = YEAR(?) AND MONTH(s.created_at) = MONTH(?)";
                queryParams = [college, department, hodId, date, date];
            }

            const [rows] = await db.query(`
                SELECT u.name, u.email, u.profile_picture, 
                       s.question_id, s.language, s.status,
                       DATE_FORMAT(s.created_at, '%Y-%m-%d %H:%i') as submission_time
                FROM submissions s
                JOIN users u ON s.user_id = u.id
                WHERE ((u.college_name = ? AND u.department = ?) 
                   OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
                ${dateCondition}
                ORDER BY s.created_at ASC
            `, queryParams);
            data = rows;
        }

        res.json(data);

    } catch (error) {
        console.error("HOD Details Error:", error);
        res.status(500).json({ message: "Error fetching details" });
    }
};

export const getEngagementInsights = async (req, res) => {
    try {
        const { college, department, hodId } = getFilters(req);
        const { filter = 'all' } = req.query;

        let query = `
            SELECT 
                u.id, u.name, u.email, u.profile_picture, u.last_login,
                ROUND(AVG(COALESCE(up.completion_percent, 0))) as avg_progress,
                (SELECT COUNT(*) FROM submissions s WHERE s.user_id = u.id AND s.status = 'Accepted') as problems_solved,
                (SELECT COUNT(*) FROM mentorship_sessions ms WHERE ms.student_email = u.email) as mentor_bookings,
                (SELECT COUNT(*) FROM project_applications pa WHERE pa.student_id = u.id) as projects_submitted,
                (SELECT MAX(created_at) FROM activity_logs a WHERE a.user_id = u.id) as last_activity_date,
                EXISTS (SELECT 1 FROM submissions s WHERE s.user_id = u.id) as has_coding,
                EXISTS (SELECT 1 FROM mentorship_sessions ms WHERE ms.student_email = u.email) as has_mentorship,
                EXISTS (SELECT 1 FROM project_applications pa WHERE pa.student_id = u.id) as has_projects,
                EXISTS (SELECT 1 FROM user_progress up WHERE up.user_id = u.id AND up.completion_percent > 0) as has_course_progress
            FROM users u
            LEFT JOIN user_progress up ON u.id = up.user_id
            WHERE ((u.college_name = ? AND u.department = ?) 
                OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
            AND u.role = 'Student'
        `;

        if (filter === 'no_coding' || filter === 'no_mentorship' || filter === 'no_projects' || filter === 'no_course' || filter === 'no_activity' || filter === 'inactivity' || filter.startsWith('active_')) {
            if (filter === 'no_coding') {
                query += ` AND NOT EXISTS (SELECT 1 FROM submissions s WHERE s.user_id = u.id AND s.status = 'Accepted')`;
            } else if (filter === 'no_mentorship') {
                query += ` AND NOT EXISTS (SELECT 1 FROM mentorship_sessions ms WHERE ms.student_email = u.email)`;
            } else if (filter === 'no_projects') {
                query += ` AND NOT EXISTS (SELECT 1 FROM project_applications pa WHERE pa.student_id = u.id)`;
            } else if (filter === 'no_course') {
                query += ` AND NOT EXISTS (SELECT 1 FROM user_progress up WHERE up.user_id = u.id AND up.completion_percent > 0)`;
            } else if (filter === 'no_activity') {
                query += ` AND (u.last_login IS NULL OR u.last_login < DATE_SUB(NOW(), INTERVAL 30 DAY))`;
            } else if (filter === 'active_course') {
                query += ` AND EXISTS (SELECT 1 FROM user_progress up WHERE up.user_id = u.id AND up.completion_percent > 0)`;
            } else if (filter === 'active_coding') {
                query += ` AND EXISTS (SELECT 1 FROM submissions s WHERE s.user_id = u.id AND s.status = 'Accepted')`;
            } else if (filter === 'active_mentor') {
                query += ` AND EXISTS (SELECT 1 FROM mentorship_sessions ms WHERE ms.student_email = u.email)`;
            } else if (filter === 'active_project') {
                query += ` AND EXISTS (SELECT 1 FROM project_applications pa WHERE pa.student_id = u.id)`;
            } else if (filter === 'inactivity') {
                // Strict zero-participation (nothing done ever in any key area)
                query += ` AND NOT EXISTS (SELECT 1 FROM submissions s WHERE s.user_id = u.id AND s.status = 'Accepted')
                           AND NOT EXISTS (SELECT 1 FROM mentorship_sessions ms WHERE ms.student_email = u.email)
                           AND NOT EXISTS (SELECT 1 FROM project_applications pa WHERE pa.student_id = u.id)
                           AND NOT EXISTS (SELECT 1 FROM user_progress up WHERE up.user_id = u.id AND up.completion_percent > 0)`;
            }
        }

        // Sorting based on category
        if (filter === 'course' || filter === 'no_course' || filter === 'active_course') {
            query += ` GROUP BY u.id ORDER BY avg_progress DESC`;
        } else if (filter === 'coding' || filter === 'no_coding' || filter === 'active_coding') {
            query += ` GROUP BY u.id ORDER BY problems_solved DESC`;
        } else if (filter === 'mentor' || filter === 'no_mentorship' || filter === 'active_mentor') {
            query += ` GROUP BY u.id ORDER BY mentor_bookings DESC`;
        } else if (filter === 'project' || filter === 'no_projects' || filter === 'active_project') {
            query += ` GROUP BY u.id ORDER BY projects_submitted DESC`;
        } else if (filter === 'top') {
            query += ` GROUP BY u.id ORDER BY avg_progress DESC, problems_solved DESC`;
        } else {
            query += ` GROUP BY u.id ORDER BY u.name ASC`;
        }

        query += ` LIMIT 100`;

        const [students] = await db.query(query, [college, department, hodId]);
        res.json(students);

    } catch (error) {
        console.error("Engagement Insights Error:", error);
        res.status(500).json({ message: "Error fetching engagement insights" });
    }
};
