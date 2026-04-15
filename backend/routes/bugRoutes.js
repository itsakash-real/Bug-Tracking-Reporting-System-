const express = require('express');
const router = express.Router();
const {
  createBug, getBugs, getBugById, updateBug, deleteBug,
  addComment, deleteComment, getBugStats,
} = require('../controllers/bugController');
const { protect } = require('../middleware/authMiddleware');
const {
  createBugValidation,
  updateBugValidation,
  addCommentValidation,
  handleValidationErrors,
} = require('../validators/bugValidator');

// All bug routes require authentication
router.use(protect);

// @route  GET /api/bugs/stats — must be before /:id routes
router.get('/stats', getBugStats);

// @route  GET  /api/bugs
// @route  POST /api/bugs
router
  .route('/')
  .get(getBugs)
  .post(createBugValidation, handleValidationErrors, createBug);

// @route  GET    /api/bugs/:id
// @route  PUT    /api/bugs/:id
// @route  DELETE /api/bugs/:id
router
  .route('/:id')
  .get(getBugById)
  .put(updateBugValidation, handleValidationErrors, updateBug)
  .delete(deleteBug);

// @route  POST   /api/bugs/:id/comments
router.post('/:id/comments', addCommentValidation, handleValidationErrors, addComment);

// @route  DELETE /api/bugs/:id/comments/:commentId
router.delete('/:id/comments/:commentId', deleteComment);

module.exports = router;
