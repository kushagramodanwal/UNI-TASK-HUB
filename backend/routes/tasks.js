import express from 'express';
import {
  createTask,
  getTasks,
  getTaskById,
  getMyTasks,
  updateTask,
  deleteTask,
  submitTask,
  assignTask,
  getTaskStats
} from '../controllers/taskController.js';
import {
  authenticateToken,
  checkOwnership
} from '../middleware/auth.js';
import {
  validateCreateTask,
  validateUpdateTask,
  validateTaskQueries,
  validateObjectIdParam
} from '../middleware/validation.js';
import upload from '../middleware/upload.js';
import Task from '../models/Task.js';

const router = express.Router();

// Public routes
router.get('/', validateTaskQueries, getTasks);
router.get('/stats', getTaskStats);

// Protected routes
router.use(authenticateToken);

router.post('/', upload.array('files', 5), createTask);
router.get('/my-tasks', getMyTasks);

// Public routes with individual validation (must come after specific routes)
router.get('/:id', validateObjectIdParam, getTaskById);
router.put('/:id', validateObjectIdParam, checkOwnership(Task), validateUpdateTask, updateTask);
router.put('/:id/submit', validateObjectIdParam, submitTask);
router.put('/:id/assign', validateObjectIdParam, assignTask);
router.delete('/:id', validateObjectIdParam, checkOwnership(Task), deleteTask);

export default router;