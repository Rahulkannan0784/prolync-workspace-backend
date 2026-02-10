
import db from './config/db.js';

const checkSchema = async () => {
    try {
        const [rows] = await db.query("DESCRIBE hod");
        console.log(rows);
        process.exit();
    } catch (error) {
        console.error("Error checking schema:", error);
        process.exit(1);
    }
};

checkSchema();
