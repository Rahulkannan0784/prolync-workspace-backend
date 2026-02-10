
import db from './config/db.js';

async function cleanup() {
    try {
        const keysToDelete = [
            'coding_platform',
            'jobs_internships',
            'mentors',
            'news_updates'
        ];

        console.log(`Deleting unused keys: ${keysToDelete.join(', ')}`);

        // Using string interpolation for array values safely (or parameterized if possible but IN clause is tricky)
        // Safe enough for this internal script with hardcoded values
        const placeholders = keysToDelete.map(() => '?').join(',');
        const query = `DELETE FROM feature_flags WHERE feature_key IN (${placeholders})`;

        const [result] = await db.query(query, keysToDelete);
        console.log(`Deleted ${result.affectedRows} rows.`);
        process.exit(0);
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
}

cleanup();
