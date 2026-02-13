import db from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create new placement blog
export const createPlacementBlog = async (req, res) => {
    try {
        const { title, category, short_description, content, status = 'Active' } = req.body;

        // Validate required fields
        if (!title || !category || !content) {
            return res.status(400).json({
                message: 'Title, category, and content are required'
            });
        }

        // Get thumbnail path if uploaded
        const thumbnail = req.file ? `/uploads/placement-blogs/${req.file.filename}` : null;

        const query = `
            INSERT INTO placement_blogs 
            (title, category, short_description, content, thumbnail, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(query, [
            title,
            category,
            short_description || '',
            content,
            thumbnail,
            status
        ]);

        // Fetch the created blog
        const [newBlog] = await db.query(
            'SELECT * FROM placement_blogs WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            message: 'Blog created successfully',
            blog: newBlog[0]
        });
    } catch (error) {
        console.error('Error creating placement blog:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all placement blogs (admin)
export const getAllPlacementBlogs = async (req, res) => {
    try {
        const [blogs] = await db.query(`
            SELECT * FROM placement_blogs 
            ORDER BY created_at DESC
        `);

        res.status(200).json(blogs);
    } catch (error) {
        console.error('Error fetching placement blogs:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get only active blogs (for students)
export const getActivePlacementBlogs = async (req, res) => {
    try {
        const [blogs] = await db.query(`
            SELECT * FROM placement_blogs 
            WHERE status = 'Active'
            ORDER BY created_at DESC
        `);

        res.status(200).json(blogs);
    } catch (error) {
        console.error('Error fetching active placement blogs:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single blog by ID or Title
export const getPlacementBlogById = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if id is numeric or a title
        const isNumeric = /^\d+$/.test(id);

        let blogs;
        if (isNumeric) {
            [blogs] = await db.query(
                'SELECT * FROM placement_blogs WHERE id = ?',
                [id]
            );
        } else {
            // Search by title (decoded) - Try exact match first, then replace underscores with spaces
            let title = decodeURIComponent(id);

            // First try: Exact match
            [blogs] = await db.query(
                'SELECT * FROM placement_blogs WHERE title = ?',
                [title]
            );

            // Second try: Replace underscores with spaces (common URL pattern)
            if (blogs.length === 0 && title.includes('_')) {
                const titleWithSpaces = title.replace(/_/g, ' ');
                [blogs] = await db.query(
                    'SELECT * FROM placement_blogs WHERE title = ?',
                    [titleWithSpaces]
                );
            }
        }

        if (blogs.length === 0) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        res.status(200).json(blogs[0]);
    } catch (error) {
        console.error('Error fetching placement blog:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update placement blog
export const updatePlacementBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, category, short_description, content, status } = req.body;

        // Check if blog exists
        const [existing] = await db.query(
            'SELECT * FROM placement_blogs WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // If new image uploaded, delete old one
        let thumbnail = existing[0].thumbnail;
        if (req.file) {
            // Delete old thumbnail if exists
            if (existing[0].thumbnail) {
                const oldPath = path.join(__dirname, '..', existing[0].thumbnail);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            thumbnail = `/uploads/placement-blogs/${req.file.filename}`;
        }

        const query = `
            UPDATE placement_blogs 
            SET title = ?, category = ?, short_description = ?, 
                content = ?, thumbnail = ?, status = ?
            WHERE id = ?
        `;

        await db.query(query, [
            title || existing[0].title,
            category || existing[0].category,
            short_description !== undefined ? short_description : existing[0].short_description,
            content || existing[0].content,
            thumbnail,
            status || existing[0].status,
            id
        ]);

        // Fetch updated blog
        const [updatedBlog] = await db.query(
            'SELECT * FROM placement_blogs WHERE id = ?',
            [id]
        );

        res.status(200).json({
            message: 'Blog updated successfully',
            blog: updatedBlog[0]
        });
    } catch (error) {
        console.error('Error updating placement blog:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete placement blog
export const deletePlacementBlog = async (req, res) => {
    try {
        const { id } = req.params;

        // Get blog to find thumbnail path
        const [blogs] = await db.query(
            'SELECT * FROM placement_blogs WHERE id = ?',
            [id]
        );

        if (blogs.length === 0) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Delete thumbnail file if exists
        if (blogs[0].thumbnail) {
            const thumbnailPath = path.join(__dirname, '..', blogs[0].thumbnail);
            if (fs.existsSync(thumbnailPath)) {
                fs.unlinkSync(thumbnailPath);
            }
        }

        // Delete from database
        await db.query('DELETE FROM placement_blogs WHERE id = ?', [id]);

        res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (error) {
        console.error('Error deleting placement blog:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Increment Blog View
export const incrementPlacementBlogView = async (req, res) => {
    try {
        const { id } = req.params;
        const isNumeric = /^\d+$/.test(id);

        if (isNumeric) {
            await db.query('UPDATE placement_blogs SET views = views + 1 WHERE id = ?', [id]);
        } else {
            const title = decodeURIComponent(id);
            const [result] = await db.query('UPDATE placement_blogs SET views = views + 1 WHERE title = ?', [title]);

            // If no rows affected (title with underscores didn't match), try replacing underscores with spaces
            if (result.affectedRows === 0 && title.includes('_')) {
                const titleWithSpaces = title.replace(/_/g, ' ');
                await db.query('UPDATE placement_blogs SET views = views + 1 WHERE title = ?', [titleWithSpaces]);
            }
        }

        res.status(200).json({ message: 'View incremented' });
    } catch (error) {
        console.error('Error incrementing blog view:', error);
        res.status(500).json({ message: 'Server error incrementing view' });
    }
};
