import db from './config/db.js';

async function diagnose() {
    try {
        console.log("diagnose...");

        // 1. Search for "Two Sum" or "Longest Subarray"
        console.log("Searching for questions...");
        const [rows] = await db.query(`
            SELECT id, title, status, difficulty 
            FROM questions 
            WHERE title LIKE '%Two Sum%' OR title LIKE '%Longest Subarray%'
        `);
        console.log('Found Questions:', JSON.stringify(rows, null, 2));

        // 2. Check submissions for "Two Sum" (assuming it was solved)
        // We'll join with questions to see current titles
        console.log("Checking submissions...");
        const [subs] = await db.query(`
            SELECT s.question_id, q.title as current_question_title, s.status, count(*) as count
            FROM submissions s
            LEFT JOIN questions q ON s.question_id = q.id
            GROUP BY s.question_id, q.title, s.status
        `);
        console.log('Submissions Summary:', JSON.stringify(subs, null, 2));

    } catch (error) {
        console.error("ERROR:", error);
    } finally {
        process.exit(0);
    }
}

diagnose();
