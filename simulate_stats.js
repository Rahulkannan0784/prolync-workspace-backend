
import pool from './config/db.js';

async function simulateStats() {
    const userId = 82; // SATHISH
    try {
        const [progressRows] = await pool.query(
            "SELECT status, completion_percent FROM user_progress WHERE user_id = ?",
            [userId]
        );
        console.log("Progress Rows:", JSON.stringify(progressRows, null, 2));

        let activeCourses = 0;
        progressRows.forEach(row => {
            if (row.status !== 'Completed') {
                activeCourses++;
            }
        });
        console.log("Calculated Active Courses:", activeCourses);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

simulateStats();
