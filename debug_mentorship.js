
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function checkSessions() {
    const email = 'bavishikas@gmail.com';
    console.log(`Checking sessions for email: ${email}`);

    const [desc] = await db.query('DESCRIBE mentorship_sessions');
    console.log('--- Table Schema ---');
    console.log(desc);

    const [sessions] = await db.query('SELECT * FROM mentorship_sessions WHERE student_email = ?', [email]);
    console.log('--- Sessions Found ---');
    console.log(sessions);

    const [allSessions] = await db.query('SELECT * FROM mentorship_sessions LIMIT 5');
    console.log('--- All Sessions (Sample) ---');
    console.log(allSessions);

    process.exit();
}

checkSessions();
