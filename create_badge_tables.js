import db from './config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createBadgeTables = async () => {
    try {
        const sqlPath = path.join(__dirname, 'migrations', 'create_badge_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon to handle multiple statements
        const statements = sql.split(';').filter(stmt => stmt.trim());

        console.log('Creating badge tables...');

        for (const statement of statements) {
            if (statement.trim()) {
                await db.query(statement);
            }
        }

        console.log('Badge tables created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating badge tables:', error);
        process.exit(1);
    }
};

createBadgeTables();
