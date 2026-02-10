import db from '../config/db.js';

// --- Session Booking Logic ---

export const bookSession = async (req, res) => {
    try {
        const { student_name, student_email, mentor_id, mentor_name, slot_time, topic } = req.body;

        if (!student_name || !student_email || !mentor_name || !slot_time) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check for existing booking for this mentor at this time
        const checkQuery = `SELECT id FROM mentorship_sessions WHERE mentor_id = ? AND slot_time = ? AND status != 'Cancelled'`;
        const [existing] = await db.query(checkQuery, [mentor_id, slot_time]);

        if (existing.length > 0) {
            return res.status(409).json({ message: "This slot is already booked. Please choose another time." });
        }

        // Fetch Mentor's meeting URL
        const [mentorRows] = await db.query('SELECT meeting_url FROM mentors WHERE id = ?', [mentor_id]);
        const meetingLink = mentorRows.length > 0 ? mentorRows[0].meeting_url : null;

        const query = `
            INSERT INTO mentorship_sessions (student_name, student_email, mentor_id, mentor_name, slot_time, topic, status, meeting_link)
            VALUES (?, ?, ?, ?, ?, ?, 'Scheduled', ?)
        `;

        const [result] = await db.query(query, [student_name, student_email, mentor_id || 0, mentor_name, slot_time, topic || '', meetingLink]);

        // Log Activity
        try {
            // Attempt to get user ID
            let userId = req.user ? req.user.id : null;
            if (!userId) {
                const [users] = await db.query('SELECT id FROM users WHERE email = ?', [student_email]);
                if (users.length > 0) userId = users[0].id;
            }

            if (userId) {
                await db.query(
                    'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
                    [userId, 'BOOKED_MENTOR', `Booked session with ${mentor_name} on ${slot_time}`, req.ip || '0.0.0.0']
                );
            }
        } catch (logErr) { console.error("Activity logging failed", logErr); }

        res.status(201).json({ message: "Session booked successfully" });
    } catch (error) {
        console.error("Error booking session:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getAllSessions = async (req, res) => {
    try {
        const query = `
            SELECT 
                id,
                student_name,
                mentor_name,
                topic,
                slot_time,
                status,
                created_at
            FROM mentorship_sessions 
            ORDER BY created_at DESC
        `;
        const [rows] = await db.query(query);

        // Fix for "00 AM" invalid time format
        const formattedRows = rows.map(row => ({
            ...row,
            slot_time: row.slot_time ? row.slot_time.replace(' 00 AM', ' 12 AM').replace(' 00 PM', ' 12 PM') : row.slot_time
        }));

        res.status(200).json(formattedRows);
    } catch (error) {
        console.error("Error fetching mentor bookings:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getStudentBookings = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        const query = `
            SELECT ms.*, COALESCE(ms.meeting_link, m.meeting_url) as meeting_link
            FROM mentorship_sessions ms
            LEFT JOIN mentors m ON ms.mentor_id = m.id
            WHERE ms.student_email = ?
            ORDER BY ms.slot_time DESC
        `;
        const [rows] = await db.query(query, [email]);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching student bookings:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// --- Mentor Management Logic ---

export const addMentor = async (req, res) => {
    try {
        const {
            name, email, role, company, bio,
            skills, focus, session_type, availability, max_participants, meeting_url
        } = req.body;

        // Start with image_url from body (if provided as URL)
        let image_url = req.body.image_url || '';

        // If file uploaded, override image_url
        if (req.file) {
            image_url = `/uploads/mentors/${req.file.filename}`;
        }

        const is_certified = req.body.is_certified === 'true' || req.body.is_certified === true;
        const is_verified = req.body.is_verified === 'true' || req.body.is_verified === true;
        const is_top_rated = req.body.is_top_rated === 'true' || req.body.is_top_rated === true;
        const is_active = req.body.is_active === 'true' || req.body.is_active === true;

        // Ensure skills/focus/availability are strings (if passed as array from frontend, JSON.stringify them)
        // Or expect frontend to send them as strings. Let's assume frontend sends JSON strings or we stringify.
        const skillsStr = Array.isArray(skills) ? JSON.stringify(skills) : skills;
        const focusStr = Array.isArray(focus) ? JSON.stringify(focus) : focus;
        const availStr = Array.isArray(availability) ? JSON.stringify(availability) : availability;

        // Fix addMentor query not to include 'items' which is not in the table
        const query = `
            INSERT INTO mentors (
                name, email, role, company, bio, image_url, 
                skills, focus, is_certified, is_verified, is_top_rated, 
                session_type, availability, max_participants, is_active, meeting_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(query, [
            name, email, role, company, bio, image_url,
            skillsStr, focusStr, is_certified, is_verified, is_top_rated,
            session_type, availStr, max_participants, is_active, meeting_url
        ]);

        res.status(201).json({ message: "Mentor added successfully" });
    } catch (error) {
        console.error("Error adding mentor:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getAllMentors = async (req, res) => {
    try {
        const query = `SELECT * FROM mentors ORDER BY created_at DESC`;
        const [rows] = await db.query(query);

        // Parse JSON fields
        const mentors = rows.map(mentor => ({
            ...mentor,
            skills: parseJSON(mentor.skills),
            focus: parseJSON(mentor.focus),
            availability: parseJSON(mentor.availability),
            is_certified: Boolean(mentor.is_certified),
            is_verified: Boolean(mentor.is_verified),
            is_top_rated: Boolean(mentor.is_top_rated),
            is_active: Boolean(mentor.is_active)
        }));

        res.status(200).json(mentors);
    } catch (error) {
        console.error("Error fetching mentors:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateMentor = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, email, role, company, bio,
            skills, focus, session_type, availability, max_participants,
            is_certified, is_verified, is_top_rated, is_active, meeting_url
        } = req.body;

        // Correctly handle boolean values (they might come as 'true'/'false' strings from FormData)
        const cert = is_certified === 'true' || is_certified === true;
        const verif = is_verified === 'true' || is_verified === true;
        const top = is_top_rated === 'true' || is_top_rated === true;
        const active = is_active === 'true' || is_active === true;

        let updateFields = [
            name, email, role, company, bio,
            Array.isArray(skills) ? JSON.stringify(skills) : skills,
            Array.isArray(focus) ? JSON.stringify(focus) : focus,
            cert, verif, top,
            session_type,
            Array.isArray(availability) ? JSON.stringify(availability) : availability,
            max_participants, active, meeting_url
        ];

        let query = `
            UPDATE mentors SET 
            name=?, email=?, role=?, company=?, bio=?, 
            skills=?, focus=?, is_certified=?, is_verified=?, is_top_rated=?, 
            session_type=?, availability=?, max_participants=?, is_active=?, meeting_url=?
        `;

        // Handle image update if exists
        if (req.file) {
            query += `, image_url=?`;
            updateFields.push(`/uploads/mentors/${req.file.filename}`);
        }

        query += ` WHERE id=?`;
        updateFields.push(id);

        await db.query(query, updateFields);
        res.status(200).json({ message: "Mentor updated successfully" });
    } catch (error) {
        console.error("Error updating mentor:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteMentor = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(`DELETE FROM mentors WHERE id=?`, [id]);
        res.status(200).json({ message: "Mentor deleted successfully" });
    } catch (error) {
        console.error("Error deleting mentor:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Helper to safely parse JSON
function parseJSON(str) {
    try {
        // logic to handle cases where it might be a simple comma string or actual JSON
        if (!str) return [];
        if (str.startsWith('[') && str.endsWith(']')) {
            return JSON.parse(str);
        }
        return str.split(',').map(s => s.trim());
    } catch (e) {
        return str ? [str] : [];
    }
}
