import db from './config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const verifyFix = async () => {
    try {
        const studentEmail = 'bavishikas@gmail.com';
        console.log("Verifying Public Profile Mentor Query for:", studentEmail);

        // Run the CORRECTED query using 'm.role' instead of 'm.title'
        const query = `
            SELECT DISTINCT m.name as mentor_name, m.role as topic, 'Active' as status
            FROM mentorship_sessions ms
            JOIN mentors m ON ms.mentor_id = m.id
            WHERE ms.student_email = ?
            ORDER BY ms.created_at DESC
            LIMIT 5
        `;

        const [mentors] = await db.query(query, [studentEmail]);

        console.log(`\n--- Mentors Found: ${mentors.length} ---`);
        if (mentors.length > 0) {
            console.table(mentors);
            console.log("SUCCESS: Query works and returns data.");
        } else {
            console.log("FAILURE: Query returned no rows (but expected some).");
            // Double check if data exists at all
            const [rawSessions] = await db.query("SELECT * FROM mentorship_sessions WHERE student_email = ?", [studentEmail]);
            console.log(`Raw sessions count: ${rawSessions.length}`);
        }

    } catch (error) {
        console.error("Error executing query:", error.message);
    } finally {
        process.exit();
    }
};

verifyFix();
