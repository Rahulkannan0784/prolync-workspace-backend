
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'student_workspace_db',
};

async function migrate() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // Allow NULL and remove default for gender
        console.log('Altering gender default...');
        await connection.query("ALTER TABLE users MODIFY COLUMN gender ENUM('Male','Female','Other') NULL DEFAULT NULL");

        // Allow NULL and remove default for role
        console.log('Altering role default...');
        await connection.query("ALTER TABLE users MODIFY COLUMN role ENUM('Student','Instructor','Admin') NULL DEFAULT NULL");

        console.log('Migration successful.');
        await connection.end();
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
