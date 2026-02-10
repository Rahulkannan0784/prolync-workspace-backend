import db from './config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const investigate = async () => {
    try {
        const studentEmail = 'bavishikas@gmail.com';
        console.log("Checking Public Profile logic for:", studentEmail);

        // 1. Get User by Email (to find ID)
        const [users] = await db.query("SELECT id, email, name, role FROM users WHERE email = ?", [studentEmail]);
        if (!users.length) { console.log("User not found"); process.exit(); }
        const user = users[0];
        console.log("User Found:", user);

        // 2. Run the Query EXACTLY as in publicProfileController.js
        console.log("\n--- Running Controller Query ---");
        const query = `
            SELECT DISTINCT m.name as mentor_name, m.title as topic, 'Active' as status
            FROM mentorship_sessions ms
            JOIN mentors m ON ms.mentor_id = m.id
            WHERE ms.student_email = ?
            ORDER BY ms.created_at DESC
            LIMIT 5
        `;
        const [mentors] = await db.query(query, [user.email]);

        console.log(`\n--- Mentors Found: ${mentors.length} ---`);
        if (mentors.length > 0) {
            console.table(mentors);
        } else {
            console.log("No mentors returned by JOIN query.");

            // 3. Debug: Why no join match?
            console.log("\n--- Debugging: Check Sessions ---");
            const [sessions] = await db.query("SELECT id, mentor_id, student_email FROM mentorship_sessions WHERE student_email = ?", [user.email]);
            console.table(sessions);

            if (sessions.length > 0) {
                const mentorIds = sessions.map(s => s.mentor_id);
                console.log("\n--- Debugging: Check Mentors with IDs: " + mentorIds.join(', ') + " ---");
                const [mentorCheck] = await db.query("SELECT id, name FROM mentors WHERE id IN (?)", [mentorIds]);
                console.table(mentorCheck);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit();
    }
};

investigate();
