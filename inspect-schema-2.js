
import db from './config/db.js';

const inspect = async () => {
    try {
        try {
            const [enrollments] = await db.query('DESCRIBE enrollments');
            console.log('ENROLLMENTS:', enrollments.map(r => r.Field));
        } catch (e) { console.log("No enrollments table"); }

        try {
            const [user_progress] = await db.query('DESCRIBE user_progress');
            console.log('USER_PROGRESS:', user_progress.map(r => r.Field));
        } catch (e) { console.log("No user_progress table"); }

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
inspect();
