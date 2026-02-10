
import db from './config/db.js';

async function check() {
    try {
        console.log("Fetching HOD...");
        const [hods] = await db.query('SELECT * FROM hod LIMIT 1');
        const hod = hods[0];
        console.log("HOD:", hod.college, hod.department);

        console.log("\nRunning Query...");
        const query = `
            SELECT 
                u.id, 
                u.name, 
                u.email,
                u.last_login,
                (SELECT COUNT(*) FROM submissions s WHERE s.user_id = u.id) as problems_attempted,
                (SELECT COUNT(*) FROM submissions s WHERE s.user_id = u.id AND s.status = 'Accepted') as problems_solved,
                AVG(COALESCE(up.completion_percent, 0)) as avg_course_progress
            FROM users u
            LEFT JOIN user_progress up ON u.id = up.user_id
            WHERE ((u.college_name = ? AND u.department = ?) 
                OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
            AND u.role = 'STUDENT'
            GROUP BY u.id
            ORDER BY u.name ASC
            LIMIT 100
        `;

        const [rows] = await db.query(query, [hod.college, hod.department, hod.id]);
        console.log("Success! Rows:", rows.length);
        if (rows.length > 0) console.log("Sample:", rows[0]);
        process.exit(0);

    } catch (e) {
        console.error("SQL_ERROR:", e.code, e.sqlMessage);
        process.exit(1);
    }
}
check();
