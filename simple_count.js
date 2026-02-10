import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const checkDatabases = async () => {
    const databases = ['bavishika', 'karpagam', 'workspace', 'student_hub_db'];

    console.log("Checking user counts in databases...");

    for (const dbName of databases) {
        try {
            const conn = await mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: dbName
            });
            const [rows] = await conn.query("SELECT COUNT(*) as count FROM users");
            console.log(`${dbName}: ${rows[0].count} users`);
            await conn.end();
        } catch (e) {
            console.log(`${dbName}: Failed (${e.code || e.message})`);
        }
    }
};

checkDatabases();
