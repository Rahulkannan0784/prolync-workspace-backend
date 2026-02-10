
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function testQuery() {
    const college = 'KARPAGAm';
    const department = 'IT';
    const hodId = 5;

    console.log(`Running test for HOD ${hodId} (${college}/${department})`);

    const [totalStudentsResult] = await db.query(
        `SELECT u.id, u.name, u.role, u.college_name, u.department FROM users u
             WHERE (u.college_name = ? AND u.department = ?) 
                OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?))
             AND u.role = 'Student'`,
        [college, department, hodId]
    );
    console.log('--- Total Students Query Result ---');
    console.log(totalStudentsResult);

    const [correctedResult] = await db.query(
        `SELECT u.id, u.name, u.role, u.college_name, u.department FROM users u
             WHERE ((u.college_name = ? AND u.department = ?) 
                OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
             AND u.role = 'Student'`,
        [college, department, hodId]
    );
    console.log('--- Corrected Query Result ---');
    console.log(correctedResult);

    process.exit();
}

testQuery();
