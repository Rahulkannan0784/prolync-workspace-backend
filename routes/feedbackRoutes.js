import express from 'express';
import { addFeedback, getAllFeedback } from '../controllers/feedbackController.js';

const router = express.Router();

router.post('/add', addFeedback);
router.get('/all', getAllFeedback);

export default router;
