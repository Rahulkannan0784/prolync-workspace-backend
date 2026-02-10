
import db from './config/db.js';

async function checkQuestions() {
    try {
        const [rows] = await db.query('SELECT id, title FROM questions ORDER BY id DESC LIMIT 5');
        console.log("Latest questions:");
        console.table(rows);
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkQuestions();
