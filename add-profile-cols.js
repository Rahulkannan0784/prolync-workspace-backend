
import db from './config/db.js';

const addProfileColumns = async () => {
    try {
        console.log('Checking and updating users table schema...');

        const columns = [
            "profile_picture VARCHAR(255) DEFAULT NULL",
            "resume_path VARCHAR(255) DEFAULT NULL",
            "phone_number VARCHAR(20) DEFAULT NULL",
            "college_name VARCHAR(255) DEFAULT NULL"
        ];

        for (const colDef of columns) {
            try {
                // Try adding the column directly
                const query = `ALTER TABLE users ADD COLUMN ${colDef}`;
                await db.query(query);
                console.log(`Added column: ${colDef.split(' ')[0]}`);
            } catch (err) {
                // Error 1060: Duplicate column name
                if (err.errno === 1060) {
                    console.log(`Column already exists: ${colDef.split(' ')[0]}`);
                } else {
                    throw err;
                }
            }
        }

        console.log('Users table updated successfully with profile columns.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating schema:', error);
        process.exit(1);
    }
};

addProfileColumns();
