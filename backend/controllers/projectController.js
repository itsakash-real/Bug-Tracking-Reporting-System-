const Project = require('../models/Project');
const User = require('../models/User');

/**
 * @desc   Create a new project (Admin only — the creator becomes the first member)
 * @route  POST /api/projects
 * @access Private (Admin)
 */
const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description: description || '',
      createdBy: req.user._id,
      members: [req.user._id],
    });

    // Assign the creator to this project
    await User.findByIdAndUpdate(req.user._id, { projectId: project._id });

    // Re-fetch with populated fields
    const populated = await Project.findById(project._id)
      .populate('createdBy', 'name email role')
      .populate('members', 'name email role');

    res.status(201).json({ success: true, project: populated });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ success: false, message: 'Server error creating project' });
  }
};

/**
 * @desc   Get the current user's project details
 * @route  GET /api/projects/mine
 * @access Private
 */
const getMyProject = async (req, res) => {
  try {
    if (!req.user.projectId) {
      return res.status(404).json({ success: false, message: 'You are not part of any project' });
    }

    const project = await Project.findById(req.user.projectId)
      .populate('createdBy', 'name email role')
      .populate('members', 'name email role');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.status(200).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching project' });
  }
};

/**
 * @desc   Join a project via invite code
 * @route  POST /api/projects/join
 * @access Private
 */
const joinProject = async (req, res) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ success: false, message: 'Invite code is required' });
    }

    const project = await Project.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Invalid invite code — no project found' });
    }

    // Check if already a member
    if (project.members.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You are already a member of this project' });
    }

    // Check if user already belongs to another project
    if (req.user.projectId && req.user.projectId.toString() !== project._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You already belong to another project. Leave it first to join a new one.',
      });
    }

    // Add user to project members
    project.members.push(req.user._id);
    await project.save();

    // Update user's projectId
    await User.findByIdAndUpdate(req.user._id, { projectId: project._id });

    const populated = await Project.findById(project._id)
      .populate('createdBy', 'name email role')
      .populate('members', 'name email role');

    res.status(200).json({
      success: true,
      message: `Successfully joined project "${project.name}"`,
      project: populated,
    });
  } catch (error) {
    console.error('Join project error:', error);
    res.status(500).json({ success: false, message: 'Server error joining project' });
  }
};

/**
 * @desc   Regenerate invite code (Admin only - project owner)
 * @route  PUT /api/projects/regenerate-invite
 * @access Private (Admin, project owner)
 */
const regenerateInviteCode = async (req, res) => {
  try {
    const project = await Project.findById(req.user.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the project owner can regenerate the invite code' });
    }

    const crypto = require('crypto');
    project.inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    await project.save();

    res.status(200).json({ success: true, inviteCode: project.inviteCode });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error regenerating invite code' });
  }
};

/**
 * @desc   Remove a member from the project (Admin only)
 * @route  DELETE /api/projects/members/:userId
 * @access Private (Admin)
 */
const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.user.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const userId = req.params.userId;

    // Cannot remove yourself
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot remove yourself from the project' });
    }

    // Cannot remove the project creator
    if (userId === project.createdBy.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot remove the project owner' });
    }

    project.members = project.members.filter(m => m.toString() !== userId);
    await project.save();

    // Clear the user's projectId
    await User.findByIdAndUpdate(userId, { projectId: null });

    res.status(200).json({ success: true, message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error removing member' });
  }
};

module.exports = { createProject, getMyProject, joinProject, regenerateInviteCode, removeMember };
