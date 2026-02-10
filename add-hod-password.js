
import db from './config/db.js';

const addPasswordColumn = async () => {
    try {
        const query = "ALTER TABLE hod ADD COLUMN password VARCHAR(255) ;"; // Using default password for existing records if any, or just empty if new table
        // Actually, since I likely have dummy data or just created it, I should be careful. 
        // But users said "password allso set", assuming for NEW creation primarily. 
        // If I need to support login, I need passwords. 

        await db.query(query);
        console.log("Password column added to HOD table.");
        process.exit();
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists");
            process.exit();
        }
        console.error("Error adding password column:", error);
        process.exit(1);
    }
};

addPasswordColumn();
