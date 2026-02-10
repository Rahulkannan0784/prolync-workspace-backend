
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'student_hub_db',
};

async function debugStreak() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database:', dbConfig.database);

        // 1. Check valid users
        const [users] = await connection.query('SELECT id, name, email FROM users LIMIT 5');
        console.log('\n--- Active Users (Top 5) ---');
        console.table(users);

        if (users.length === 0) {
            console.log('No users found.');
            return;
        }

        // 2. Check submissions for these users
        console.log('\n--- Recent Submissions ---');
        const [submissions] = await connection.query(`
            SELECT s.user_id, s.question_id, s.status, s.submitted_at, DATE(s.submitted_at) as sub_date 
            FROM submissions s 
            ORDER BY s.submitted_at DESC 
            LIMIT 10
        `);
        console.table(submissions);

        // 3. Check learning_streak table
        console.log('\n--- Learning Streak Table ---');
        const [streaks] = await connection.query(`
            SELECT *, DATEDIFF(CURDATE(), last_active_date) as days_diff 
            FROM learning_streak
        `);
        console.table(streaks);

        // 4. Check Current Date from DB perspective
        const [timeResult] = await connection.query('SELECT NOW() as db_now, CURDATE() as db_curdate');
        console.log('\n--- DB Time Info ---');
        console.table(timeResult);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

debugStreak();
