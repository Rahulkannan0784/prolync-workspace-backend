import express from 'express';
import { logActivity, issueCertificate } from '../controllers/activityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/log', protect, logActivity);
router.post('/issue-certificate', protect, issueCertificate);

export default router;
