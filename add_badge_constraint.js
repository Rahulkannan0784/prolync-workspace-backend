import db from './config/db.js';

async function addConstraint() {
    try {
        console.log("Adding unique constraint to user_badges...");
        await db.query('ALTER TABLE user_badges ADD UNIQUE KEY unique_user_badge (user_id, badge_name)');
        console.log("Unique constraint added successfully.");
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_KEYNAME') {
            console.log("Unique constraint already exists.");
            process.exit(0);
        }
        console.error("Failed to add constraint:", err.message);
        process.exit(1);
    }
}

addConstraint();
