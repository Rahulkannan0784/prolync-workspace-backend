import db from '../config/db.js';

// Get all events
export const getEvents = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM events ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Server error fetching events' });
    }
};

// Create a new event
export const createEvent = async (req, res) => {
    const { title, type, date, time, location, prize, description, registration_link, image_url, status, preparation_tips } = req.body;

    // Convert tips to JSON string if it's an array/object, or handle empty case
    const tipsValue = preparation_tips ? JSON.stringify(preparation_tips) : null;
    const statusValue = status || 'Draft';

    let finalImageUrl = image_url;
    let imageSource = 'url';

    // Prioritize Multer file
    if (req.file) {
        finalImageUrl = `/uploads/images/${req.file.filename}`;
        imageSource = 'local';
    } else if (image_url) {
        imageSource = 'url';
    } else {
        imageSource = null;
    }

    try {
        const [result] = await db.query(
            'INSERT INTO events (title, type, date, time, location, prize, description, registration_link, image_url, status, preparation_tips, image_source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [title, type, date, time, location, prize, description, registration_link, finalImageUrl, statusValue, tipsValue, imageSource]
        );
        res.status(201).json({ id: result.insertId, message: 'Event created successfully' });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: 'Server error creating event' });
    }
};

// Delete an event
export const deleteEvent = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM events WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ message: 'Server error deleting event' });
    }
};

// Update an event
export const updateEvent = async (req, res) => {
    const { id } = req.params;
    const { title, type, date, time, location, prize, description, registration_link, image_url, status, preparation_tips } = req.body;

    const tipsValue = preparation_tips ? JSON.stringify(preparation_tips) : null;

    let finalImageUrl = image_url;
    let imageSource = 'url';

    // Prioritize Multer file
    if (req.file) {
        finalImageUrl = `/uploads/images/${req.file.filename}`;
        imageSource = 'local';
    } else {
        // If no new file, use the provided image_url (which might be the old one or a new URL)
        // We need to determine the source. If it starts with /uploads, it's local.
        if (image_url && image_url.startsWith('/uploads')) {
            imageSource = 'local';
        } else if (image_url) {
            imageSource = 'url';
        }
    }

    try {
        const [result] = await db.query(
            'UPDATE events SET title=?, type=?, date=?, time=?, location=?, prize=?, description=?, registration_link=?, image_url=?, status=?, preparation_tips=?, image_source=? WHERE id=?',
            [title, type, date, time, location, prize, description, registration_link, finalImageUrl, status, tipsValue, imageSource, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json({ message: 'Event updated successfully' });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ message: 'Server error updating event' });
    }
};
// Increment Event View
export const incrementEventView = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE events SET views = views + 1 WHERE id = ?', [id]);
        res.status(200).json({ message: 'View incremented' });
    } catch (error) {
        console.error('Error incrementing event view:', error);
        res.status(500).json({ message: 'Server error incrementing view' });
    }
};
