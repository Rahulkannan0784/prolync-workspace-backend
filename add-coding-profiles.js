
import db from './config/db.js';

const addCodingColumns = async () => {
    try {
        console.log('--- Database Migration: Adding Coding Profile Columns ---');

        const columns = [
            "leetcode VARCHAR(255) DEFAULT NULL",
            "hackerrank VARCHAR(255) DEFAULT NULL",
            "codechef VARCHAR(255) DEFAULT NULL"
        ];

        for (const colDef of columns) {
            const colName = colDef.split(' ')[0];
            try {
                // Construct the query
                const query = `ALTER TABLE users ADD COLUMN ${colDef}`;

                // User requested strict query logging
                console.log(`Executing Query: ${query}`);

                await db.query(query);
                console.log(`Successfully added column: ${colName}`);
            } catch (err) {
                // Error 1060: Duplicate column name
                if (err.errno === 1060) {
                    console.log(`Column already exists: ${colName}`);
                } else {
                    console.error(`Error adding column ${colName}:`, err.message);
                    throw err;
                }
            }
        }

        console.log('--- Migration Completed Successfully ---');
        process.exit(0);
    } catch (error) {
        console.error('Migration Failed:', error);
        process.exit(1);
    }
};

addCodingColumns();
