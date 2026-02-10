import db from './config/db.js';

async function checkEvents() {
    try {
        console.log("Checking 'events' table schema...");
        const [columns] = await db.query("DESCRIBE events");
        console.log("Columns:", columns.map(c => c.Field));

        console.log("\nChecking 'events' table data (limit 5)...");
        const [rows] = await db.query("SELECT id, title, type, status FROM events LIMIT 5");
        console.log("Rows:", rows);

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkEvents();
