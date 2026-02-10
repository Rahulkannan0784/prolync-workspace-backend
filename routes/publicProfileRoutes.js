import express from 'express';
import { getPublicProfile } from '../controllers/publicProfileController.js';

const router = express.Router();

// Public Profile Route
// GET /api/public/profile/:id
// No auth middleware required (Public)
router.get('/:id', getPublicProfile);

export default router;
