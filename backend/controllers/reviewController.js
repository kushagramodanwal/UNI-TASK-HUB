import Review from '../models/Review.js';
import Task from '../models/Task.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const createReview = asyncHandler(async (req, res) => {
  const { taskId, rating, comment } = req.body;

  const task = await Task.findById(taskId);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  if (task.userId === req.user.id) {
    return res.status(400).json({ success: false, message: 'Cannot review your own task' });
  }

  const existingReview = await Review.findOne({ taskId, reviewerId: req.user.id });
  if (existingReview) {
    return res.status(400).json({ success: false, message: 'You have already reviewed this task' });
  }

  const review = await Review.create({
    taskId,
    rating,
    comment,
    reviewerId: req.user.id,
    reviewerEmail: req.user.email,
    reviewerName: req.user.fullName,
    reviewerImage: req.user.imageUrl
  });

  await review.populate('taskId', 'title category');

  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    data: review
  });
});

export const getReviews = asyncHandler(async (req, res) => {
  const { taskId, rating, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  const filter = {};
  if (taskId) filter.taskId = taskId;
  if (rating) filter.rating = parseInt(rating);

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const reviews = await Review.find(filter)
    .populate('taskId', 'title category budget')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Review.countDocuments(filter);

  res.json({
    success: true,
    data: reviews,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

export const getReviewById = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id).populate('taskId', 'title category budget description');

  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  res.json({ success: true, data: review });
});

export const getMyReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  const reviews = await Review.find({ reviewerId: req.user.id })
    .populate('taskId', 'title category budget')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Review.countDocuments({ reviewerId: req.user.id });

  res.json({
    success: true,
    data: reviews,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

export const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  if (review.reviewerId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Access denied. You can only update your own reviews.' });
  }

  const updatedReview = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('taskId', 'title category budget');

  res.json({
    success: true,
    message: 'Review updated successfully',
    data: updatedReview
  });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  if (review.reviewerId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Access denied. You can only delete your own reviews.' });
  }

  await Review.findByIdAndDelete(req.params.id);

  res.json({ success: true, message: 'Review deleted successfully' });
});

export const getReviewStats = asyncHandler(async (req, res) => {
  const stats = await Review.aggregate([
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  const totalReviews = await Review.countDocuments();
  const averageRating = await Review.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]);

  const recentReviews = await Review.find()
    .populate('taskId', 'title category')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  res.json({
    success: true,
    data: {
      totalReviews,
      averageRating: averageRating[0]?.avg || 0,
      ratingBreakdown: stats,
      recentReviews
    }
  });
});
