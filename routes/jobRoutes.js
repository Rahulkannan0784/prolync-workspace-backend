import express from 'express';
import { getAllJobs, createJob, updateJob, deleteJob, trackJobApplication, getMyApplications, incrementJobView, toggleSaveJob, getSavedJobs } from '../controllers/jobsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllJobs);
router.post('/', createJob); // Admin likely, should be protected in real app
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);
router.get('/my-applications', protect, getMyApplications);
router.post('/track', protect, trackJobApplication);
router.post('/view/:id', incrementJobView);

// Saved Jobs
router.post('/save', protect, toggleSaveJob);
router.get('/saved', protect, getSavedJobs);

export default router;
