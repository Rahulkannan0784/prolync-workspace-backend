import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function createDatabase() {
    console.log('Connecting to MySQL...');
    console.log('Host:', process.env.DB_HOST);
    console.log('User:', process.env.DB_USER);

    // Connect without database selected
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        const dbName = process.env.DB_NAME;
        console.log(`Creating database '${dbName}' if not exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`Database '${dbName}' created or already exists.`);

        // Also creating 'student_hub' just in case the app is stuck on that name for now, to unblock connection? 
        // No, better to stick to one. But if the app insists on 'student_hub', I might need to Create that too or find WHY.
        // Let's first ensure the one in .env exists.
    } catch (error) {
        console.error('Error creating database:', error);
    } finally {
        await connection.end();
    }
}

createDatabase();
