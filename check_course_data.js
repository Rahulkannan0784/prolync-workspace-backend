
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'student_hub_db',
};

async function checkData() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to DB:", dbConfig.database);

        // 1. Find the course
        const [courses] = await connection.query("SELECT * FROM courses WHERE title LIKE '%dedd%'");
        if (courses.length === 0) {
            console.log("Course 'dedd' not found!");
            return;
        }
        const course = courses[0];
        console.log("Found Course:", { id: course.id, title: course.title });

        // 2. Check Enrollments Raw
        const [enrollments] = await connection.query("SELECT * FROM enrollments WHERE course_id = ?", [course.id]);
        console.log("\nRaw Enrollments:", enrollments);

        // 3. Run the Analytics Queries (copied from controller)

        // Basic Stats
        const [basicStats] = await connection.query(
            'SELECT COUNT(*) as total_students, AVG(progress) as average_progress FROM enrollments WHERE course_id = ?',
            [course.id]
        );
        console.log("\nBasic Stats Query Result:", basicStats[0]);

        // Growth
        const [growth] = await connection.query(`
            SELECT DATE_FORMAT(enrolled_at, '%b') as name, COUNT(*) as value
            FROM enrollments 
            WHERE course_id = ? 
            GROUP BY DATE_FORMAT(enrolled_at, '%Y-%m'), name
            ORDER BY DATE_FORMAT(enrolled_at, '%Y-%m') ASC
            LIMIT 6
        `, [course.id]);
        console.log("\nGrowth Query Result:", growth);

        // Completion
        const [completion] = await connection.query(`
            SELECT 
                CASE 
                    WHEN completed = 1 THEN 'Completed'
                    WHEN progress > 0 THEN 'In Progress'
                    ELSE 'Not Started'
                END as name,
                COUNT(*) as value
            FROM enrollments
            WHERE course_id = ?
            GROUP BY name
        `, [course.id]);
        console.log("\nCompletion Query Result:", completion);


    } catch (error) {
        console.error("Error:", error);
    } finally {
        if (connection) await connection.end();
    }
}

checkData();
