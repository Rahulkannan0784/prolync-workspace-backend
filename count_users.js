import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const checkUsers = async () => {
    try {
        console.log(`Connecting to database: ${process.env.DB_NAME}`);
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const [rows] = await connection.query("SELECT COUNT(*) as count FROM users");
        console.log(`Total users in DB: ${rows[0].count}`);

        const [sample] = await connection.query("SELECT id, name, email, role, status FROM users LIMIT 5");
        console.log("Sample users:", sample);

        await connection.end();

    } catch (error) {
        console.error('Error:', error);
    }
};

checkUsers();
