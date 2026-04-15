const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const {
  registerValidation,
  loginValidation,
  handleValidationErrors,
} = require('../validators/authValidator');

// @route  POST /api/auth/register
router.post('/register', registerValidation, handleValidationErrors, register);

// @route  POST /api/auth/login
router.post('/login', loginValidation, handleValidationErrors, login);

// @route  GET /api/auth/me
router.get('/me', protect, getMe);

// @route  PUT /api/auth/me
router.put('/me', protect, updateProfile);

module.exports = router;
