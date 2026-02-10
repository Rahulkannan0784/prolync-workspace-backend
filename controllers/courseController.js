import db from '../config/db.js'; // Use shared pool
import fs from 'fs';
import path from 'path';

// Alias db to pool to minimize code changes
const pool = db;

// Get all courses
export const getAllCourses = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.*, 
            (SELECT COUNT(*) FROM course_modules cm WHERE cm.course_id = c.id) as total_modules,
            (SELECT COALESCE(SUM(duration_seconds), 0) FROM course_modules cm WHERE cm.course_id = c.id) as total_duration,
            (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as enrolled,
            (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND completed = 1) as completed,
            (SELECT COALESCE(AVG(rating), 0) FROM course_ratings WHERE course_id = c.id) as rating
            FROM courses c 
            ORDER BY c.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get course by ID or Title
export const getCourseById = async (req, res) => {
    try {
        const idOrTitle = req.params.id;
        const isNumeric = /^\d+$/.test(idOrTitle);

        let rows;
        if (isNumeric) {
            [rows] = await pool.query('SELECT * FROM courses WHERE id = ?', [idOrTitle]);
        } else {
            const title = decodeURIComponent(idOrTitle);
            [rows] = await pool.query('SELECT * FROM courses WHERE title = ?', [title]);
        }

        if (rows.length === 0) return res.status(404).json({ message: 'Course not found' });

        const course = rows[0];
        const courseId = course.id; // Use the real ID for subsequent queries

        // 1. Dynamic Learners Count
        const [enrollRows] = await pool.query('SELECT COUNT(*) as count FROM enrollments WHERE course_id = ?', [courseId]);
        course.students = enrollRows[0].count;

        // 2. Dynamic Rating
        const [ratingRows] = await pool.query('SELECT AVG(rating) as avg_rating FROM course_ratings WHERE course_id = ?', [courseId]);
        course.rating = ratingRows[0].avg_rating !== null ? Number(ratingRows[0].avg_rating) : 0;

        // 3. Dynamic Duration
        const [durRows] = await pool.query('SELECT SUM(duration_seconds) as total FROM course_modules WHERE course_id = ?', [courseId]);
        course.total_duration = durRows[0].total || 0;

        res.json(course);
    } catch (error) {
        console.error("Error fetching course:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Create a new course
export const createCourse = async (req, res) => {
    const { title, description, instructor, category, level, price, status } = req.body;

    // Handle image upload
    const thumbnail = req.file ? `/uploads/courses/${req.file.filename}` : null;

    try {
        const [result] = await pool.query(
            'INSERT INTO courses (title, description, instructor, category, level, price, status, thumbnail) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description, instructor, category, level, price || 0, status || 'Draft', thumbnail]
        );
        res.status(201).json({ id: result.insertId, ...req.body, thumbnail });
    } catch (error) {
        console.error("Error creating course:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Update a course
export const updateCourse = async (req, res) => {
    const { title, description, instructor, category, level, price, status } = req.body;
    let thumbnailUpdate = "";
    let queryParams = [title, description, instructor, category, level, price, status];

    // If new image uploaded, include it in update
    if (req.file) {
        thumbnailUpdate = ", thumbnail = ?";
        queryParams.push(`/uploads/courses/${req.file.filename}`);

        // OPTIONAL: Delete old image here if needed, but requires fetching old path first
    }

    queryParams.push(req.params.id);

    try {
        await pool.query(
            `UPDATE courses SET title = ?, description = ?, instructor = ?, category = ?, level = ?, price = ?, status = ? ${thumbnailUpdate} WHERE id = ?`,
            queryParams
        );
        res.json({ message: 'Course updated successfully' });
    } catch (error) {
        console.error("Error updating course:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Delete a course
export const deleteCourse = async (req, res) => {
    try {
        // Simple delete without image cleanup for now to avoid complexity, or fetch first
        // Ideally: Fetch -> unlink -> delete
        const [rows] = await pool.query('SELECT thumbnail FROM courses WHERE id = ?', [req.params.id]);
        if (rows.length > 0 && rows[0].thumbnail) {
            const imagePath = path.join(process.cwd(), rows[0].thumbnail);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await pool.query('DELETE FROM courses WHERE id = ?', [req.params.id]);
        res.json({ message: 'Course deleted' });
    } catch (error) {
        console.error("Error deleting course:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get Course Analytics (Mock or Basic)
// Get Detailed Course Analytics
export const getCourseAnalytics = async (req, res) => {
    try {
        const courseId = req.params.id;
        const { period, status } = req.query; // period: 7d, 30d, 1y; status: Active, Completed

        // Date Filter Logic
        let dateCondition = "";
        if (period === '7d') {
            dateCondition = "AND enrolled_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        } else if (period === '30d') {
            dateCondition = "AND enrolled_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        } else if (period === '1y') {
            dateCondition = "AND enrolled_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
        }

        // Status Filter Logic
        let statusCondition = "";
        let statusParams = [];
        if (status && status !== 'All') {
            if (status === 'Completed') statusCondition = "AND completed = 1";
            else if (status === 'Active') statusCondition = "AND completed = 0 AND progress > 0";
            else if (status === 'Not Started') statusCondition = "AND progress = 0";
        }

        // 1. KPIs
        const [kpiRows] = await pool.query(`
            SELECT 
                COUNT(*) as total_enrollments,
                SUM(CASE WHEN completed = 0 AND progress > 0 THEN 1 ELSE 0 END) as active_learners,
                SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_learners,
                AVG(progress) as completion_rate,
                AVG(CASE WHEN completed = 1 AND completed_at IS NOT NULL THEN TIMESTAMPDIFF(HOUR, enrolled_at, completed_at) ELSE NULL END) as avg_hours_to_complete
            FROM enrollments 
            WHERE course_id = ? ${dateCondition} ${statusCondition}
        `, [courseId]);

        const kpis = kpiRows[0];

        // 2. Rankings (Calculated globally, ignoring date filter for accurate "All Time" rank context)
        // Rank by Enrollments
        const [enrollmentRank] = await pool.query(`
            SELECT COUNT(*) + 1 as rank_val FROM (
                SELECT course_id, COUNT(*) as cnt FROM enrollments GROUP BY course_id HAVING cnt > (SELECT COUNT(*) FROM enrollments WHERE course_id = ?)
            ) as r
        `, [courseId]);

        // Rank by Completions
        const [completionRank] = await pool.query(`
             SELECT COUNT(*) + 1 as rank_val FROM (
                SELECT course_id, COUNT(*) as cnt FROM enrollments WHERE completed=1 GROUP BY course_id HAVING cnt > (SELECT COUNT(*) FROM enrollments WHERE course_id = ? AND completed=1)
            ) as r
        `, [courseId]);

        // 3. Platform Averages
        const [platformAvg] = await pool.query(`
            SELECT 
                AVG(st_count) as avg_enrollments,
                AVG(avg_prog) as avg_completion_rate
            FROM (
                SELECT COUNT(*) as st_count, AVG(progress) as avg_prog FROM enrollments GROUP BY course_id
            ) as stats
        `);

        // 4. Charts - Enrollments Over Time
        const [growthRows] = await pool.query(`
            SELECT DATE_FORMAT(enrolled_at, '%Y-%m-%d') as date, COUNT(*) as value
            FROM enrollments 
            WHERE course_id = ? ${dateCondition}
            GROUP BY DATE_FORMAT(enrolled_at, '%Y-%m-%d')
            ORDER BY date ASC
        `, [courseId]);

        // 5. Chart - Completion Distribution
        const [distRows] = await pool.query(`
             SELECT 
                CASE 
                    WHEN progress = 100 THEN 'Completed'
                    WHEN progress >= 50 THEN 'Advanced'
                    WHEN progress > 0 THEN 'Intermediate'
                    ELSE 'Beginner'
                END as name,
                COUNT(*) as value
            FROM enrollments
            WHERE course_id = ? ${dateCondition}
            GROUP BY name
        `, [courseId]);

        res.json({
            kpis: {
                total_enrollments: kpis.total_enrollments || 0,
                active_learners: kpis.active_learners || 0,
                completed_learners: kpis.completed_learners || 0,
                completion_rate: Math.round(kpis.completion_rate || 0),
                avg_hours_to_complete: Math.round(kpis.avg_hours_to_complete || 0)
            },
            rankings: {
                enrollment_rank: enrollmentRank[0].rank_val,
                completion_rank: completionRank[0].rank_val
            },
            platform_averages: {
                avg_enrollments: Math.round(platformAvg[0].avg_enrollments || 0),
                avg_completion: Math.round(platformAvg[0].avg_completion_rate || 0)
            },
            charts: {
                growth: growthRows.length > 0
                    ? growthRows.map(r => ({ date: r.date, value: r.value }))
                    : [{ date: new Date().toISOString().split('T')[0], value: 0 }],
                distribution: distRows.length > 0
                    ? distRows
                    : [{ name: 'No Data', value: 0 }]
            },
            // Maintain top-level fields for backward compatibility if any component uses them
            total_students: kpis.total_enrollments || 0,
            active_learners: kpis.active_learners || 0,
            completed_learners: kpis.completed_learners || 0,
            average_progress: Math.round(kpis.completion_rate || 0),
            avg_time: Math.round(kpis.avg_hours_to_complete || 0)
        });

    } catch (error) {
        console.error("Error fetching detailed analytics:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get Course Curriculum (Modules + Lessons)
export const getCourseCurriculum = async (req, res) => {
    try {
        const courseId = req.params.id;
        // Corrected column name to 'order_index' matching moduleController
        const [modules] = await pool.query('SELECT * FROM course_modules WHERE course_id = ? ORDER BY order_index ASC', [courseId]);

        // Adapt flat modules to nested structure expected by frontend (Module -> Lessons)
        // Since the current uploader creates "Modules" that are actually video units
        for (let module of modules) {
            // Check if we have separate lessons (legacy structure support)
            // But primarily, if we have a video_path on the module, treat it as having 1 lesson
            if (module.video_path) {
                module.lessons = [{
                    id: module.id,
                    title: module.title,
                    duration: module.duration_seconds ? Math.round(module.duration_seconds / 60) : 0, // Frontend expects mins maybe? Or just display duration
                    video_path: module.video_path,
                    type: 'video'
                }];
            } else {
                // Try fetching explicit lessons if they exist (backward compatibility)
                try {
                    const [lessons] = await pool.query('SELECT * FROM course_lessons WHERE module_id = ? ORDER BY `order` ASC', [module.id]);
                    module.lessons = lessons;
                } catch (e) {
                    module.lessons = [];
                }
            }
        }

        res.json(modules);
    } catch (error) {
        console.error("Error fetching curriculum:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get Students Enrolled in a Course
export const getCourseStudents = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT u.id, u.name, u.email, e.enrolled_at, e.progress, e.completed 
            FROM enrollments e 
            JOIN users u ON e.user_id = u.id 
            WHERE e.course_id = ?
        `, [req.params.id]);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Enroll User
export const enrollUser = async (req, res) => {
    let { userId, courseId } = req.body || {};
    if (!courseId) courseId = req.params.id; // Support URL param extraction
    const finalUserId = userId || req.user?.id;

    try { fs.appendFileSync(path.join(process.cwd(), 'debug.log'), `[ENROLL HIT] User: ${finalUserId}, Course: ${courseId}\n`); } catch (e) { }

    console.log(`[ENROLL] Request for User: ${finalUserId}, Course: ${courseId}`);

    if (!finalUserId) return res.status(400).json({ message: 'User ID required' });
    if (!courseId) return res.status(400).json({ message: 'Course ID required' });

    try {
        // Check if already enrolled
        const [existing] = await pool.query('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?', [finalUserId, courseId]);
        if (existing.length > 0) return res.status(400).json({ message: 'Already enrolled' });

        // 1. Insert into Enrollments (Explicit columns to avoid default value issues)
        try {
            await pool.query(
                'INSERT INTO enrollments (user_id, course_id, progress, completed, enrolled_at) VALUES (?, ?, ?, ?, NOW())',
                [finalUserId, courseId, 0, 0] // 0 (false) for completed
            );
        } catch (err) {
            console.error("Error inserting into enrollments:", err.sqlMessage || err);
            throw err;
        }

        // 2. Initialize User Progress (Explicit columns)
        try {
            await pool.query(`
                INSERT INTO user_progress (user_id, course_id, status, completion_percent, total_modules, completed_modules, last_accessed_at)
                VALUES (?, ?, 'Not Started', 0, 0, 0, NOW())
                ON DUPLICATE KEY UPDATE status = status
            `, [finalUserId, courseId]);
        } catch (err) {
            console.error("Error initializing user_progress:", err.sqlMessage || err);
            // Allow this to fail without blocking, but log it
        }

        // ... existing enroll logic ...
        console.log("[ENROLL] Success");

        // Log Activity
        try {
            await pool.query(
                'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
                [finalUserId, 'ENROLLED_COURSE', `Enrolled in course ID: ${courseId}`, req.ip || '0.0.0.0']
            );
        } catch (e) {
            console.error("Enrollment logging failed:", e);
        }

        res.status(201).json({ message: 'Enrolled successfully' });
    } catch (error) {
        // ... existing error handler ...
        const errorLog = `
[${new Date().toISOString()}] ENROLL ERROR
User: ${finalUserId}, Course: ${courseId}
Message: ${error.message}
SQL: ${error.sqlMessage}
Stack: ${error.stack}
------------------------------------------------
`;
        fs.appendFileSync(path.join(process.cwd(), 'backend-error.log'), errorLog);

        console.error("Error enrolling user (Full):", error);
        res.status(500).json({ message: 'Server Error: ' + (error.sqlMessage || error.message) });
    }
};

// Update Course Progress
export const updateCourseProgress = async (req, res) => {
    const { progress, completed, courseId: bodyCourseId, completedModules, totalModules } = req.body;
    const userId = req.user.id;
    // Fallback to body courseId if params.id is missing (for /progress/update route)
    const courseId = req.params.id || bodyCourseId;

    if (!courseId) {
        return res.status(400).json({ message: 'Course ID is required' });
    }

    try {
        if (completed || progress === 100) {
            // Auto-generate certificate
            try {
                const certId = `CERT-${Date.now()}-${userId}-${courseId}`;
                await pool.query(`
                    INSERT INTO certificates (user_id, course_id, certificate_code, issued_at)
                    SELECT ?, ?, ?, NOW()
                    WHERE NOT EXISTS (SELECT 1 FROM certificates WHERE user_id = ? AND course_id = ?)
                `, [userId, courseId, certId, userId, courseId]);

                // Log Certificate Activity
                await pool.query(
                    'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
                    [userId, 'EARNED_CERTIFICATE', `Earned certificate for course ${courseId}`, req.ip || '0.0.0.0']
                );

            } catch (err) {
                console.error("Auto-certificate generation failed:", err);
            }
        }

        await pool.query(
            'UPDATE enrollments SET progress = ?, completed = ?, completed_at = ? WHERE user_id = ? AND course_id = ?',
            [progress, completed, completed ? new Date() : null, userId, courseId]
        );

        // Sync user_progress as well
        const [existingProgress] = await pool.query('SELECT total_modules FROM user_progress WHERE user_id = ? AND course_id = ?', [userId, courseId]);
        const finalTotalModules = totalModules || (existingProgress[0]?.total_modules) || 10;
        const finalCompletedModules = completedModules !== undefined ? completedModules : Math.round((progress / 100) * finalTotalModules);

        await pool.query(
            "UPDATE user_progress SET status = ?, completion_percent = ?, completed_modules = ?, total_modules = ? WHERE user_id = ? AND course_id = ?",
            [completed ? 'Completed' : 'In Progress', progress, finalCompletedModules, finalTotalModules, userId, courseId]
        );

        // Log Learning Activity
        try {
            await pool.query(
                'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
                [userId, completed ? 'COMPLETED_COURSE' : 'LEARNING_PROGRESS', `Progress updated to ${progress}% for course ${courseId}`, req.ip || '0.0.0.0']
            );
        } catch (e) { console.error("Progress logging failed:", e); }

        res.json({ message: 'Progress updated' });
    } catch (error) {
        console.error("Error updating progress:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get Student Enrollments
export const getStudentEnrollments = async (req, res) => {
    const userId = req.user.id;
    try {
        const [rows] = await pool.query(`
            SELECT c.*, e.progress, e.completed, e.enrolled_at,
            (SELECT COUNT(*) FROM course_modules cm WHERE cm.course_id = c.id) as total_modules,
            (SELECT COALESCE(SUM(duration_seconds), 0) FROM course_modules cm WHERE cm.course_id = c.id) as total_duration,
            (SELECT COUNT(*) FROM enrollments en WHERE en.course_id = c.id) as total_students
            FROM enrollments e 
            JOIN courses c ON e.course_id = c.id 
            WHERE e.user_id = ?
        `, [userId]);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching enrollments:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Log Progress (Alternative to update)
export const logProgress = async (req, res) => {
    // Implement similar to updateCourseProgress or logic for specific lesson completion
    return updateCourseProgress(req, res);
};
