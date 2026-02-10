import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const showDatabases = async () => {
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });
        const [dbs] = await conn.query("SHOW DATABASES");
        const dbNames = dbs.map(r => r.Database);

        console.log("Databases found:", dbNames.join(', '));

        for (const dbName of dbNames) {
            if (['information_schema', 'performance_schema', 'mysql', 'sys'].includes(dbName)) continue;

            try {
                const [rows] = await conn.query(`SELECT COUNT(*) as count FROM ${dbName}.users`);
                console.log(`[${dbName}] Users: ${rows[0].count}`);
            } catch (e) {
                console.log(`[${dbName}] Users: Error (${e.code}) - Likely no 'users' table`);
            }
        }
        await conn.end();
    } catch (e) {
        console.error(e);
    }
};
showDatabases();
