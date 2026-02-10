
import db from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const enableAllFeatures = async () => {
    try {
        console.log(`Enabling all features in ${process.env.DB_NAME}...`);

        const features = [
            { key: 'courses', name: 'Courses Module' },
            { key: 'jobs', name: 'Jobs Portal' },
            { key: 'coding', name: 'Coding Platform' },
            { key: 'mentorship', name: 'Mentorship Program' },
            { key: 'projects', name: 'Project Hub' },
            { key: 'dashboard', name: 'Student Dashboard' },
            { key: 'placements', name: 'Placement Cell' },
            { key: 'admin_panel', name: 'Admin Console' },
            { key: 'events', name: 'Events' },
            { key: 'news', name: 'News Feed' }
        ];

        for (const feature of features) {
            // Upsert (Insert if new, Update if exists) -> Set is_enabled = 1
            await db.query(`
                INSERT INTO feature_flags (feature_key, feature_name, is_enabled) 
                VALUES (?, ?, 1) 
                ON DUPLICATE KEY UPDATE is_enabled = 1, feature_name = ?
            `, [feature.key, feature.name, feature.name]);
            console.log(`✔ Enabled: ${feature.name}`);
        }

        console.log("All feature flags have been enabled.");
        process.exit(0);
    } catch (error) {
        console.error("Error enabling features:", error);
        process.exit(1);
    }
};

enableAllFeatures();
