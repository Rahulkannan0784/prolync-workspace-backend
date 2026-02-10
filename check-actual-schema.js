import db from './config/db.js';

import fs from 'fs';

async function checkSchema() {
    let output = "";
    try {
        output += "--- certificates table ---\n";
        const [certCols] = await db.query("DESCRIBE certificates");
        output += JSON.stringify(certCols, null, 2) + "\n";

        output += "\n--- project_applications table ---\n";
        const [projCols] = await db.query("DESCRIBE project_applications");
        output += JSON.stringify(projCols, null, 2) + "\n";

        output += "\n--- enrollments table ---\n";
        const [enrollCols] = await db.query("DESCRIBE enrollments");
        output += JSON.stringify(enrollCols, null, 2) + "\n";

        output += "\n--- user_progress table ---\n";
        const [progCols] = await db.query("DESCRIBE user_progress");
        output += JSON.stringify(progCols, null, 2) + "\n";

        output += "\n--- student_video_progress table ---\n";
        try {
            const [videoCols] = await db.query("DESCRIBE student_video_progress");
            output += JSON.stringify(videoCols, null, 2) + "\n";
        } catch (e) {
            output += "student_video_progress table not found: " + e.message + "\n";
        }

        fs.writeFileSync('schema_results.log', output);
        console.log("Results written to schema_results.log");
    } catch (err) {
        fs.appendFileSync('schema_results.log', "\nError: " + err.message);
        console.error(err);
    } finally {
        process.exit();
    }
}

checkSchema();
