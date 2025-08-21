import Task from '../models/Task.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { clerkClient } from '@clerk/express';

/**
 * Helper function to get Clerk user details
 */
const getClerkUser = async (userId) => {
  const clerkUser = await clerkClient.users.getUser(userId);
  return {
    email: clerkUser.emailAddresses[0]?.emailAddress || null,
    fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
  };
};

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Private
 */
export const createTask = asyncHandler(async (req, res) => {
  const { title, description, category, college, budget, deadline, location, requirements } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  // Validate required fields

  
  const errors = [];
  
  if (!title || title.trim().length < 3 || title.trim().length > 100) {
    errors.push('Title must be between 3 and 100 characters');
  }
  
  if (!description || description.trim().length < 10 || description.trim().length > 1000) {
    errors.push('Description must be between 10 and 1000 characters');
  }
  
  if (!category || !['Academic Writing', 'Programming', 'Design', 'Research', 'Translation', 'Data Analysis', 'Presentation', 'Other'].includes(category)) {
    errors.push('Invalid category');
  }
  
  if (!college || college.trim().length < 2 || college.trim().length > 100) {
    errors.push('College name must be between 2 and 100 characters');
  }
  
  if (!budget || isNaN(budget) || parseFloat(budget) < 1) {
    errors.push('Budget must be a positive number');
  }
  
  if (!deadline || !Date.parse(deadline)) {
    errors.push('Deadline must be a valid date');
  } else {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadlineDate < today) {
      errors.push('Deadline must be today or in the future');
    }
  }
  
  if (location && location.trim().length > 100) {
    errors.push('Location cannot exceed 100 characters');
  }
  
  if (requirements && requirements.trim().length > 500) {
    errors.push('Requirements cannot exceed 500 characters');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }

  const { email, fullName } = await getClerkUser(userId);

  // Handle file attachments
  const attachments = [];
  if (req.files && req.files.length > 0) {
    attachments.push(...req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`
    })));
  }

  const task = await Task.create({
    title,
    description,
    category,
    college,
    budget,
    deadline,
    location,
    requirements,
    userId,
    userEmail: email,
    userName: fullName,
    userCollege: college,
    attachments
  });

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: task
  });
});

/**
 * @desc    Get all tasks with filtering and pagination
 * @route   GET /api/tasks
 * @access  Public
 */
export const getTasks = asyncHandler(async (req, res) => {
  const { category, college, status, minBudget, maxBudget, search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  const filter = {};

  if (category) filter.category = category;
  if (college) filter.college = college;
  if (status) filter.status = status;
  if (minBudget || maxBudget) {
    filter.budget = {};
    if (minBudget) filter.budget.$gte = parseFloat(minBudget);
    if (maxBudget) filter.budget.$lte = parseFloat(maxBudget);
  }
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { college: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const tasks = await Task.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).lean();
  const total = await Task.countDocuments(filter);

  res.json({
    success: true,
    data: tasks,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

/**
 * @desc    Get single task by ID
 * @route   GET /api/tasks/:id
 * @access  Public
 */
export const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  res.json({ success: true, data: task });
});

/**
 * @desc    Get tasks created by the logged-in user
 * @route   GET /api/tasks/my-tasks
 * @access  Private
 */
export const getMyTasks = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  const filter = { userId };
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const tasks = await Task.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).lean();
  const total = await Task.countDocuments(filter);

  res.json({
    success: true,
    data: tasks,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

/**
 * @desc    Update a task
 * @route   PUT /api/tasks/:id
 * @access  Private (owner only)
 */
export const updateTask = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  if (task.userId !== userId) {
    return res.status(403).json({ success: false, message: 'Access denied. You can only update your own tasks.' });
  }

  const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

  res.json({ success: true, message: 'Task updated successfully', data: updatedTask });
});

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 * @access  Private (owner only)
 */
export const deleteTask = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  if (task.userId !== userId) {
    return res.status(403).json({ success: false, message: 'Access denied. You can only delete your own tasks.' });
  }

  await Task.findByIdAndDelete(req.params.id);

  res.json({ success: true, message: 'Task deleted successfully' });
});

/**
 * @desc    Submit task work (freelancer only)
 * @route   PUT /api/tasks/:id/submit
 * @access  Private (assigned freelancer only)
 */
export const submitTask = asyncHandler(async (req, res) => {
  const { submissionUrl, submissionNotes } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  // Verify user is the assigned freelancer
  if (task.assignedTo !== userId) {
    return res.status(403).json({ success: false, message: 'Only the assigned freelancer can submit work' });
  }

  // Verify task is in progress
  if (task.status !== 'in-progress') {
    return res.status(400).json({ success: false, message: 'Task must be in progress to submit work' });
  }

  // Update task with submission
  task.status = 'submitted';
  task.submissionUrl = submissionUrl;
  task.submissionNotes = submissionNotes;
  task.submittedAt = new Date();
  await task.save();

  // Create notification for client
  const Notification = (await import('../models/Notification.js')).default;
  await Notification.createNotification({
    userId: task.userId,
    type: 'task_submitted',
    title: 'Work Submitted',
    message: `Work has been submitted for "${task.title}". Please review and approve.`,
    taskId: task._id,
    actionUrl: `/task/${task._id}`,
    priority: 'high'
  });

  res.json({
    success: true,
    message: 'Work submitted successfully',
    data: task
  });
});

/**
 * @desc    Assign task to a junior (senior only)
 * @route   PUT /api/tasks/:id/assign
 * @access  Private
 */
export const assignTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { bidId } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const task = await Task.findById(id);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  // Only the task owner (senior) can assign the task
  if (task.userId !== userId) {
    return res.status(403).json({ success: false, message: 'Only the task owner can assign this task' });
  }

  // Verify the bid exists and belongs to this task
  const Bid = (await import('../models/Bid.js')).default;
  const bid = await Bid.findById(bidId);
  if (!bid || bid.taskId.toString() !== id) {
    return res.status(404).json({ success: false, message: 'Bid not found or invalid' });
  }

  // Update task status and assignment
  task.status = 'assigned';
  task.assignedTo = bid.freelancerId;
  task.assignedAt = new Date();
  task.acceptedBidId = bidId;
  await task.save();

  // Update bid status to accepted
  bid.status = 'accepted';
  await bid.save();

  // Create notification for the assigned junior
  const Notification = (await import('../models/Notification.js')).default;
  await Notification.createNotification({
    userId: bid.freelancerId,
    type: 'task_assigned',
    title: 'Task Assigned!',
    message: `You have been assigned to complete the task: "${task.title}"`,
    taskId: task._id,
    actionUrl: `/task/${task._id}`,
    priority: 'high'
  });

  res.json({
    success: true,
    message: 'Task assigned successfully',
    data: {
      task,
      assignedJunior: {
        id: bid.freelancerId,
        name: bid.freelancerName,
        email: bid.freelancerEmail
      }
    }
  });
});

/**
 * @desc    Get task statistics
 * @route   GET /api/tasks/stats
 * @access  Public
 */
export const getTaskStats = asyncHandler(async (req, res) => {
  const stats = await Task.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 }, avgBudget: { $avg: '$budget' } } }
  ]);

  const totalTasks = await Task.countDocuments();
  const totalBudget = await Task.aggregate([
    { $group: { _id: null, total: { $sum: '$budget' } } }
  ]);

  const categoryStats = await Task.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  res.json({
    success: true,
    data: {
      totalTasks,
      totalBudget: totalBudget[0]?.total || 0,
      statusBreakdown: stats,
      categoryBreakdown: categoryStats
    }
  });
});
