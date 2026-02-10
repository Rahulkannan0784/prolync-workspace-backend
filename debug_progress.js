
import pool from './config/db.js';

async function checkSchema() {
    try {
        console.log("Checking tables...");
        const [tables] = await pool.query("SHOW TABLES");
        console.log("Tables:", tables.map(t => Object.values(t)[0]));

        const tablesToDescribe = ['enrollments', 'user_progress', 'student_video_progress'];
        for (const table of tablesToDescribe) {
            console.log(`\n--- ${table} ---`);
            const [desc] = await pool.query(`DESCRIBE ${table}`);
            console.log("Columns:", desc.map(d => `${d.Field} (${d.Type})`));

            const [data] = await pool.query(`SELECT * FROM ${table} LIMIT 5`);
            console.log(`Data:`, JSON.stringify(data, null, 2));
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkSchema();
