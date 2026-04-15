const User = require('../models/User');

/**
 * @desc   Get all users in the same project (for assignment dropdown, user list)
 * @route  GET /api/users
 * @access Private
 */
const getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;

    // Scope users to the same project
    const filter = { isActive: true };
    if (req.user.projectId) {
      filter.projectId = req.user.projectId;
    }
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).select('-password').sort({ name: 1 });

    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
};

/**
 * @desc   Get a single user by ID (must be same project)
 * @route  GET /api/users/:id
 * @access Private
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Ensure same project
    if (req.user.projectId && user.projectId?.toString() !== req.user.projectId.toString()) {
      return res.status(403).json({ success: false, message: 'User is not in your project' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching user' });
  }
};

/**
 * @desc   Update a user's role or active status (Admin only, same project)
 * @route  PUT /api/users/:id
 * @access Private (Admin)
 */
const updateUser = async (req, res) => {
  try {
    const { role, isActive } = req.body;
    const updates = {};
    if (role) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;

    // Prevent admin from deactivating themselves
    if (req.params.id === req.user._id.toString() && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account',
      });
    }

    // Ensure target user is in the same project
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (req.user.projectId && targetUser.projectId?.toString() !== req.user.projectId.toString()) {
      return res.status(403).json({ success: false, message: 'User is not in your project' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating user' });
  }
};

/**
 * @desc   Delete a user (Admin only, cannot delete self)
 * @route  DELETE /api/users/:id
 * @access Private (Admin)
 */
const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    // Ensure target user is in the same project
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (req.user.projectId && targetUser.projectId?.toString() !== req.user.projectId.toString()) {
      return res.status(403).json({ success: false, message: 'User is not in your project' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting user' });
  }
};

module.exports = { getUsers, getUserById, updateUser, deleteUser };
