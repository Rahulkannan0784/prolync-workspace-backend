
import db from './config/db.js';

async function fixSchema() {
    try {
        console.log("Dropping invalid FK constraint on student_video_progress...");
        try {
            await db.query("ALTER TABLE student_video_progress DROP FOREIGN KEY student_video_progress_ibfk_2");
            console.log("Dropped student_video_progress_ibfk_2");
        } catch (e) {
            console.log("Constraint student_video_progress_ibfk_2 might not exist or verify name:", e.sqlMessage);
        }

        // Also try dropping by another common name if auto-generated differently
        try {
            await db.query("ALTER TABLE student_video_progress DROP FOREIGN KEY student_video_progress_lessons_id_fk");
            console.log("Dropped student_video_progress_lessons_id_fk");
        } catch (e) { }

        console.log("Schema Fix Complete.");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

fixSchema();
