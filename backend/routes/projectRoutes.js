const express = require('express');
const router = express.Router();
const {
  createProject,
  getMyProject,
  joinProject,
  regenerateInviteCode,
  removeMember,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All project routes require authentication
router.use(protect);

// @route  GET /api/projects/mine — get current user's project
router.get('/mine', getMyProject);

// @route  POST /api/projects — create a new project (Admin only)
router.post('/', authorize('Admin'), createProject);

// @route  POST /api/projects/join — join a project via invite code
router.post('/join', joinProject);

// @route  PUT /api/projects/regenerate-invite — regen invite code (Admin)
router.put('/regenerate-invite', authorize('Admin'), regenerateInviteCode);

// @route  DELETE /api/projects/members/:userId — remove member (Admin)
router.delete('/members/:userId', authorize('Admin'), removeMember);

module.exports = router;
