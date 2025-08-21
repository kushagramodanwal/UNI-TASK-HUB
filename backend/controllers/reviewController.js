import Review from '../models/Review.js';
import Task from '../models/Task.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * @desc    Create a new review
 * @route   POST /api/reviews
 * @access  Private
 */
export const createReview = asyncHandler(async (req, res) => {
  const { taskId, rating, comment } = req.body;

  // Check if task exists
  const task = await Task.findById(taskId);
  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Check if user is trying to review their own task
  if (task.userId === req.user.id) {
    return res.status(400).json({
      success: false,
      message: 'Cannot review your own task'
    });
  }

  // Check if user has already reviewed this task
  const existingReview = await Review.findOne({
    taskId,
    reviewerId: req.user.id
  });

  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'You have already reviewed this task'
    });
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

  // Populate task information
  await review.populate('taskId', 'title category');

  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    data: review
  });
});

/**
 * @desc    Get all reviews with pagination
 * @route   GET /api/reviews
 * @access  Public
 */
export const getReviews = asyncHandler(async (req, res) => {
  const {
    taskId,
    rating,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter = {};

  if (taskId) filter.taskId = taskId;
  if (rating) filter.rating = parseInt(rating);

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  // Execute query with task population
  const reviews = await Review.find(filter)
    .populate('taskId', 'title category budget')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Get total count for pagination
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

/**
 * @desc    Get single review by ID
 * @route   GET /api/reviews/:id
 * @access  Public
 */
export const getReviewById = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id)
    .populate('taskId', 'title category budget description');

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  res.json({
    success: true,
    data: review
  });
});

/**
 * @desc    Get reviews by the logged-in user
 * @route   GET /api/reviews/my-reviews
 * @access  Private
 */
export const getMyReviews = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  // Execute query
  const reviews = await Review.find({ reviewerId: req.user.id })
    .populate('taskId', 'title category budget')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Get total count for pagination
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

/**
 * @desc    Update a review
 * @route   PUT /api/reviews/:id
 * @access  Private (reviewer only)
 */
export const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Check ownership
  if (review.reviewerId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only update your own reviews.'
    });
  }

  // Update review
  const updatedReview = await Review.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('taskId', 'title category budget');

  res.json({
    success: true,
    message: 'Review updated successfully',
    data: updatedReview
  });
});

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private (reviewer only)
 */
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Check ownership
  if (review.reviewerId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only delete your own reviews.'
    });
  }

  await Review.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
});

/**
 * @desc    Get review statistics
 * @route   GET /api/reviews/stats
 * @access  Public
 */
export const getReviewStats = asyncHandler(async (req, res) => {
  const stats = await Review.aggregate([
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const totalReviews = await Review.countDocuments();
  const averageRating = await Review.aggregate([
    { $group: { _id: null, avg: { $avg: '$rating' } } }
  ]);

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
