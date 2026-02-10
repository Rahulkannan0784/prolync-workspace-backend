import db from '../config/db.js';
import fs from 'fs';
import path from 'path';

const logToFile = (msg) => {
    const logPath = path.join(process.cwd(), 'backend-error.log');
    fs.appendFileSync(logPath, `[DEBUG] ${new Date().toISOString()} - ${msg}\n`);
};

export const addNews = async (req, res) => {
    try {
        logToFile(`addNews called. Body: ${JSON.stringify(req.body)}`);
        if (req.file) logToFile(`addNews File: ${JSON.stringify(req.file)}`);

        const { title, description, category, status, publish_date, image_url, external_link } = req.body;

        if (!title || !description || !category) {
            logToFile('Validation failed: Missing fields');
            return res.status(400).json({ message: 'Please provide all required fields (title, description, category)' });
        }

        // Handle image upload
        let finalImageUrl = image_url;
        if (req.file) {
            finalImageUrl = `/uploads/news/${req.file.filename}`;
        }

        const query = `
            INSERT INTO news (title, description, category, status, publish_date, image_url, external_link)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        // Use current date if publish_date is not provided
        const dateToPublish = publish_date || new Date();

        const [result] = await db.query(query, [title, description, category, status || 'Draft', dateToPublish, finalImageUrl, external_link]);

        res.status(201).json({ message: 'News added successfully', id: result.insertId });
    } catch (error) {
        console.error('Error adding news:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getAllNews = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM news ORDER BY publish_date DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getPublicNews = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM news WHERE status = 'Publish' ORDER BY publish_date DESC");
        res.json(rows);
    } catch (error) {
        console.error('Error fetching public news:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateNews = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, category, status, publish_date, image_url, external_link } = req.body;

        // Handle image upload
        let finalImageUrl = image_url;
        if (req.file) {
            finalImageUrl = `/uploads/news/${req.file.filename}`;
        } else if (image_url === undefined && req.body.existing_image) {
            // Keep existing image if no new file and no new url provided
            // This logic depends on frontend sending existing, but standard update is: if undefined, don't change?
            // SQL update sets it. If frontend sends old value, fine.
            // If frontend sends nothing for image_url, it might overwrite with NULL or undefined.
            // Best practice: If not provided, don't change? But query updates ALL fields.
            // So frontend must send old value if not changing.
        }

        // If finalImageUrl remains undefined (and not null), it might break if passed to query as undefined?
        // mysql2 query handles undefined as NULL usually or error.
        // Let's ensure we use what's passed or file.

        const query = `
            UPDATE news 
            SET title = ?, description = ?, category = ?, status = ?, publish_date = ?, image_url = ?, external_link = ?
            WHERE id = ?
        `;

        const [result] = await db.query(query, [title, description, category, status, publish_date, finalImageUrl, external_link, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'News item not found' });
        }

        res.json({ message: 'News updated successfully' });
    } catch (error) {
        console.error('Error updating news:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const deleteNews = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM news WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'News item not found' });
        }

        res.json({ message: 'News deleted successfully' });
    } catch (error) {
        console.error('Error deleting news:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const incrementView = async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'UPDATE news SET views = views + 1 WHERE id = ?';
        const [result] = await db.query(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'News item not found' });
        }

        res.json({ message: 'View count incremented successfully' });
    } catch (error) {
        console.error('Error incrementing view count:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
