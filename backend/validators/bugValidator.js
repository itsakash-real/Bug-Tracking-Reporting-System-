const { body, validationResult } = require('express-validator');

/**
 * Validation rules for creating a bug
 */
const createBugValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Bug title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required'),

  body('severity')
    .notEmpty().withMessage('Severity is required')
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Severity must be Low, Medium, High, or Critical'),

  body('priority')
    .notEmpty().withMessage('Priority is required')
    .isIn(['P1', 'P2', 'P3', 'P4'])
    .withMessage('Priority must be P1, P2, P3, or P4'),

  body('assignedTo')
    .optional({ nullable: true })
    .isMongoId().withMessage('assignedTo must be a valid user ID'),

  body('environment')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Environment cannot exceed 200 characters'),
];

/**
 * Validation rules for updating a bug
 */
const updateBugValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Title cannot be empty')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

  body('severity')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Invalid severity value'),

  body('priority')
    .optional()
    .isIn(['P1', 'P2', 'P3', 'P4'])
    .withMessage('Invalid priority value'),

  body('status')
    .optional()
    .isIn(['Open', 'In Progress', 'Closed'])
    .withMessage('Status must be Open, In Progress, or Closed'),

  body('assignedTo')
    .optional({ nullable: true })
    .isMongoId().withMessage('assignedTo must be a valid user ID'),
];

/**
 * Validation rules for adding a comment
 */
const addCommentValidation = [
  body('text')
    .trim()
    .notEmpty().withMessage('Comment text is required')
    .isLength({ max: 2000 }).withMessage('Comment cannot exceed 2000 characters'),
];

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = {
  createBugValidation,
  updateBugValidation,
  addCommentValidation,
  handleValidationErrors,
};
