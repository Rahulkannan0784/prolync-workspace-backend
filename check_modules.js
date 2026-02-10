
import pool from './config/db.js';

async function checkModules() {
    try {
        const [modules] = await pool.query("SELECT * FROM course_modules LIMIT 20");
        console.log("COURSE_MODULES:", JSON.stringify(modules, null, 2));

        const [courses] = await pool.query("SELECT id, title FROM courses");
        console.log("COURSES:", JSON.stringify(courses, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkModules();
