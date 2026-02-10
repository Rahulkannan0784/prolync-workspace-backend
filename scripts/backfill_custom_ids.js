import db from '../config/db.js';
import { generateUserId } from '../utils/idGenerator.js';

const backfill = async () => {
    try {
        const [users] = await db.query('SELECT id, name FROM users WHERE custom_id IS NULL');
        console.log(`Found ${users.length} users to backfill.`);

        for (const user of users) {
            console.log(`Generating ID for user ${user.id} (${user.name})...`);
            try {
                const newId = await generateUserId();
                await db.query('UPDATE users SET custom_id = ? WHERE id = ?', [newId, user.id]);
                console.log(`Updated user ${user.id} with custom_id: ${newId}`);
            } catch (err) {
                console.error(`Failed to update user ${user.id}:`, err);
            }
        }

        console.log('Backfill complete.');
        process.exit(0);
    } catch (error) {
        console.error('Backfill error:', error);
        process.exit(1);
    }
};

backfill();
