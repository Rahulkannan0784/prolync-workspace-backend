
import express from 'express';
import { createHOD, getAllHODs, updateHODStatus, deleteHOD, getHODStudents, removeStudentFromHOD } from '../controllers/hodController.js';
import {
    getOverview,
    getActivityTrends,
    getAllDepartmentStudents,
    getTopPerformers,
    getEngagementMetrics,
    getRecentActivity,
    getStudentDetails,
    getMetricDetails,
    getStudentPerformance,
    getEngagementInsights
} from '../controllers/hodDashboardController.js';
import { protectHOD } from '../middleware/hodMiddleware.js';

const router = express.Router();

// HOD Management
router.post('/', createHOD);
router.get('/', getAllHODs);
router.patch('/:id/status', updateHODStatus);
router.get('/:id/students', getHODStudents);
router.delete('/:id/students/:studentId', removeStudentFromHOD);
router.delete('/:id', deleteHOD);

// HOD Dashboard Metrics (HOD only)
router.get('/stats/overview', protectHOD, getOverview);
router.get('/stats/activity', protectHOD, getActivityTrends);
router.get('/stats/students', protectHOD, getStudentPerformance);
router.get('/stats/all-students', protectHOD, getAllDepartmentStudents);
router.get('/stats/top-performers', protectHOD, getTopPerformers);
router.get('/stats/engagement', protectHOD, getEngagementMetrics);
router.get('/stats/engagement-insights', protectHOD, getEngagementInsights);
router.get('/stats/recent-activity', protectHOD, getRecentActivity);
router.get('/stats/student/:id', protectHOD, getStudentDetails);
router.get('/stats/details', protectHOD, getMetricDetails);

export default router;
