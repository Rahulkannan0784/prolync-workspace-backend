
import db from './config/db.js';

(async () => {
    try {
        const [rows] = await db.query("DESCRIBE submissions");
        console.log(rows);
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
