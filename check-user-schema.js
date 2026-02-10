import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const checkSchema = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const [rows] = await connection.query('DESCRIBE users');
        console.log('Users Table Schema:', rows);
        await connection.end();
    } catch (error) {
        console.error('Error checking schema:', error);
    }
};

checkSchema();
