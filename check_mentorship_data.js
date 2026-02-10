import db from './config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const diagnose = async () => {
    try {
        const studentEmail = 'bavishikas@gmail.com'; // Correct email found from previous run
        // If not sure, we can search by "checking" user

        console.log("Checking for student:", studentEmail);

        // 1. Get User ID
        const [users] = await db.query("SELECT * FROM users WHERE email = ?", [studentEmail]);
        if (users.length === 0) {
            console.log("User not found via email. List of users:");
            const [allUsers] = await db.query("SELECT id, name, email FROM users LIMIT 10");
            console.table(allUsers);
            process.exit();
        }
        const user = users[0];
        console.log("User Found:", user.id, user.name, user.email);

        // 2. Check Mentorship Sessions (Counts & First Row)
        const [sessions] = await db.query("SELECT id, mentor_id, slot_time, status, created_at FROM mentorship_sessions WHERE student_email = ? ORDER BY created_at DESC", [user.email]);
        console.log(`\n--- Raw Sessions Count: ${sessions.length} ---`);
        if (sessions.length > 0) console.log("First Raw Session:", sessions[0]);

        // 3. Check Mentors (for each session)
        if (sessions.length > 0) {
            const mentorIds = sessions.map(s => s.mentor_id).filter(id => id);
            // ...
            if (mentorIds.length > 0) {
                const [mentors] = await db.query(`SELECT id, name, email FROM mentors WHERE id IN (?)`, [mentorIds]);
                console.log("\n--- Existing Mentors ---");
                console.table(mentors);
            } else {
                console.log("\nNo mentor IDs found in sessions.");
            }

            // 4. Check Join Result (What the Dashboard query does)
            const [joinResult] = await db.query(`
                SELECT ms.*, m.name as mentor_name_joined
                FROM mentorship_sessions ms
                JOIN mentors m ON ms.mentor_id = m.id
                WHERE ms.student_email = ?
            `, [user.email]);
            console.log(`\n--- JOIN Result Count: ${joinResult.length} ---`);
            if (joinResult.length > 0) console.log("First Join Session:", joinResult[0]);

            // 5. Check Next Session Query Logic
            const [nextSess] = await db.query(
                `SELECT ms.*
                 FROM mentorship_sessions ms
                 JOIN mentors m ON ms.mentor_id = m.id
                 WHERE ms.student_email = ?
                 AND (ms.status = 'Scheduled' OR ms.status = 'Pending') 
                 AND ms.slot_time >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
                 ORDER BY ms.slot_time ASC`,
                [user.email]
            );
            console.log(`\n--- Next Session Result Count: ${nextSess.length} ---`);
            console.log("NOW():", new Date().toISOString());
            if (nextSess.length > 0) console.log("First Next Session:", nextSess[0]);
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit();
    }
};

diagnose();
