import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Add Placement/Success Story
export const addPlacement = async (req, res) => {
    try {
        const { name, company, role, package: salary_package, batch, type, description, tips, interview_experience } = req.body;

        let imageUrl = null;
        let videoUrl = null;

        if (req.files) {
            if (req.files.image && req.files.image[0]) {
                imageUrl = `/uploads/placements/${req.files.image[0].filename}`;
            }
            if (req.files.video && req.files.video[0]) {
                videoUrl = `/uploads/placements/${req.files.video[0].filename}`;
            }
        }

        const query = `
            INSERT INTO placements 
            (name, company, role, package, batch, type, description, tips, interview_experience, image_url, video_url) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.query(query, [
            name, company, role, salary_package, batch, type || 'Success Story', description, tips, interview_experience, imageUrl, videoUrl
        ]);

        res.status(201).json({ id: result.insertId, message: 'Placement added successfully' });
    } catch (error) {
        console.error("Error adding placement:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get All Placements
export const getAllPlacements = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM placements ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error("Error fetching placements:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Update Placement
export const updatePlacement = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, company, role, package: salary_package, batch, type, description, tips, interview_experience } = req.body;

        let query = `
            UPDATE placements SET 
            name = ?, company = ?, role = ?, package = ?, batch = ?, type = ?, description = ?, tips = ?, interview_experience = ?
        `;
        const params = [name, company, role, salary_package, batch, type, description, tips, interview_experience];

        if (req.files && req.files.image && req.files.image[0]) {
            query += `, image_url = ?`;
            params.push(`/uploads/placements/${req.files.image[0].filename}`);
        }

        if (req.files && req.files.video && req.files.video[0]) {
            query += `, video_url = ?`;
            params.push(`/uploads/placements/${req.files.video[0].filename}`);
        }

        query += ` WHERE id = ?`;
        params.push(id);

        await pool.query(query, params);
        res.json({ message: 'Placement updated successfully' });
    } catch (error) {
        console.error("Error updating placement:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Delete Placement
export const deletePlacement = async (req, res) => {
    try {
        const { id } = req.params;
        // Optionally delete files from fs here if needed
        await pool.query('DELETE FROM placements WHERE id = ?', [id]);
        res.json({ message: 'Placement deleted successfully' });
    } catch (error) {
        console.error("Error deleting placement:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};
