const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');

/**
 * Generate a signed JWT token for a given user ID
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * @desc   Register a new user
 * @route  POST /api/auth/register
 * @access Public
 *
 * Flow:
 *   - Admin with no inviteCode → registers, creates project later from the UI
 *   - Anyone with an inviteCode → joins that project automatically
 *   - Dev/Tester without inviteCode → registers without a project (must join later)
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role, inviteCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    let projectId = null;

    // If invite code provided, validate it and get the project
    if (inviteCode) {
      const project = await Project.findOne({ inviteCode: inviteCode.toUpperCase() });
      if (!project) {
        return res.status(400).json({
          success: false,
          message: 'Invalid invite code — no project found',
        });
      }
      projectId = project._id;
    }

    const user = await User.create({ name, email, password, role, projectId });
    const token = generateToken(user._id);

    // If the user has a project, add them to the project's members array
    if (projectId) {
      await Project.findByIdAndUpdate(projectId, { $addToSet: { members: user._id } });
    }

    // Console-based "email notification" (mock)
    console.log(`📧 [EMAIL MOCK] Welcome email sent to: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        projectId: user.projectId,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

/**
 * @desc   Login user
 * @route  POST /api/auth/login
 * @access Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Include password explicitly (it's excluded by default via select:false)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact an admin.',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        projectId: user.projectId,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

/**
 * @desc   Get currently logged-in user profile
 * @route  GET /api/auth/me
 * @access Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('projectId', 'name inviteCode');
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc   Update logged-in user's profile (name, avatar)
 * @route  PUT /api/auth/me
 * @access Private
 */
const updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (avatar) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { register, login, getMe, updateProfile };
