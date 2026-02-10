
import db from '../config/db.js';
import bcrypt from 'bcryptjs';

// Create HOD
export const createHOD = async (req, res) => {
    try {
        const { name, email, password, college, department } = req.body;

        if (!name || !email || !password || !college || !department) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check Exists in all primary tables (users, hod, admin)
        const [[userBatch], [hodBatch], [adminBatch]] = await Promise.all([
            db.query('SELECT id FROM users WHERE email = ?', [email]),
            db.query('SELECT id FROM hod WHERE email = ?', [email]),
            db.query('SELECT user_id FROM admin WHERE email = ?', [email])
        ]);

        if (userBatch.length > 0 || hodBatch.length > 0 || adminBatch.length > 0) {
            return res.status(400).json({ message: 'A user with this email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const query = 'INSERT INTO hod (name, email, password, college, department) VALUES (?, ?, ?, ?, ?)';
        await db.query(query, [name, email, hashedPassword, college, department]);

        res.status(201).json({ message: "HOD created successfully" });
    } catch (error) {
        console.error("Error creating HOD:", error);
        res.status(500).json({ message: "Server error: " + error.message });
    }
};

// Get All HODs
export const getAllHODs = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM hod ORDER BY created_at DESC');
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching HODs:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update HOD Status (Block/Unblock)
export const updateHODStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // Expect 'Active' or 'Blocked'

        if (!['Active', 'Blocked'].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const query = 'UPDATE hod SET status = ? WHERE id = ?';
        const [result] = await db.query(query, [status, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "HOD not found" });
        }

        res.status(200).json({ message: `HOD status updated to ${status}` });
    } catch (error) {
        console.error("Error updating HOD status:", error);
        res.status(500).json({ message: "Server error: " + error.message });
    }
};

// Delete HOD
export const deleteHOD = async (req, res) => {
    try {
        const { id } = req.params;

        const query = 'DELETE FROM hod WHERE id = ?';
        const [result] = await db.query(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "HOD not found" });
        }

        res.status(200).json({ message: "HOD deleted successfully" });
    } catch (error) {
        console.error("Error deleting HOD:", error);
        res.status(500).json({ message: "Server error: " + error.message });
    }
};
// Get Students for specific HOD (Admin View)
export const getHODStudents = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Get HOD details first to know their Dept/College
        const [hodRows] = await db.query('SELECT college, department FROM hod WHERE id = ?', [id]);
        if (hodRows.length === 0) {
            return res.status(404).json({ message: "HOD not found" });
        }
        const { college, department } = hodRows[0];

        // 2. Fetch Students (Dept + Assigned)
        // Same logic as hodDashboardController but for arbitrary HOD ID
        const query = `
            SELECT 
                u.id, u.name, u.email, u.department, u.college_name,
                CASE 
                    WHEN EXISTS (SELECT 1 FROM hod_student_mapping m WHERE m.hod_id = ? AND m.student_id = u.id) THEN 'Assigned'
                    ELSE 'Department'
                END as relation_type
            FROM users u
            WHERE ((u.college_name = ? AND u.department = ?) 
                OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
            AND u.role = 'Student'
            ORDER BY u.name ASC
        `;

        const [students] = await db.query(query, [id, college, department, id]);
        res.status(200).json(students);

    } catch (error) {
        console.error("Error fetching HOD students:", error);
        res.status(500).json({ message: "Server error: " + error.message });
    }
};

// Remove Student from HOD Mapping
// Remove Student from HOD Mapping
export const removeStudentFromHOD = async (req, res) => {
    try {
        const { id, studentId } = req.params;

        // 1. Try removing from manual mapping first
        const queryMapping = 'DELETE FROM hod_student_mapping WHERE hod_id = ? AND student_id = ?';
        const [resultMapping] = await db.query(queryMapping, [id, studentId]);

        if (resultMapping.affectedRows > 0) {
            return res.status(200).json({ message: "Student removed from HOD successfully" });
        }

        // 2. If not manually mapped, check if they are mapped via Department
        // Get HOD's department
        const [hodRows] = await db.query('SELECT college, department FROM hod WHERE id = ?', [id]);
        if (hodRows.length === 0) {
            return res.status(404).json({ message: "HOD not found" });
        }
        const { college, department } = hodRows[0];

        // Check student's department
        const [studentRows] = await db.query('SELECT id, department, college_name FROM users WHERE id = ?', [studentId]);
        if (studentRows.length === 0) {
            return res.status(404).json({ message: "Student not found" });
        }
        const student = studentRows[0];

        // If student belongs to this HOD's department, unmap them by clearing their department
        if (student.department === department && student.college_name === college) {
            await db.query('UPDATE users SET department = NULL WHERE id = ?', [studentId]);
            return res.status(200).json({ message: "Student unmapped from department successfully" });
        }

        return res.status(404).json({ message: "Mapping not found or student does not belong to this HOD" });

    } catch (error) {
        console.error("Error removing student from HOD:", error);
        res.status(500).json({ message: "Server error: " + error.message });
    }
};

// Get Student Performance (Moved from hodDashboardController to fix stale file issue)
export const getStudentPerformance = async (req, res) => {
    try {
        const { id } = req.hod; // HOD ID
        const college = req.hod.college;
        const department = req.hod.department;

        console.log(`HOD Student Perf Check: ID=${id}, College=${college}, Dept=${department}`);

        // List students with derived stats (Subquery method - Safest)
        const [students] = await db.query(`
            SELECT 
                u.id, 
                u.name, 
                u.email,
                u.last_login,
                (SELECT COUNT(*) FROM submissions s WHERE s.user_id = u.id) as problems_attempted,
                (SELECT COUNT(*) FROM submissions s WHERE s.user_id = u.id AND s.status = 'Accepted') as problems_solved,
                (SELECT AVG(up.completion_percent) FROM user_progress up WHERE up.user_id = u.id) as avg_course_progress
            FROM users u
            WHERE ((u.college_name = ? AND u.department = ?) 
                OR (u.id IN (SELECT student_id FROM hod_student_mapping WHERE hod_id = ?)))
            AND u.role = 'Student'
            ORDER BY u.name ASC
            LIMIT 100
        `, [college, department, id]);

        console.log(`Query executed. Found ${students.length} students.`);

        // Process data for frontend (e.g. badges/labels)
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

        res.json(processedStudents);

    } catch (error) {
        console.error("HOD Student Performance Error:", error);
        res.status(500).json({ message: "Error fetching student performance" });
    }
};
