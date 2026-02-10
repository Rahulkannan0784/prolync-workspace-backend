import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Since we run this from Backend/, .env is in same dir
dotenv.config();

const migrate = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Connected to database.');

        // Check if column exists
        const [columns] = await connection.query("SHOW COLUMNS FROM users LIKE 'valid_until'");

        if (columns.length === 0) {
            console.log('Adding valid_until column...');
            await connection.query("ALTER TABLE users ADD COLUMN valid_until DATETIME DEFAULT NULL");
            console.log('Column added successfully.');
        } else {
            console.log('Column valid_until already exists.');
        }

        await connection.end();
    } catch (error) {
        console.error('Migration failed:', error);
    }
};

migrate();
