import express from 'express';
import { uploadTasks, getTasksGrouped, getStats, completeTask, deleteTask, downloadTemplate } from '../controllers/taskController.js';
import protect from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();


router.post('/upload', protect, upload.single('file'), uploadTasks);
router.get('/template', protect, downloadTemplate);
router.get('/grouped', protect, getTasksGrouped);
router.get('/stats', protect, getStats);
router.patch('/:id/complete', protect, completeTask);
router.delete('/:id', protect, deleteTask);

export default router;

