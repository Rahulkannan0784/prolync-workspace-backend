import db from './config/db.js';

async function updateEventsSchema() {
    try {
        console.log("Updating events table schema...");

        // Add image_source column
        try {
            await db.query("ALTER TABLE events ADD COLUMN image_source ENUM('local', 'url') DEFAULT NULL");
            console.log("Added image_source column");
        } catch (e) {
            if (!e.message.includes("Duplicate column")) console.log("Error adding image_source column:", e.message);
            else console.log("image_source column already exists");
        }

        console.log("Schema update complete.");
        process.exit(0);
    } catch (error) {
        console.error("Schema update failed:", error);
        process.exit(1);
    }
}

updateEventsSchema();
