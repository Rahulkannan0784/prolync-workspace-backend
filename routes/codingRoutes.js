import express from 'express';
import { getUserProgress, submitSolution, getUserCodingStats, getQuestions, getQuestionById, getDailyChallenge, createQuestion, updateQuestion, deleteQuestion, importQuestions, getQuestionAnalytics, getPlatformAnalytics, getTopics, getKits, createKit, updateKit, deleteKit } from '../controllers/codingController.js';
import { protect as authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public / User Routes
// The controller checks req.user for admin role. So we should use authMiddleware to populate req.user.
router.get('/topics', authMiddleware, getTopics);
router.get('/', authMiddleware, getQuestions);
router.get('/progress', authMiddleware, getUserProgress);
router.get('/stats', authMiddleware, getUserCodingStats); // Must be before /:id to avoid collision if :id matches stats
router.get('/daily-challenge', authMiddleware, getDailyChallenge);

// Kit Management - MUST be before /:id route
router.get('/kits', authMiddleware, getKits);
router.post('/kits/add', authMiddleware, createKit);
router.put('/kits/:id', authMiddleware, updateKit);
router.delete('/kits/:id', authMiddleware, deleteKit);

router.post('/submit', authMiddleware, submitSolution);
router.get('/:id', authMiddleware, getQuestionById);

// Admin Routes
router.get('/admin/analytics/platform', authMiddleware, getPlatformAnalytics);
router.post('/admin', authMiddleware, createQuestion); // POST /api/coding/admin
router.put('/admin/:id', authMiddleware, updateQuestion);
router.delete('/admin/:id', authMiddleware, deleteQuestion);
router.post('/admin/import', authMiddleware, importQuestions);
router.get('/admin/:id/analytics', authMiddleware, getQuestionAnalytics);
router.get('/admin/preview/:id', authMiddleware, getQuestionById); // Preview same as get but controller handles hidden logic based on role

export default router;
