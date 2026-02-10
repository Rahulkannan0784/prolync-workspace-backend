import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const addColumns = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Connected to database.');

        // Add 'role' column
        try {
            await connection.query("ALTER TABLE users ADD COLUMN role ENUM('Student', 'Instructor', 'Admin') DEFAULT 'Student'");
            console.log("Added 'role' column.");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("'role' column already exists.");
            } else {
                console.error("Error adding 'role' column:", err.message);
            }
        }

        // Add 'status' column
        try {
            await connection.query("ALTER TABLE users ADD COLUMN status ENUM('Active', 'Inactive', 'Banned') DEFAULT 'Active'");
            console.log("Added 'status' column.");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("'status' column already exists.");
            } else {
                console.error("Error adding 'status' column:", err.message);
            }
        }

        // Add 'last_login' column
        try {
            await connection.query("ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL");
            console.log("Added 'last_login' column.");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("'last_login' column already exists.");
            } else {
                console.error("Error adding 'last_login' column:", err.message);
            }
        }

        await connection.end();
        console.log('Migration completed.');

    } catch (error) {
        console.error('Database connection failed:', error);
    }
};

addColumns();
