import express from 'express';
import { getStudentActivity, logStudentActivity, getStudentStats, getCalendarData } from '../controllers/studentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/activity', protect, getStudentActivity);
router.get('/stats', protect, getStudentStats);
router.get('/calendar', protect, getCalendarData);
router.post('/activity/log', protect, logStudentActivity);

export default router;
