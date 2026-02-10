import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

// @desc    Log Learning Activity
// @route   POST /api/activity/log
export const logActivity = async (req, res) => {
    const { courseId, videoId, timeSpent, action, details } = req.body; // unified log
    const userId = req.user.id;

    try {
        const connection = await mysql.createConnection(dbConfig);
        const today = new Date().toISOString().split('T')[0];

        // 1. Log to learning_activity (Time tracking)
        if (timeSpent) {
            await connection.execute(
                `INSERT INTO learning_activity (user_id, course_id, video_id, time_spent_seconds, activity_date) 
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE time_spent_seconds = time_spent_seconds + VALUES(time_spent_seconds)`,
                [userId, courseId, videoId || null, timeSpent, today]
            );
        }

        // 2. Log to generic activity_logs (Feed) if action provided
        if (action) {
            await connection.execute(
                `INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)`,
                [userId, action, details || '', req.ip]
            );
        }

        // 3. Streak Calculation (Backend Driven)
        // Get current streak data
        const [streakRows] = await connection.execute(
            "SELECT * FROM learning_streak WHERE user_id = ?",
            [userId]
        );

        let currentStreak = 1;
        let maxStreak = 1;

        if (streakRows.length > 0) {
            const streakData = streakRows[0];
            const lastActive = streakData.last_active_date ? new Date(streakData.last_active_date).toISOString().split('T')[0] : null;

            if (lastActive === today) {
                // Already active today, streak unchanged
                currentStreak = streakData.current_streak;
                maxStreak = streakData.max_streak;
            } else {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (lastActive === yesterdayStr) {
                    // Continued streak
                    currentStreak = streakData.current_streak + 1;
                } else {
                    // Broken streak
                    currentStreak = 1;
                }
                maxStreak = Math.max(streakData.max_streak, currentStreak);
            }
        }

        // Update learning_streak table
        await connection.execute(
            `INSERT INTO learning_streak (user_id, current_streak, last_active_date, max_streak)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                current_streak = VALUES(current_streak),
                last_active_date = VALUES(last_active_date),
                max_streak = VALUES(max_streak)`,
            [userId, currentStreak, today, maxStreak]
        );

        await connection.end();
        res.json({ message: "Activity logged", streak: currentStreak });

    } catch (error) {
        console.error("Error logging activity:", error);
        res.status(500).json({ message: "Server error logging activity" });
    }
};

// @desc    Issue Certificate
// @route   POST /api/certificate/issue
export const issueCertificate = async (req, res) => {
    const { courseId } = req.body;
    const userId = req.user.id;

    if (!courseId) return res.status(400).json({ message: "Course ID required" });

    try {
        const connection = await mysql.createConnection(dbConfig);

        // Verify completion first
        const [progress] = await connection.execute(
            "SELECT * FROM user_progress WHERE user_id = ? AND course_id = ? AND status = 'Completed'",
            [userId, courseId]
        );

        if (progress.length === 0) {
            await connection.end();
            return res.status(400).json({ message: "Course not completed yet." });
        }

        // Check existing cert
        const [existing] = await connection.execute(
            "SELECT * FROM certificates WHERE user_id = ? AND course_id = ?",
            [userId, courseId]
        );

        if (existing.length > 0) {
            await connection.end();
            return res.json({ message: "Certificate already issued", certificate: existing[0] });
        }

        // Generate Code
        const code = `CERT-${userId}-${courseId}-${Date.now().toString(36).toUpperCase()}`;

        await connection.execute(
            "INSERT INTO certificates (user_id, course_id, certificate_code) VALUES (?, ?, ?)",
            [userId, courseId, code]
        );

        await connection.end();
        res.status(201).json({ message: "Certificate issued", code });

    } catch (error) {
        console.error("Error issuing certificate:", error);
        res.status(500).json({ message: "Server error issuing certificate" });
    }
};
