import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const backfillValidity = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log(`Connected to ${process.env.DB_NAME}. Updating existing users...`);

        // Set valid_until = created_at + 30 days for users where keys are missing
        const [result] = await connection.query(`
            UPDATE users 
            SET valid_until = DATE_ADD(created_at, INTERVAL 30 DAY) 
            WHERE valid_until IS NULL
        `);

        console.log(`Updated ${result.affectedRows} users.`);
        await connection.end();
    } catch (e) {
        console.error(e);
    }
};

backfillValidity();
