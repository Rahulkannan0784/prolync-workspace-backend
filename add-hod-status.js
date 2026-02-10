
import db from './config/db.js';

const addStatusColumn = async () => {
    try {
        // ENUM 'Active', 'Blocked' with default 'Active'
        const query = "ALTER TABLE hod ADD COLUMN status ENUM('Active', 'Blocked') DEFAULT 'Active';";

        await db.query(query);
        console.log("Status column added to HOD table.");
        process.exit();
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists");
            process.exit();
        }
        console.error("Error adding status column:", error);
        process.exit(1);
    }
};

addStatusColumn();
