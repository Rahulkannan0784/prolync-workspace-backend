
import express from 'express';
import { sendSupportEmail } from '../controllers/supportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send', sendSupportEmail);

export default router;
