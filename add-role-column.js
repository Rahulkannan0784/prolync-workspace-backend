import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const addRoleColumn = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // details from prev step: `user_type` might exist? I will check and ADD `role` if missing.
        // Actually simple alter ignore is fine.
        try {
            await connection.query("ALTER TABLE users ADD COLUMN role ENUM('Student', 'Mentor', 'Admin') DEFAULT 'Student'");
            console.log("Added 'role' column to users table.");
        } catch (e) {
            console.log("Column 'role' might already exist or error:", e.message);
        }

        await connection.end();
    } catch (error) {
        console.error('Error altering table:', error);
    }
};

addRoleColumn();
