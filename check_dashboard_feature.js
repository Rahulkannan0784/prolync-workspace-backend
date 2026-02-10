import db from './config/db.js';

async function checkFeatures() {
    try {
        const [rows] = await db.query("SELECT * FROM feature_flags WHERE feature_name = 'dashboard'");
        console.log("Dashboard Feature Flag:", rows);

        if (rows.length === 0) {
            console.log("Dashboard feature missing. Inserting...");
            await db.query("INSERT INTO feature_flags (feature_name, is_enabled) VALUES ('dashboard', true)");
            console.log("Inserted 'dashboard' feature (enabled).");
        } else if (!rows[0].is_enabled) {
            console.log("Dashboard feature is disabled. Enabling...");
            await db.query("UPDATE feature_flags SET is_enabled = true WHERE feature_name = 'dashboard'");
            console.log("Enabled 'dashboard' feature.");
        } else {
            console.log("Dashboard feature is already enabled.");
        }
        process.exit(0);
    } catch (error) {
        console.error("Error checking features:", error);
        process.exit(1);
    }
}

checkFeatures();
