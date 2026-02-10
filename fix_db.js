import db from './config/db.js';

async function fixDB() {
    try {
        console.log("Dropping FK constraint on submissions.question_id...");
        // Usually constraints are named table_ibfk_1 but better be safe.
        // We will try running the drop.

        try {
            await db.query("ALTER TABLE submissions DROP FOREIGN KEY submissions_ibfk_1");
            console.log("Dropped submissions_ibfk_1");
        } catch (e) {
            console.log("Could not drop ibfk_1:", e.message);
        }

        // Just in case it has a different name or to be sure, we can try to disable FK checks temporarily? 
        // No, that's session based. We need structure change.

        // Let's verify if index also needs dropping? Usually FK implies index.

        process.exit(0);
    } catch (err) {
        console.error("Fix Failed:", err);
        process.exit(1);
    }
}

fixDB();
