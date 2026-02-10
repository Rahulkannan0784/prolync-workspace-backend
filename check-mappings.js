
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function check() {
    const [hods] = await db.query('SELECT id, name, college, department FROM hod');
    console.log('--- HODs ---');
    console.log(hods);

    const [mappings] = await db.query('SELECT * FROM hod_student_mapping');
    console.log('--- Mappings ---');
    console.log(mappings);

    const [students] = await db.query('SELECT id, name, college_name, department FROM users WHERE role = "Student"');
    console.log('--- Students (Sample) ---');
    console.log(students.slice(0, 5));

    process.exit();
}

check();
