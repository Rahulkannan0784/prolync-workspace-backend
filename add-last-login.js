import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for dotenv path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'student_hub_db'
};

const addLastLoginColumn = async () => {
    let connection;
    try {
        console.log('Connecting to database:', dbConfig.database);
        connection = await mysql.createConnection(dbConfig);

        console.log('Checking users table columns...');
        const [columns] = await connection.query("SHOW COLUMNS FROM users LIKE 'last_login'");

        if (columns.length === 0) {
            console.log('Adding last_login column...');
            await connection.query("ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL DEFAULT NULL");
            console.log('SUCCESS: last_login column added.');
        } else {
            console.log('INFO: last_login column already exists.');
        }

    } catch (error) {
        console.error('ERROR:', error.message);
    } finally {
        if (connection) await connection.end();
        process.exit();
    }
};

addLastLoginColumn();
