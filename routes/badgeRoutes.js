import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
    createBadge,
    getAllBadges,
    updateBadge,
    deleteBadge,
    getMyBadges
} from '../controllers/badgeController.js';

const router = express.Router();

// Public / Student Routes
router.get('/my-badges', protect, getMyBadges);

// Admin Routes
router.post('/', protect, admin, createBadge);
router.get('/', protect, admin, getAllBadges); // View all definitions
router.put('/:id', protect, admin, updateBadge);
router.delete('/:id', protect, admin, deleteBadge);


export default router;
