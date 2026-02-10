
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

export const protectHOD = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            if (!token || token === 'null' || token === 'undefined') {
                return res.status(401).json({ message: 'Not authorized, no token' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (decoded.role !== 'HOD') {
                return res.status(403).json({ message: 'Not authorized: HOD access only' });
            }

            // Verify HOD exists and is active
            const [rows] = await db.query('SELECT * FROM hod WHERE id = ?', [decoded.id]);

            if (rows.length === 0) {
                return res.status(401).json({ message: 'HOD not found' });
            }

            if (rows[0].status === 'Blocked') {
                return res.status(403).json({ message: 'Account is blocked' });
            }

            req.hod = rows[0]; // Attach HOD object (with college/dept) to req

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};
