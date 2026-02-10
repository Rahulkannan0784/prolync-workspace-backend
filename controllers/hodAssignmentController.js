
import db from '../config/db.js';

// Bulk assign students to HOD
export const assignStudentsToHod = async (req, res) => {
    try {
        const { hodId, studentIds, adminId } = req.body;

        if (!hodId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ message: "HOD ID and a list of Student IDs are required" });
        }

        // Prepare values for bulk insert
        const values = studentIds.map(studentId => [hodId, studentId, adminId || null]);

        // Insert Ignore to skip duplicates
        const query = `
            INSERT IGNORE INTO hod_student_mapping (hod_id, student_id, assigned_by) 
            VALUES ?
        `;

        const [result] = await db.query(query, [values]);

        res.status(200).json({
            message: `Successfully processed assignments.`,
            affectedRows: result.affectedRows
        });

    } catch (error) {
        console.error("Error assigning students:", error);
        res.status(500).json({ message: "Server error during assignment" });
    }
};

// Get students manually assigned to HOD
export const getAssignedStudents = async (req, res) => {
    try {
        // HOD ID comes from the middleware (req.hod.id)
        const hodId = req.hod.id;

        const query = `
            SELECT u.id, u.custom_id, u.name, u.email, u.phone_number, 
                   u.gender, u.created_at, u.last_login, u.status, u.profile_picture
            FROM hod_student_mapping m
            JOIN users u ON m.student_id = u.id
            WHERE m.hod_id = ?
        `;

        const [students] = await db.query(query, [hodId]);

        res.status(200).json(students);

    } catch (error) {
        console.error("Error fetching assigned students:", error);
        res.status(500).json({ message: "Server error fetching assigned students" });
    }
};
