
import db from './config/db.js';

async function check() {
    try {
        const [hods] = await db.query('SELECT * FROM hod LIMIT 1');
        const hod = hods[0];
        console.log("HOD:", hod.college, hod.department);

        const query = `
            SELECT 
                u.id, 
                u.name, 
                u.email,
                u.last_login,
                (SELECT COUNT(*) FROM submissions s WHERE s.user_id = u.id) as problems_attempted,
                (SELECT COUNT(*) FROM submissions s WHERE s.user_id = u.id AND s.status = 'Accepted') as problems_solved,
                AVG(COALESCE(up.completion_percent, 0)) as avg_course_progress
            FROM users u
            LEFT JOIN user_progress up ON u.id = up.user_id
            WHERE ((u.college_name = ? AND u.department = ?) 
                OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
            AND u.role = 'STUDENT'
            GROUP BY u.id
            ORDER BY u.name ASC
            LIMIT 100
        `;

        const [students] = await db.query(query, [hod.college, hod.department, hod.id]);

        // BACKEND CONTROLLER LOGIC
        const processedStudents = students.map(s => {
            const progress = Number(s.avg_course_progress || 0);
            let label = 'Needs Attention';
            if (progress > 75) label = 'Excellent';
            else if (progress > 40) label = 'Average';

            return {
                ...s,
                avg_course_progress: Math.round(progress),
                performance_label: label
            };
        });

        console.log("\n--- FRONTEND SIMULATION ---");
        console.log("Students Received:", processedStudents.length);
        if (processedStudents.length > 0) console.log("First Student:", processedStudents[0]);

        // FRONTEND LOGIC (from HODDashboard.tsx)
        const performance = processedStudents;
        const performanceDist = [
            { name: 'Excellent', value: performance.filter(s => s.performance_label === 'Excellent').length },
            { name: 'Average', value: performance.filter(s => s.performance_label === 'Average').length },
            { name: 'Needs Attention', value: performance.filter(s => s.performance_label === 'Needs Attention').length }
        ];

        console.log("\nChart Data:", performanceDist);
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
