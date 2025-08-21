import Dispute from '../models/Dispute.js';
import Payment from '../models/Payment.js';
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
 * @desc    Create a new dispute
 * @route   POST /api/disputes
 * @access  Private
 */
export const createDispute = asyncHandler(async (req, res) => {
  const { paymentId, reason, description } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  // Get payment with related task
  const payment = await Payment.findById(paymentId).populate('taskId');
  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment not found' });
  }

  const task = payment.taskId;

  // Verify user is involved in the payment
  if (payment.clientId !== userId && payment.freelancerId !== userId) {
    return res.status(403).json({ success: false, message: 'You can only dispute payments you are involved in' });
  }

  // Check if payment is in a disputable state
  if (!['escrowed', 'submitted'].includes(payment.status)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Payment must be escrowed or submitted to create a dispute' 
    });
  }

  // Check if dispute already exists
  const existingDispute = await Dispute.findOne({ paymentId });
  if (existingDispute) {
    return res.status(400).json({ success: false, message: 'Dispute already exists for this payment' });
  }

  // Determine respondent
  const respondentId = payment.clientId === userId ? payment.freelancerId : payment.clientId;

  // Create the dispute
  const dispute = await Dispute.create({
    taskId: task._id,
    paymentId: payment._id,
    initiatorId: userId,
    respondentId,
    reason,
    description,
    disputeAmount: payment.amount,
    status: 'open'
  });

  // Update payment status
  payment.status = 'disputed';
  payment.disputeId = dispute._id;
  payment.disputedAt = new Date();
  await payment.save();

  // Create notifications
  await Promise.all([
    // Notify respondent
    Notification.createNotification({
      userId: respondentId,
      type: 'dispute_created',
      title: 'Dispute Created',
      message: `A dispute has been created for "${task.title}". Please respond within 48 hours.`,
      taskId: task._id,
      disputeId: dispute._id,
      actionUrl: `/dispute/${dispute._id}`,
      priority: 'urgent'
    }),

    // Notify initiator
    Notification.createNotification({
      userId: userId,
      type: 'dispute_created',
      title: 'Dispute Submitted',
      message: `Your dispute for "${task.title}" has been submitted. Our team will review it shortly.`,
      taskId: task._id,
      disputeId: dispute._id,
      actionUrl: `/dispute/${dispute._id}`,
      priority: 'high'
    })
  ]);

  res.status(201).json({
    success: true,
    message: 'Dispute created successfully',
    data: dispute
  });
});

/**
 * @desc    Add message to dispute
 * @route   POST /api/disputes/:disputeId/messages
 * @access  Private
 */
export const addDisputeMessage = asyncHandler(async (req, res) => {
  const { disputeId } = req.params;
  const { message } = req.body;
  const { userId } = req.auth();

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  // Get dispute
  const dispute = await Dispute.findById(disputeId);
  if (!dispute) {
    return res.status(404).json({ success: false, message: 'Dispute not found' });
  }

  // Verify user is involved in the dispute
  if (dispute.initiatorId !== userId && dispute.respondentId !== userId) {
    return res.status(403).json({ success: false, message: 'You are not involved in this dispute' });
  }

  // Verify dispute is still open
  if (dispute.status !== 'open' && dispute.status !== 'under_review') {
    return res.status(400).json({ success: false, message: 'Cannot add messages to closed disputes' });
  }

  // Get sender details
  const { fullName } = await getClerkUser(userId);

  // Add message
  dispute.messages.push({
    senderId: userId,
    senderName: fullName,
    message,
    isAdminMessage: false,
    sentAt: new Date()
  });

  await dispute.save();

  // Notify the other party
  const otherPartyId = dispute.initiatorId === userId ? dispute.respondentId : dispute.initiatorId;
  await Notification.createNotification({
    userId: otherPartyId,
    type: 'dispute_created',
    title: 'New Dispute Message',
    message: `${fullName} sent a message in the dispute. Please respond.`,
    disputeId: dispute._id,
    actionUrl: `/dispute/${dispute._id}`,
    priority: 'medium'
  });

  res.json({
    success: true,
    message: 'Message added successfully',
    data: dispute
  });
});

/**
 * @desc    Resolve dispute (Admin only)
 * @route   PUT /api/disputes/:disputeId/resolve
 * @access  Private (Admin only)
 */
export const resolveDispute = asyncHandler(async (req, res) => {
  const { disputeId } = req.params;
  const { resolution, resolutionNotes, refundAmount } = req.body;
  const { userId } = req.auth();

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  // Get dispute with related payment and task
  const dispute = await Dispute.findById(disputeId)
    .populate('paymentId')
    .populate('taskId');

  if (!dispute) {
    return res.status(404).json({ success: false, message: 'Dispute not found' });
  }

  // For now, allow any authenticated user to resolve (in production, check for admin role)
  // TODO: Add proper admin role check
  // const adminUser = await User.findOne({ clerkId: userId, role: 'admin' });
  // if (!adminUser) {
  //   return res.status(403).json({ success: false, message: 'Admin access required' });
  // }

  const payment = dispute.paymentId;
  const task = dispute.taskId;

  // Verify dispute is not already resolved
  if (dispute.status === 'resolved' || dispute.status === 'closed') {
    return res.status(400).json({ success: false, message: 'Dispute is already resolved' });
  }

  // Update dispute
  dispute.status = 'resolved';
  dispute.resolution = resolution;
  dispute.resolutionNotes = resolutionNotes;
  dispute.adminId = userId;
  dispute.resolvedAt = new Date();
  dispute.refundAmount = refundAmount || 0;
  await dispute.save();

  // Apply resolution
  let paymentStatus = 'disputed';
  let taskStatus = task.status;

  switch (resolution) {
    case 'refund_client':
      paymentStatus = 'refunded';
      taskStatus = 'cancelled';
      payment.status = paymentStatus;
      payment.refundedAt = new Date();
      payment.refundReason = 'Dispute resolved in favor of client';
      break;

    case 'pay_freelancer':
      paymentStatus = 'released';
      taskStatus = 'completed';
      payment.status = paymentStatus;
      payment.releasedAt = new Date();
      task.completedAt = new Date();
      break;

    case 'partial_refund':
      paymentStatus = 'released';
      taskStatus = 'completed';
      payment.status = paymentStatus;
      payment.releasedAt = new Date();
      dispute.refundAmount = refundAmount;
      break;

    case 'no_action':
      // Keep current status
      break;
  }

  // Update payment and task
  await payment.save();
  task.status = taskStatus;
  await task.save();

  // Create notifications
  await Promise.all([
    // Notify initiator
    Notification.createNotification({
      userId: dispute.initiatorId,
      type: 'dispute_resolved',
      title: 'Dispute Resolved',
      message: `Your dispute for "${task.title}" has been resolved: ${resolution.replace('_', ' ')}`,
      taskId: task._id,
      disputeId: dispute._id,
      actionUrl: `/dispute/${dispute._id}`,
      priority: 'high'
    }),

    // Notify respondent
    Notification.createNotification({
      userId: dispute.respondentId,
      type: 'dispute_resolved',
      title: 'Dispute Resolved',
      message: `The dispute for "${task.title}" has been resolved: ${resolution.replace('_', ' ')}`,
      taskId: task._id,
      disputeId: dispute._id,
      actionUrl: `/dispute/${dispute._id}`,
      priority: 'high'
    })
  ]);

  res.json({
    success: true,
    message: 'Dispute resolved successfully',
    data: dispute
  });
});

/**
 * @desc    Get dispute details
 * @route   GET /api/disputes/:disputeId
 * @access  Private
 */
export const getDisputeDetails = asyncHandler(async (req, res) => {
  const { disputeId } = req.params;
  const { userId } = req.auth();

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const dispute = await Dispute.findById(disputeId)
    .populate('taskId', 'title description category')
    .populate('paymentId', 'amount serviceFee status');

  if (!dispute) {
    return res.status(404).json({ success: false, message: 'Dispute not found' });
  }

  // Verify user is involved in the dispute or is admin
  // TODO: Add admin role check
  if (dispute.initiatorId !== userId && dispute.respondentId !== userId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  res.json({
    success: true,
    data: dispute
  });
});

/**
 * @desc    Get disputes for user
 * @route   GET /api/disputes/my-disputes
 * @access  Private
 */
export const getMyDisputes = asyncHandler(async (req, res) => {
  const { userId } = req.auth();
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const { status, page = 1, limit = 10 } = req.query;

  const filter = {
    $or: [
      { initiatorId: userId },
      { respondentId: userId }
    ]
  };

  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const disputes = await Dispute.find(filter)
    .populate('taskId', 'title category')
    .populate('paymentId', 'amount status')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Dispute.countDocuments(filter);

  res.json({
    success: true,
    data: disputes,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

/**
 * @desc    Get all disputes (Admin only)
 * @route   GET /api/disputes
 * @access  Private (Admin only)
 */
export const getAllDisputes = asyncHandler(async (req, res) => {
  const { userId } = req.auth();
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  // TODO: Add proper admin role check
  // const adminUser = await User.findOne({ clerkId: userId, role: 'admin' });
  // if (!adminUser) {
  //   return res.status(403).json({ success: false, message: 'Admin access required' });
  // }

  const { status, priority, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const disputes = await Dispute.find(filter)
    .populate('taskId', 'title category')
    .populate('paymentId', 'amount status')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Dispute.countDocuments(filter);

  res.json({
    success: true,
    data: disputes,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

/**
 * @desc    Get dispute statistics
 * @route   GET /api/disputes/stats
 * @access  Public
 */
export const getDisputeStats = asyncHandler(async (req, res) => {
  const stats = await Dispute.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 }, avgAmount: { $avg: '$disputeAmount' } } }
  ]);

  const reasonStats = await Dispute.aggregate([
    { $group: { _id: '$reason', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const totalDisputes = await Dispute.countDocuments();

  res.json({
    success: true,
    data: {
      totalDisputes,
      statusBreakdown: stats,
      reasonBreakdown: reasonStats
    }
  });
});
