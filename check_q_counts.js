import db from './config/db.js';

async function checkCounts() {
    try {
        const [total] = await db.query('SELECT COUNT(*) as c FROM questions');
        const [active] = await db.query('SELECT COUNT(*) as c FROM questions WHERE is_active = TRUE');
        const [inactive] = await db.query('SELECT COUNT(*) as c FROM questions WHERE is_active = FALSE');
        const [archived] = await db.query("SELECT COUNT(*) as c FROM questions WHERE status = 'Archived'");

        console.log("Total Rows:", total[0].c);
        console.log("Active (is_active=1):", active[0].c);
        console.log("Inactive (is_active=0):", inactive[0].c);
        console.log("Status='Archived':", archived[0].c);

        if (inactive[0].c > 0) {
            console.log("\nSome inactive items exist. Fetching IDs & Titles of first 5 inactive:");
            const [rows] = await db.query("SELECT id, title, status FROM questions WHERE is_active = FALSE LIMIT 5");
            console.log(JSON.stringify(rows, null, 2));
        }

    } catch (error) {
        console.error(error);
    } finally {
        process.exit(0);
    }
}

checkCounts();
