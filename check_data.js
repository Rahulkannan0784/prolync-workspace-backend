
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function checkData() {
    const [roles] = await db.query('SELECT DISTINCT role FROM users');
    console.log('--- Distinct Roles ---');
    console.log(roles);

    const [shika] = await db.query('SELECT name, role, college_name, department FROM users WHERE email = "bavishikas@gmail.com"');
    console.log('--- Shika Data ---');
    console.log(shika);

    const [hods] = await db.query('SELECT id, name, college, department FROM hod');
    console.log('--- HODs ---');
    console.log(hods);

    process.exit();
}

checkData();
