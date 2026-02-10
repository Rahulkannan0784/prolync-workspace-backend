import db from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const seedFeatureFlags = async () => {
    const features = [
        { key: 'dashboard', name: 'Dashboard', enabled: true },
        { key: 'courses', name: 'Courses', enabled: false },
        { key: 'coding', name: 'Coding Platform', enabled: false },
        { key: 'jobs', name: 'Jobs & Internships', enabled: false },
        { key: 'mentorship', name: 'Mentorship', enabled: false },
        { key: 'news', name: 'News & Updates', enabled: false },
        { key: 'projects', name: 'Projects', enabled: false },
        { key: 'events', name: 'Events', enabled: false },
        { key: 'placements', name: 'Placements', enabled: false },
    ];

    try {
        console.log('Seeding feature flags...');

        for (const feature of features) {
            // Check if exists
            const [rows] = await db.query('SELECT * FROM feature_flags WHERE feature_key = ?', [feature.key]);

            if (rows.length === 0) {
                await db.query('INSERT INTO feature_flags (feature_key, feature_name, is_enabled) VALUES (?, ?, ?)', [feature.key, feature.name, feature.enabled]);
                console.log(`Included: ${feature.name}`);
            } else {
                console.log(`Skipped (Exists): ${feature.name}`);
            }
        }

        console.log('Feature flags seeded successfully.');
        process.exit();
    } catch (error) {
        console.error('Error seeding feature flags:', error);
        process.exit(1);
    }
};

seedFeatureFlags();
