import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const debugQuery = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const query = `
            SELECT c.*, 
            COUNT(DISTINCT e.id) as enrolled,
            COUNT(DISTINCT CASE WHEN e.progress = 100 THEN e.id END) as completed,
            IFNULL(AVG(cr.rating), 0) as rating
            FROM courses c
            LEFT JOIN enrollments e ON c.id = e.course_id
            LEFT JOIN course_ratings cr ON c.id = cr.course_id
            WHERE 1=1
            GROUP BY c.id ORDER BY c.created_at DESC
        `;

        console.log("Running Query...");
        const [rows] = await connection.execute(query);
        console.log("Query Success!", rows.length, "rows found.");
        console.log(rows[0]);

        await connection.end();
    } catch (error) {
        console.error("Query Failed!");
        console.error(error);
        if (error.code === 'ER_WRONG_FIELD_WITH_GROUP') {
            console.log("HINT: ONLY_FULL_GROUP_BY is enabled. Need to aggregate or group by all columns.");
        }
    }
};

debugQuery();
