import express from 'express';
import { getEvents, createEvent, deleteEvent, updateEvent, incrementEventView } from '../controllers/eventController.js';
import imageUpload from '../middleware/imageUpload.js';

const router = express.Router();

router.get('/', getEvents);
router.post('/', imageUpload.single('image_file'), createEvent);
router.delete('/:id', deleteEvent);
router.put('/:id', imageUpload.single('image_file'), updateEvent);
router.post('/view/:id', incrementEventView);

export default router;
