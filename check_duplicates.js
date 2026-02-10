import db from './config/db.js';

async function diagnose() {
    try {
        console.log("diagnose...");

        // Check IDs 1 and 316 and any "Longest" titles
        const [rows] = await db.query(`
            SELECT id, title, status FROM questions 
            WHERE id IN (1, 316) OR title LIKE '%Longest%'
        `);
        console.log('RESULTS:', JSON.stringify(rows, null, 2));

    } catch (error) {
        console.error("ERROR:", error);
    } finally {
        process.exit(0);
    }
}

diagnose();
