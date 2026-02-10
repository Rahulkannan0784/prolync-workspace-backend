
import db from './config/db.js';

async function checkSchema() {
    try {
        console.log("Checking tables...");
        const [tables] = await db.query("SHOW TABLES");
        const tableNames = tables.map(t => Object.values(t)[0]);
        console.log("Tables:", tableNames);

        if (tableNames.includes('course_ratings')) {
            console.log("course_ratings table exists.");
        } else {
            console.log("course_ratings table MISSING.");
        }

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkSchema();
