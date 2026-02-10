
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function testFullFlow() {
    const email = 'pqr@gmail.com'; // HOD 5
    console.log(`Testing flow for HOD: ${email}`);

    const [hods] = await db.query('SELECT * FROM hod WHERE email = ?', [email]);
    if (hods.length === 0) {
        console.log('HOD not found');
        process.exit(1);
    }
    const hod = hods[0];

    // Simulate the token generation from authController
    const role = 'HOD';
    const token = jwt.sign({ id: hod.id, role }, process.env.JWT_SECRET, {
        expiresIn: '1d',
    });
    console.log('Generated token for ID:', hod.id);

    // Now simulate protectHOD and getOverview
    // protectHOD:
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await db.query('SELECT * FROM hod WHERE id = ?', [decoded.id]);
    const req_hod = rows[0];

    console.log(`Middleware attached HOD: ID=${req_hod.id}, College=${req_hod.college}, Dept=${req_hod.department}`);

    // getOverview:
    const college = req_hod.college;
    const department = req_hod.department;
    const hodId = req_hod.id;

    const [totalResult] = await db.query(
        `SELECT COUNT(*) as count FROM users u
             WHERE ((u.college_name = ? AND u.department = ?) 
                OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
             AND u.role = 'Student'`,
        [college, department, hodId]
    );

    console.log('--- FINAL RESULT ---');
    console.log('Total Students:', totalResult[0].count);

    process.exit();
}

testFullFlow();
