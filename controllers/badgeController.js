import db from '../config/db.js';
import badgeService from '../services/badgeService.js';

// --- Admin Operations ---

// Create a new badge
export const createBadge = async (req, res) => {
    try {
        const { name, description, icon_url, trigger_type, trigger_value } = req.body;

        if (!name || !trigger_type) {
            return res.status(400).json({ message: "Name and Trigger Type are required" });
        }

        // Validate trigger type
        if (!Object.values(badgeService.TRIGGERS).includes(trigger_type)) {
            return res.status(400).json({ message: "Invalid Trigger Type" });
        }

        const [result] = await db.query(`
            INSERT INTO badges (name, description, icon_url, trigger_type, trigger_value)
            VALUES (?, ?, ?, ?, ?)
        `, [name, description, icon_url, trigger_type, trigger_value || 0]);

        res.status(201).json({ message: "Badge created successfully", badgeId: result.insertId });
    } catch (error) {
        console.error("Create Badge Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get all badges (for admin list)
export const getAllBadges = async (req, res) => {
    try {
        const [badges] = await db.query('SELECT * FROM badges ORDER BY created_at DESC');
        res.json(badges);
    } catch (error) {
        console.error("Get Badges Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Update a badge
export const updateBadge = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, icon_url, trigger_type, trigger_value, is_active } = req.body;

        await db.query(`
            UPDATE badges 
            SET name = ?, description = ?, icon_url = ?, trigger_type = ?, trigger_value = ?, is_active = ?
            WHERE id = ?
        `, [name, description, icon_url, trigger_type, trigger_value, is_active, id]);

        res.json({ message: "Badge updated successfully" });
    } catch (error) {
        console.error("Update Badge Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Delete a badge
export const deleteBadge = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM badges WHERE id = ?', [id]);
        res.json({ message: "Badge deleted successfully" });
    } catch (error) {
        console.error("Delete Badge Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};


// --- Student Operations ---

// Get my badges
export const getMyBadges = async (req, res) => {
    try {
        const userId = req.user.id;

        const [badges] = await db.query(`
            SELECT b.*, ub.awarded_at 
            FROM user_badges ub
            JOIN badges b ON ub.badge_id = b.id
            WHERE ub.user_id = ?
            ORDER BY ub.awarded_at DESC
        `, [userId]);

        res.json(badges);
    } catch (error) {
        console.error("Get My Badges Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
