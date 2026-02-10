
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function checkEnrollments() {
    try {
        console.log("Checking courses matching 'Modern CSS'...");
        const [courses] = await pool.query("SELECT id, title FROM courses WHERE title LIKE '%Modern CSS%'");
        console.table(courses);

        console.log("\nSearching for user 'Divya Sri' (srid52863@gmail.com)...");
        const [users] = await pool.query("SELECT id, name, email FROM users WHERE email LIKE '%srid52863%'");
        console.table(users);

        if (users.length > 0) {
            const userId = users[0].id;
            console.log(`\nChecking enrollments for user ${users[0].name} (ID: ${userId})...`);
            const [userEnrollments] = await pool.query("SELECT * FROM enrollments WHERE user_id = ?", [userId]);
            console.table(userEnrollments);
        }

        if (courses.length > 0) {
            const courseId = courses[0].id;
            console.log(`\nChecking ALL enrollments for Course ID: ${courseId}`);
            const [enrollments] = await pool.query(`
                SELECT e.id, e.user_id, u.name, e.enrolled_at 
                FROM enrollments e 
                JOIN users u ON e.user_id = u.id 
                WHERE e.course_id = ?
            `, [courseId]);
            console.table(enrollments);
        }

    } catch (error) {
        console.error("Error:", error);
    } process.exit();
}

checkEnrollments();
