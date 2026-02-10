import express from 'express';
import {
    getDashboardStats,
    getGrowthAnalytics,
    getActivityFeed,
    getTopCoders,
    getCourseStats,
    getMentorshipStats,
    getProjectStats,
    getJobStats
} from '../controllers/statsController.js';

const router = express.Router();

router.get('/overview', getDashboardStats);
router.get('/growth', getGrowthAnalytics);
router.get('/activity', getActivityFeed);
router.get('/coders', getTopCoders);
router.get('/courses', getCourseStats);
router.get('/mentorship', getMentorshipStats);
router.get('/projects', getProjectStats);
router.get('/jobs', getJobStats);

export default router;
