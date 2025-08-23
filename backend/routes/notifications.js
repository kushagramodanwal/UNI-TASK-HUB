import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  clearOldNotifications,
  createTestNotification
} from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validation.js';
import { body } from 'express-validator';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);

router.put('/mark-all-read', markAllAsRead);
router.put('/:notificationId/read', validateObjectId('notificationId'), markAsRead);

router.delete('/clear-old', clearOldNotifications);
router.delete('/:notificationId', validateObjectId('notificationId'), deleteNotification);

router.post('/test', [
  body('title').optional().isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('message').optional().isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters'),
  body('type').optional().isIn([
    'bid_received', 'bid_accepted', 'bid_rejected', 'task_assigned', 'task_completed',
    'task_submitted', 'payment_escrowed', 'payment_released', 'dispute_created',
    'dispute_resolved', 'review_received', 'task_deadline_reminder', 'system_message'
  ]).withMessage('Invalid notification type'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
], createTestNotification);

export default router;
