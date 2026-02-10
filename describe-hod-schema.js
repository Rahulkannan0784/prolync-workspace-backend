
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function describe() {
    const [hod] = await db.query('DESCRIBE hod');
    console.log('--- hod ---');
    console.log(hod);

    const [mapping] = await db.query('DESCRIBE hod_student_mapping');
    console.log('--- hod_student_mapping ---');
    console.log(mapping);

    const [users] = await db.query('DESCRIBE users');
    console.log('--- users ---');
    console.log(users);

    process.exit();
}

describe();
