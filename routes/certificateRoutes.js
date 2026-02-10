import express from 'express';
import { issueCertificate, getMyCertificates } from '../controllers/certificateController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/issue', protect, issueCertificate);
router.get('/my-certificates', protect, getMyCertificates);

export default router;
