import express from 'express';
import { getAllJobs, getJobById, getJobBySlug, createJob, updateJob, deleteJob, trackJobApplication, getMyApplications, incrementJobView, toggleSaveJob, getSavedJobs } from '../controllers/jobsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllJobs);

// Specific routes (MUST be before /:id)
router.get('/my-applications', protect, getMyApplications);
router.get('/saved', protect, getSavedJobs);
router.post('/save', protect, toggleSaveJob);
router.post('/track', protect, trackJobApplication);
router.get('/slug/:slug', getJobBySlug);
router.post('/view/:id', incrementJobView);

// Generic routes
router.get('/:id', getJobById);
router.post('/', createJob); // Admin likely, should be protected in real app
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);

export default router;
