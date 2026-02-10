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

        console.log("--- COURSES Table Schema ---");
        const [rows] = await connection.query("DESCRIBE courses");
        console.table(rows);

        console.log("--- COURSES Data Count ---");
        const [count] = await connection.query("SELECT COUNT(*) as count FROM courses");
        console.log("Total Courses:", count[0].count);

        await connection.end();
    } catch (error) {
        console.error("Error checking schema:", error);
    }
};

checkSchema();
