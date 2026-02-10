import pool from '../config/db.js';

// Add Feedback
export const addFeedback = async (req, res) => {
    // Frontend sends: user_id, user_name, rating, category, ratings_*, comments
    const {
        user_id,
        user_name,
        rating,
        category,
        rating_course,
        rating_ui,
        rating_ux,
        rating_coding,
        rating_general,
        comments
    } = req.body;

    // Fallback for older payload style
    let { name, email, type, message } = req.body;

    try {
        // 1. Resolve Name and Email
        const finalName = user_name || name || 'Anonymous';
        const finalType = category || type || 'General';
        const finalMessage = comments || message || '';

        // If email is missing but we have user_id, fetch it
        let finalEmail = email;
        if (!finalEmail && user_id) {
            try {
                const [userRows] = await pool.query("SELECT email FROM users WHERE id = ?", [user_id]);
                if (userRows.length > 0) finalEmail = userRows[0].email;
            } catch (err) { /* ignore */ }
        }
        if (!finalEmail) finalEmail = 'anonymous@prolync.in'; // Default to avoid NOT NULL error

        // 2. Insert
        const [result] = await pool.query(
            `INSERT INTO feedback (
                user_id, user_name, email, category, message, rating, 
                rating_course, rating_ui, rating_ux, rating_coding, rating_general
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                user_id || null,
                finalName,
                finalEmail,
                finalType,
                finalMessage,
                rating || 0,
                rating_course || 0,
                rating_ui || 0,
                rating_ux || 0,
                rating_coding || 0,
                rating_general || 0
            ]
        );

        res.status(201).json({
            id: result.insertId,
            message: 'Feedback submitted successfully'
        });
    } catch (error) {
        console.error("Error adding feedback:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Get All Feedback
export const getAllFeedback = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM feedback ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error("Error fetching feedback:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};
