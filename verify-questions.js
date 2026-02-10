
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'https://workspace.prolync.in';

const verify = async () => {
    try {
        console.log("Fetching questions from API...");
        // Mock token if needed, or rely on public access if enabled.
        // The route likely requires Auth. I'll login first or mock req.user
        // But for this test, I'll assume I can't easily login. I'll inspect DB directly.
        // Actually, let's just use the DB directly to count.
    } catch (e) { }
};
// Correction: I can use the existing `migrate-coding-db.js` logic or just a simple DB query script.

import db from './config/db.js';

const checkDB = async () => {
    try {
        const [rows] = await db.query('SELECT COUNT(*) as count FROM questions');
        console.log(`Total questions in DB: ${rows[0].count}`);

        const [ids] = await db.query('SELECT id, title FROM questions ORDER BY id');
        console.log("IDs found:", ids.map(q => q.id).join(', '));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkDB();
