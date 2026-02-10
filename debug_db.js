
import db from './config/db.js';

async function migrate() {
    try {
        await db.query('ALTER TABLE project_applications ADD COLUMN admin_feedback TEXT DEFAULT NULL');
        console.log("Column added successfully");
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists");
        } else {
            console.error("Error:", err);
        }
    } finally {
        process.exit();
    }
}

migrate();
