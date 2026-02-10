
import db from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const fixCategories = async () => {
    try {
        console.log("Fixing categories...");

        // 1. Set Scenarios (IDs 101-199)
        await db.query(`UPDATE questions SET category = 'Scenario' WHERE id BETWEEN 101 AND 199`);
        console.log("Updated Scenarios (101-199)");

        // 2. Set DSA (IDs >= 200)
        await db.query(`UPDATE questions SET category = 'DSA' WHERE id >= 200`);
        console.log("Updated DSA (200+)");

        console.log("Done.");
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

fixCategories();
