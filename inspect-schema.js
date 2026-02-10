
import db from './config/db.js';

const inspect = async () => {
    try {
        const [users] = await db.query('DESCRIBE users');
        console.log('USERS:', users.map(r => r.Field));

        const [activity] = await db.query('DESCRIBE activity_logs');
        console.log('ACTIVITY:', activity.map(r => r.Field));

        const [submissions] = await db.query('DESCRIBE submissions');
        console.log('SUBMISSIONS:', submissions.map(r => r.Field));

        try {
            const [courses] = await db.query('DESCRIBE courses');
            console.log('COURSES:', courses.map(r => r.Field));
        } catch (e) { console.log("No courses table"); }

        try {
            const [progress] = await db.query('DESCRIBE user_course_progress'); // Guessing name
            console.log('PROGRESS:', progress.map(r => r.Field));
        } catch (e) {
            try {
                const [progress2] = await db.query('DESCRIBE course_progress');
                console.log('PROGRESS2:', progress2.map(r => r.Field));
            } catch (e) { console.log("No progress table found"); }
        }

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
inspect();
