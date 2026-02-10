
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'student_hub_db',
};

async function recalculateStreaks() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // Get all users who have submitted something
        const [users] = await connection.query('SELECT DISTINCT user_id FROM submissions');

        console.log(`Found ${users.length} users with submissions.`);

        for (const user of users) {
            const userId = user.user_id;

            // Get all ACCEPTED submission dates (unique days)
            const [rows] = await connection.query(`
                SELECT DISTINCT DATE(created_at) as date 
                FROM submissions 
                WHERE user_id = ? AND status = 'Accepted'
                ORDER BY date ASC
             `, [userId]);

            if (rows.length === 0) continue;

            const dates = rows.map(r => new Date(r.date));

            // Calculate Max Streak
            let maxStreak = 0;
            let currentRun = 0;
            for (let i = 0; i < dates.length; i++) {
                if (i === 0) {
                    currentRun = 1;
                } else {
                    const diffTime = Math.abs(dates[i] - dates[i - 1]);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays === 1) {
                        currentRun++;
                    } else {
                        currentRun = 1;
                    }
                }
                if (currentRun > maxStreak) maxStreak = currentRun;
            }

            // Calculate Current Streak
            // Check if active today or yesterday
            const lastActive = dates[dates.length - 1];
            const today = new Date();

            // Normalize to YYYY-MM-DD for comparison
            const isSameDay = (d1, d2) =>
                d1.getFullYear() === d2.getFullYear() &&
                d1.getMonth() === d2.getMonth() &&
                d1.getDate() === d2.getDate();

            const diffTime = Math.abs(today - lastActive);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Floor because we want full days passed

            let currentStreak = 0;

            // If last active was today or yesterday, calculated sequence ending at lastActive is valid
            // Actually, strict logic:
            // If active today: current streak is the run ending today.
            // If active yesterday: current streak is the run ending yesterday.
            // If active before yesterday: current streak is 0.

            // Let's re-evaluate the run ending at the last date
            let runEndingAtLast = 1;
            for (let i = dates.length - 1; i > 0; i--) {
                const diff = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
                if (Math.round(diff) === 1) {
                    runEndingAtLast++;
                } else {
                    break;
                }
            }

            if (isSameDay(lastActive, today)) {
                currentStreak = runEndingAtLast;
            } else {
                // Check if yesterday
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                if (isSameDay(lastActive, yesterday)) {
                    currentStreak = runEndingAtLast;
                } else {
                    currentStreak = 0;
                }
            }

            console.log(`User ${userId}: Max: ${maxStreak}, Current: ${currentStreak}, Last Active: ${lastActive.toISOString().split('T')[0]}`);

            // Upsert into coding_streak
            await connection.query(`
                 INSERT INTO coding_streak (user_id, current_streak, max_streak, last_active_date)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                 current_streak = VALUES(current_streak),
                 max_streak = VALUES(max_streak),
                 last_active_date = VALUES(last_active_date)
             `, [userId, currentStreak, maxStreak, lastActive]);
        }

        console.log('✅ Recalculation complete.');

    } catch (error) {
        console.error('Error recalculating streaks:', error);
    } finally {
        if (connection) await connection.end();
    }
}

recalculateStreaks();
