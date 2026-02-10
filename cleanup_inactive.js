import db from './config/db.js';

async function hardDeleteInactive() {
    try {
        console.log("Deleting inactive questions...");
        const [res] = await db.query('DELETE FROM questions WHERE is_active = FALSE');
        console.log(`Deleted ${res.affectedRows} inactive questions.`);
    } catch (error) {
        console.error(error);
    } finally {
        process.exit(0);
    }
}

hardDeleteInactive();
