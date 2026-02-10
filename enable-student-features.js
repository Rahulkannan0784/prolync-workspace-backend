
import db from './config/db.js';

async function enableFeatures() {
    try {
        const keysToEnable = ['courses', 'coding'];

        // 1. Check current status
        const [rows] = await db.query(`SELECT feature_key, is_enabled FROM feature_flags WHERE feature_key IN (?, ?)`, keysToEnable);
        console.log("Current Status:", rows);

        // 2. Enable them
        const [result] = await db.query(`UPDATE feature_flags SET is_enabled = 1 WHERE feature_key IN (?, ?)`, keysToEnable);
        console.log(`Updated ${result.affectedRows} rows to ENABLED.`);

        process.exit(0);
    } catch (error) {
        console.error('Update failed:', error);
        process.exit(1);
    }
}

enableFeatures();
