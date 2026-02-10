
import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'admin@123',
    database: 'workspace'
};

const targetEmail = 'bavishikas@gmail.com';

async function debugEnrollments() {
    let connection;
    try {
        console.log(`Connecting to database...`);
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected!');

        // 1. Get User ID
        const [users] = await connection.query('SELECT id, name, email FROM users WHERE email = ?', [targetEmail]);
        if (users.length === 0) {
            console.log('User not found!');
            return;
        }
        const user = users[0];
        console.log(`User Found: ${user.name} (ID: ${user.id})`);

        // 2. Check Enrollments Raw
        const [enrollments] = await connection.query('SELECT * FROM enrollments WHERE user_id = ?', [user.id]);
        console.log(`\nRaw Enrollments Count: ${enrollments.length}`);
        console.table(enrollments);

        if (enrollments.length > 0) {
            // 3. Check Course JOIN
            const courseIds = enrollments.map(e => e.course_id);
            console.log(`\nChecking Courses with IDs: ${courseIds.join(', ')}`);

            const [courses] = await connection.query(`SELECT id, title FROM courses WHERE id IN (?)`, [courseIds.length > 0 ? courseIds : [0]]);
            console.table(courses);

            // 4. Test the exact query used in controller
            const [joinedRows] = await connection.query(`
                SELECT c.title, e.progress, e.last_accessed
                FROM enrollments e
                JOIN courses c ON e.course_id = c.id
                WHERE e.user_id = ?
            `, [user.id]);
            console.log(`\nController Query Result Count: ${joinedRows.length}`);
            console.table(joinedRows);
        }

    } catch (error) {
        console.error('Debug failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

debugEnrollments();
