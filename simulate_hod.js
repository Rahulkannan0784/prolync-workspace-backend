
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function simulate() {
    const hodId = 5;
    const [hodRows] = await db.query('SELECT * FROM hod WHERE id = ?', [hodId]);
    const hod = hodRows[0];

    console.log(`Simulating for HOD: ${hod.name} (ID: ${hod.id}, College: ${hod.college}, Dept: ${hod.department})`);

    const college = hod.college;
    const department = hod.department;

    // 1. Total Students (The one that shows 0 in screenshot)
    const [totalStudentsResult] = await db.query(
        `SELECT COUNT(*) as count FROM users u
       WHERE ((u.college_name = ? AND u.department = ?) 
          OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
       AND u.role = 'Student'`,
        [college, department, hodId]
    );
    console.log(`Total Students: ${totalStudentsResult[0].count}`);

    // Let's check the students specifically
    const [students] = await db.query(
        `SELECT id, name, college_name, department, role FROM users u
       WHERE ((u.college_name = ? AND u.department = ?) 
          OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
       AND u.role = 'Student'`,
        [college, department, hodId]
    );
    console.log('Students found:', students);

    // 2. Mentor Booked (Count distinct students who booked a session)
    const [mentorResult] = await db.query(`
      SELECT COUNT(DISTINCT ms.student_email) as count
      FROM mentorship_sessions ms
      JOIN users u ON ms.student_email = u.email
      WHERE ((u.college_name = ? AND u.department = ?) 
         OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
  `, [college, department, hodId]);
    console.log(`Mentor Booked: ${mentorResult[0].count}`);

    process.exit();
}

simulate();
