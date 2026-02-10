import express from 'express';
import { getFeatureStatus, updateFeatureStatus, getAllFeatures } from '../controllers/FeaturesController.js';

const router = express.Router();

// Public route to check feature status
router.get('/:featureName', getFeatureStatus);

// Admin route to get all features
router.get('/admin/all', getAllFeatures);

// Admin route to toggle feature status
// TODO: Add admin authentication middleware here when ready
router.put('/admin/:featureName', updateFeatureStatus);

export default router;
