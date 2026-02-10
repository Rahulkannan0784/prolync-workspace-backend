
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function testBothHods() {
    const college = 'KARPAGAm';
    const department = 'IT';

    for (const hodId of [4, 5]) {
        console.log(`\n--- Testing HOD ${hodId} ---`);

        // Total Students
        const [totalStudentsResult] = await db.query(
            `SELECT COUNT(*) as count FROM users u
         WHERE ((u.college_name = ? AND u.department = ?) 
            OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
         AND u.role = 'Student'`,
            [college, department, hodId]
        );
        console.log(`Total Students: ${totalStudentsResult[0].count}`);

        // Activity Trends (Logins) - Daily
        const [dailyLogins] = await db.query(`
        SELECT DATE(a.created_at) as date, COUNT(*) as count 
        FROM activity_logs a JOIN users u ON a.user_id = u.id
        WHERE ((u.college_name = ? AND u.department = ?) 
           OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
        AND a.action = 'LOGIN'
        AND a.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(a.created_at) ORDER BY date ASC
    `, [college, department, hodId]);
        console.log(`Daily Logins (count): ${dailyLogins.length}`);
        if (dailyLogins.length > 0) console.log(dailyLogins);
    }

    process.exit();
}

testBothHods();
