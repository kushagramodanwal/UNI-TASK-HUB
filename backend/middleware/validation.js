import { body, param, query, validationResult } from 'express-validator';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

/**
 * Validation rules for creating a task
 */
export const validateCreateTask = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('category')
    .isIn([
      'Academic Writing',
      'Programming',
      'Design',
      'Research',
      'Translation',
      'Data Analysis',
      'Presentation',
      'Other'
    ])
    .withMessage('Invalid category'),
  
  body('college')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('College name must be between 2 and 100 characters'),
  
  body('budget')
    .isFloat({ min: 1 })
    .withMessage('Budget must be a positive number'),
  
  body('deadline')
    .isISO8601()
    .withMessage('Deadline must be a valid date')
    .custom((value) => {
      const deadline = new Date(value);
      const now = new Date();
      // Allow deadline to be set for today (remove time comparison)
      if (deadline < now.setHours(0, 0, 0, 0)) {
        throw new Error('Deadline must be today or in the future');
      }
      return true;
    }),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  
  body('requirements')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Requirements cannot exceed 500 characters'),
  
  handleValidationErrors
];

/**
 * Validation rules for updating a task
 */
export const validateUpdateTask = [
  param('id')
    .isMongoId()
    .withMessage('Invalid task ID'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('category')
    .optional()
    .isIn([
      'Academic Writing',
      'Programming',
      'Design',
      'Research',
      'Translation',
      'Data Analysis',
      'Presentation',
      'Other'
    ])
    .withMessage('Invalid category'),
  
  body('college')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('College name must be between 2 and 100 characters'),
  
  body('budget')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Budget must be a positive number'),
  
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    }),
  
  body('status')
    .optional()
    .isIn(['open', 'in-progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  
  handleValidationErrors
];

/**
 * Validation rules for creating a review
 */
export const validateCreateReview = [
  body('taskId')
    .isMongoId()
    .withMessage('Invalid task ID'),
  
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Comment must be between 10 and 500 characters'),
  
  handleValidationErrors
];

/**
 * Validation rules for updating a review
 */
export const validateUpdateReview = [
  param('id')
    .isMongoId()
    .withMessage('Invalid review ID'),
  
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Comment must be between 10 and 500 characters'),
  
  handleValidationErrors
];

/**
 * Validation rules for task queries
 */
export const validateTaskQueries = [
  query('category')
    .optional()
    .isIn([
      'Academic Writing',
      'Programming',
      'Design',
      'Research',
      'Translation',
      'Data Analysis',
      'Presentation',
      'Other'
    ])
    .withMessage('Invalid category'),
  
  query('status')
    .optional()
    .isIn(['open', 'in-progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  
  query('minBudget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min budget must be a positive number'),
  
  query('maxBudget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max budget must be a positive number'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  handleValidationErrors
];

/**
 * Validation rules for MongoDB ObjectId parameters
 */
export const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  handleValidationErrors
];

// Alias for backwards compatibility
export const validateObjectIdParam = validateObjectId();

// Bid validation rules
export const validateCreateBid = [
  body('taskId')
    .notEmpty()
    .withMessage('Task ID is required')
    .isMongoId()
    .withMessage('Invalid task ID'),
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be a number greater than 0'),
  body('proposal')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Proposal must be between 10 and 1000 characters'),
  body('deliveryTime')
    .isInt({ min: 1, max: 365 })
    .withMessage('Delivery time must be between 1 and 365 days'),
  body('phone')
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10 and 15 characters'),
  handleValidationErrors
];

export const validateUpdateBid = [
  body('amount')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Amount must be a number greater than 0'),
  body('proposal')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Proposal must be between 10 and 1000 characters'),
  body('deliveryTime')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Delivery time must be between 1 and 365 days'),
  handleValidationErrors
];

// Alias for backwards compatibility
const validateRequest = handleValidationErrors;
