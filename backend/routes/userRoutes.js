const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All user routes require authentication
router.use(protect);

// @route  GET /api/users — all authenticated users can list users (for assignment)
router.get('/', getUsers);

// @route  GET /api/users/:id
router.get('/:id', getUserById);

// @route  PUT /api/users/:id — Admin only
router.put('/:id', authorize('Admin'), updateUser);

// @route  DELETE /api/users/:id — Admin only
router.delete('/:id', authorize('Admin'), deleteUser);

module.exports = router;
