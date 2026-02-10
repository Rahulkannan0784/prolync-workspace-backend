import db from '../config/db.js';

export const getFeatureStatus = async (req, res) => {
    const { featureName } = req.params;

    try {
        const query = 'SELECT is_enabled FROM feature_flags WHERE feature_key = ?';
        const [results] = await db.query(query, [featureName]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Feature not found' });
        }

        // Convert 1/0 to boolean
        const isEnabled = results[0].is_enabled === 1;
        res.json({ is_enabled: isEnabled });
    } catch (error) {
        console.error('Error in getFeatureStatus:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateFeatureStatus = async (req, res) => {
    const { featureName } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
        return res.status(400).json({ message: 'enabled status must be a boolean' });
    }

    try {
        const query = 'UPDATE feature_flags SET is_enabled = ? WHERE feature_key = ?';
        const [result] = await db.query(query, [enabled, featureName]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Feature not found' });
        }

        res.json({ message: 'Feature status updated', feature: featureName, is_enabled: enabled });
    } catch (error) {
        console.error('Error in updateFeatureStatus:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getAllFeatures = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM feature_flags');
        // Standardize response to match what frontend expects
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching all features:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
