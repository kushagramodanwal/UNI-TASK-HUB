import Bid from '../models/Bid.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { clerkClient } from '@clerk/express';

/**
 * Helper function to get Clerk user details
 */
const getClerkUser = async (userId) => {
  try {
    const clerkUser = await clerkClient.users.getUser(userId);
    return {
      email: clerkUser.emailAddresses[0]?.emailAddress || null,
      fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
    };
  } catch (error) {
    console.error('Error fetching Clerk user:', error);
    throw new Error('Failed to fetch user details');
  }
};

/**
 * @desc    Create a new bid on a task
 * @route   POST /api/bids
 * @access  Private
 */
export const createBid = asyncHandler(async (req, res) => {
  const { taskId, amount, proposal, deliveryTime, phone } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  // Check if task exists and is open for bidding
  const task = await Task.findById(taskId);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  if (task.status !== 'open') {
    return res.status(400).json({ success: false, message: 'Task is not open for bidding' });
  }

  if (task.userId === userId) {
    return res.status(400).json({ success: false, message: 'Cannot bid on your own task' });
  }

  // Check if user already has a bid on this task
  const existingBid = await Bid.findOne({ taskId, freelancerId: userId });
  if (existingBid) {
    return res.status(400).json({ success: false, message: 'You have already placed a bid on this task' });
  }

  // Get freelancer details
  const { email, fullName } = await getClerkUser(userId);

  // Get freelancer statistics (if User model exists)
  let freelancerStats = { rating: 0, completedTasks: 0 };
  try {
    const userProfile = await User.findOne({ clerkId: userId });
    if (userProfile) {
      freelancerStats = {
        rating: userProfile.rating || 0,
        completedTasks: userProfile.tasksCompleted || 0
      };
    }
  } catch (error) {
    console.log('User profile not found, using default stats');
  }

  // Create the bid
  const bid = await Bid.create({
    taskId,
    freelancerId: userId,
    freelancerEmail: email,
    freelancerName: fullName,
    freelancerPhone: phone || '',
    amount,
    proposal,
    deliveryTime,
    freelancerRating: freelancerStats.rating,
    freelancerCompletedTasks: freelancerStats.completedTasks
  });

  // Create notification for task owner
  await Notification.createNotification({
    userId: task.userId,
    type: 'bid_received',
    title: 'New Bid Received',
    message: `${fullName} placed a bid of ₹${amount} on your task "${task.title}"`,
    taskId: task._id,
    bidId: bid._id,
    actionUrl: `/task/${task._id}`,
    priority: 'medium'
  });

  res.status(201).json({
    success: true,
    message: 'Bid placed successfully',
    data: bid
  });
});

/**
 * @desc    Get all bids for a specific task
 * @route   GET /api/bids/task/:taskId
 * @access  Public
 */
export const getBidsForTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user?.id;
  const { sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 10 } = req.query;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  // Verify task exists
  const task = await Task.findById(taskId);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  let filter = { taskId };
  let bids;
  let total;

  // Check if user is the task owner (senior) or a bidder (junior)
  if (task.userId === userId) {
    // Senior (task owner) can see all bids
    bids = await Bid.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();
    
    total = await Bid.countDocuments(filter);
  } else {
    // Junior can only see their own bid
    filter.freelancerId = userId;
    bids = await Bid.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();
    
    total = await Bid.countDocuments(filter);
  }

  res.json({
    success: true,
    data: bids,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

/**
 * @desc    Get all bids placed by the logged-in freelancer
 * @route   GET /api/bids/my-bids
 * @access  Private
 */
export const getMyBids = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  const filter = { freelancerId: userId };
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const bids = await Bid.find(filter)
    .populate('taskId', 'title category budget deadline status')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Bid.countDocuments(filter);

  res.json({
    success: true,
    data: bids,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

/**
 * @desc    Accept a bid (task owner only)
 * @route   PUT /api/bids/:bidId/accept
 * @access  Private
 */
export const acceptBid = asyncHandler(async (req, res) => {
  const { bidId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  // Get the bid with task details
  const bid = await Bid.findById(bidId).populate('taskId');
  if (!bid) {
    return res.status(404).json({ success: false, message: 'Bid not found' });
  }

  const task = bid.taskId;

  // Verify the user is the task owner
  if (task.userId !== userId) {
    return res.status(403).json({ success: false, message: 'Only the task owner can accept bids' });
  }

  // Verify task is still open
  if (task.status !== 'open') {
    return res.status(400).json({ success: false, message: 'Task is no longer open for bidding' });
  }

  // Verify bid is pending
  if (bid.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Bid is no longer pending' });
  }

  // Accept the bid
  bid.status = 'accepted';
  bid.acceptedAt = new Date();
  await bid.save();

  // Update task
  task.status = 'in-progress';
  task.assignedTo = bid.freelancerId;
  task.assignedAt = new Date();
  task.acceptedBidId = bid._id;
  await task.save();

  // Reject all other pending bids for this task
  await Bid.updateMany(
    { taskId: task._id, _id: { $ne: bid._id }, status: 'pending' },
    { 
      status: 'rejected',
      rejectedAt: new Date()
    }
  );

  // Create notifications
  await Promise.all([
    // Notify freelancer of acceptance
    Notification.createNotification({
      userId: bid.freelancerId,
      type: 'bid_accepted',
      title: 'Bid Accepted!',
      message: `Your bid of ₹${bid.amount} on "${task.title}" has been accepted!`,
      taskId: task._id,
      bidId: bid._id,
      actionUrl: `/task/${task._id}`,
      priority: 'high'
    }),

    // Notify other freelancers of rejection
    ...await Bid.find({ 
      taskId: task._id, 
      _id: { $ne: bid._id }, 
      status: 'rejected' 
    }).then(rejectedBids => 
      rejectedBids.map(rejectedBid => 
        Notification.createNotification({
          userId: rejectedBid.freelancerId,
          type: 'bid_rejected',
          title: 'Bid Not Selected',
          message: `Your bid on "${task.title}" was not selected. Keep applying to other tasks!`,
          taskId: task._id,
          bidId: rejectedBid._id,
          actionUrl: '/browse-tasks',
          priority: 'low'
        })
      )
    )
  ]);

  res.json({
    success: true,
    message: 'Bid accepted successfully',
    data: bid
  });
});

/**
 * @desc    Reject a bid (task owner only)
 * @route   PUT /api/bids/:bidId/reject
 * @access  Private
 */
export const rejectBid = asyncHandler(async (req, res) => {
  const { bidId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  // Get the bid with task details
  const bid = await Bid.findById(bidId).populate('taskId');
  if (!bid) {
    return res.status(404).json({ success: false, message: 'Bid not found' });
  }

  const task = bid.taskId;

  // Verify the user is the task owner
  if (task.userId !== userId) {
    return res.status(403).json({ success: false, message: 'Only the task owner can reject bids' });
  }

  // Verify bid is pending
  if (bid.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Bid is no longer pending' });
  }

  // Reject the bid
  bid.status = 'rejected';
  bid.rejectedAt = new Date();
  await bid.save();

  // Create notification for freelancer
  await Notification.createNotification({
    userId: bid.freelancerId,
    type: 'bid_rejected',
    title: 'Bid Not Selected',
    message: `Your bid on "${task.title}" was not selected. Keep applying to other tasks!`,
    taskId: task._id,
    bidId: bid._id,
    actionUrl: '/browse-tasks',
    priority: 'low'
  });

  res.json({
    success: true,
    message: 'Bid rejected successfully',
    data: bid
  });
});

/**
 * @desc    Withdraw a bid (freelancer only)
 * @route   PUT /api/bids/:bidId/withdraw
 * @access  Private
 */
export const withdrawBid = asyncHandler(async (req, res) => {
  const { bidId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  // Get the bid
  const bid = await Bid.findById(bidId).populate('taskId');
  if (!bid) {
    return res.status(404).json({ success: false, message: 'Bid not found' });
  }

  // Verify the user is the bid owner
  if (bid.freelancerId !== userId) {
    return res.status(403).json({ success: false, message: 'You can only withdraw your own bids' });
  }

  // Verify bid is pending
  if (bid.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Can only withdraw pending bids' });
  }

  // Withdraw the bid
  bid.status = 'withdrawn';
  bid.withdrawnAt = new Date();
  await bid.save();

  res.json({
    success: true,
    message: 'Bid withdrawn successfully',
    data: bid
  });
});

/**
 * @desc    Update a pending bid (freelancer only)
 * @route   PUT /api/bids/:bidId
 * @access  Private
 */
export const updateBid = asyncHandler(async (req, res) => {
  const { bidId } = req.params;
  const { amount, proposal, deliveryTime } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  // Get the bid
  const bid = await Bid.findById(bidId);
  if (!bid) {
    return res.status(404).json({ success: false, message: 'Bid not found' });
  }

  // Verify the user is the bid owner
  if (bid.freelancerId !== userId) {
    return res.status(403).json({ success: false, message: 'You can only update your own bids' });
  }

  // Verify bid is pending
  if (bid.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Can only update pending bids' });
  }

  // Update the bid
  if (amount !== undefined) bid.amount = amount;
  if (proposal !== undefined) bid.proposal = proposal;
  if (deliveryTime !== undefined) bid.deliveryTime = deliveryTime;

  await bid.save();

  res.json({
    success: true,
    message: 'Bid updated successfully',
    data: bid
  });
});

/**
 * @desc    Get bid statistics
 * @route   GET /api/bids/stats
 * @access  Public
 */
export const getBidStats = asyncHandler(async (req, res) => {
  const stats = await Bid.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 }, avgAmount: { $avg: '$amount' } } }
  ]);

  const totalBids = await Bid.countDocuments();
  const totalBidAmount = await Bid.aggregate([
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  res.json({
    success: true,
    data: {
      totalBids,
      totalBidAmount: totalBidAmount[0]?.total || 0,
      statusBreakdown: stats
    }
  });
});
