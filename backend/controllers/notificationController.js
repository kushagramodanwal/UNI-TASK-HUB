import Notification from '../models/Notification.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * @desc    Get notifications for user
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const { 
    isRead, 
    type, 
    priority, 
    page = 1, 
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const filter = { userId };
  
  if (isRead !== undefined) filter.isRead = isRead === 'true';
  if (type) filter.type = type;
  if (priority) filter.priority = priority;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const notifications = await Notification.find(filter)
    .populate('taskId', 'title category')
    .populate('bidId', 'amount proposal')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Notification.countDocuments(filter);
  const unreadCount = await Notification.countDocuments({ userId, isRead: false });

  res.json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:notificationId/read
 * @access  Private
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const notification = await Notification.findById(notificationId);
  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  // Verify user owns the notification
  if (notification.userId !== userId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  // Mark as read
  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  res.json({
    success: true,
    message: 'Notification marked as read',
    data: notification
  });
});

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/mark-all-read
 * @access  Private
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const result = await Notification.markAsRead(userId);

  res.json({
    success: true,
    message: 'All notifications marked as read',
    data: { modifiedCount: result.modifiedCount }
  });
});

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:notificationId
 * @access  Private
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const notification = await Notification.findById(notificationId);
  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  // Verify user owns the notification
  if (notification.userId !== userId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  await Notification.findByIdAndDelete(notificationId);

  res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

/**
 * @desc    Get unread count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const unreadCount = await Notification.getUnreadCount(userId);

  res.json({
    success: true,
    data: { unreadCount }
  });
});

/**
 * @desc    Clear old notifications (30+ days)
 * @route   DELETE /api/notifications/clear-old
 * @access  Private
 */
export const clearOldNotifications = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const result = await Notification.deleteMany({
    userId,
    createdAt: { $lt: thirtyDaysAgo },
    isRead: true
  });

  res.json({
    success: true,
    message: 'Old notifications cleared',
    data: { deletedCount: result.deletedCount }
  });
});

/**
 * @desc    Create test notification (development only)
 * @route   POST /api/notifications/test
 * @access  Private
 */
export const createTestNotification = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ success: false, message: 'Test notifications only available in development' });
  }

  const { title, message, type = 'system_message', priority = 'medium' } = req.body;

  const notification = await Notification.createNotification({
    userId,
    type,
    title: title || 'Test Notification',
    message: message || 'This is a test notification',
    priority,
    actionUrl: '/dashboard'
  });

  res.status(201).json({
    success: true,
    message: 'Test notification created',
    data: notification
  });
});
