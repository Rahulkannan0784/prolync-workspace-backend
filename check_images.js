import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const checkImages = async () => {
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME // 'workspace'
        });

        // Assuming table is 'courses' based on the screenshot (Full Stack, JavaScript, etc.)
        const [rows] = await conn.query("SELECT id, title, thumbnail FROM courses WHERE title LIKE '%Full Stack%' LIMIT 5");
        console.log("Course Images:", rows);

        await conn.end();
    } catch (e) {
        console.error(e);
    }
};

checkImages();
