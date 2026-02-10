import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log("Connected to DB");

        const courseId = 50;

        // Test Kpis
        const [kpiRows] = await conn.query(`
            SELECT 
                COUNT(*) as total_enrollments
            FROM enrollments 
            WHERE course_id = ?
        `, [courseId]);
        console.log("Total Enrollments:", kpiRows[0]);

        // Test Growth Query
        const [growthRows] = await conn.query(`
            SELECT DATE_FORMAT(enrolled_at, '%Y-%m-%d') as date, COUNT(*) as value
            FROM enrollments 
            WHERE course_id = ?
            GROUP BY DATE_FORMAT(enrolled_at, '%Y-%m-%d')
            ORDER BY date ASC
        `, [courseId]);

        console.log('Growth Rows:', growthRows);

        await conn.end();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
