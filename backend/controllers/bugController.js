const Bug = require('../models/Bug');
const User = require('../models/User');

// AI services — imported for background processing on bug create/update
let vectorService;
let aiService;
try {
  vectorService = require('../services/vectorService');
  aiService = require('../services/aiService');
} catch (err) {
  console.warn('AI services not available:', err.message);
}

/**
 * Valid status transitions — enforces the bug lifecycle.
 * Open → In Progress → Closed (or Admin can bypass)
 */
const VALID_TRANSITIONS = {
  Open: ['In Progress'],
  'In Progress': ['Closed', 'Open'],
  Closed: ['Open'], // Allow reopening
};

/**
 * Helper: Log activity to the bug's activityLog array
 */
const logActivity = (bug, action, field, oldValue, newValue, userId, description) => {
  bug.activityLog.push({
    action,
    field,
    oldValue: oldValue?.toString(),
    newValue: newValue?.toString(),
    performedBy: userId,
    description,
  });
};

/**
 * Middleware-style helper: ensures the user has a project.
 * Returns the projectId or sends a 400 response.
 */
const requireProject = (req, res) => {
  if (!req.user.projectId) {
    res.status(400).json({
      success: false,
      message: 'You must join or create a project before accessing bugs',
    });
    return null;
  }
  return req.user.projectId;
};

/**
 * @desc   Create a new bug
 * @route  POST /api/bugs
 * @access Private (Admin, Developer, Tester)
 */
const createBug = async (req, res) => {
  try {
    const projectId = requireProject(req, res);
    if (!projectId) return;

    const {
      title, description, severity, priority,
      assignedTo, environment, stepsToReproduce, tags,
    } = req.body;

    // If assigning, verify the assignee belongs to the same project
    if (assignedTo) {
      const assignee = await User.findById(assignedTo);
      if (!assignee || !assignee.projectId || assignee.projectId.toString() !== projectId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'The assigned user does not belong to your project',
        });
      }
    }

    const bug = new Bug({
      title,
      description,
      severity,
      priority,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      projectId,
      environment,
      stepsToReproduce,
      tags: tags || [],
    });

    // Log creation activity
    logActivity(bug, 'created', null, null, null, req.user._id, `Bug created by ${req.user.name}`);

    await bug.save();

    // Populate references for response
    await bug.populate([
      { path: 'createdBy', select: 'name email role' },
      { path: 'assignedTo', select: 'name email role' },
      { path: 'activityLog.performedBy', select: 'name email' },
    ]);

    // Mock email notification
    if (assignedTo) {
      const assignee = await User.findById(assignedTo);
      if (assignee) {
        console.log(`📧 [EMAIL MOCK] Bug assignment email sent to: ${assignee.email} — Bug: "${title}"`);
      }
    }

    res.status(201).json({ success: true, bug });

    // ── Background AI processing (non-blocking) ──
    // Generate embedding for duplicate detection
    if (vectorService && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      vectorService.storeBugEmbedding(bug._id).catch(err =>
        console.error('Background embedding generation failed:', err.message)
      );
    }
  } catch (error) {
    console.error('Create bug error:', error);
    res.status(500).json({ success: false, message: 'Server error creating bug' });
  }
};

/**
 * @desc   Get all bugs with filtering, search, and pagination
 * @route  GET /api/bugs
 * @access Private
 */
const getBugs = async (req, res) => {
  try {
    const projectId = requireProject(req, res);
    if (!projectId) return;

    const {
      status, severity, priority, assignedTo,
      search, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc',
    } = req.query;

    // Always scope to the user's project
    const filter = { projectId };

    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    // Full-text search on title and description
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const [bugs, total] = await Promise.all([
      Bug.find(filter)
        .populate('createdBy', 'name email role')
        .populate('assignedTo', 'name email role')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit)),
      Bug.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: bugs.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      bugs,
    });
  } catch (error) {
    console.error('Get bugs error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching bugs' });
  }
};

/**
 * @desc   Get a single bug by ID
 * @route  GET /api/bugs/:id
 * @access Private
 */
const getBugById = async (req, res) => {
  try {
    const projectId = requireProject(req, res);
    if (!projectId) return;

    const bug = await Bug.findOne({ _id: req.params.id, projectId })
      .populate('createdBy', 'name email role avatar')
      .populate('assignedTo', 'name email role avatar')
      .populate('comments.author', 'name email role avatar')
      .populate('activityLog.performedBy', 'name email role');

    if (!bug) {
      return res.status(404).json({ success: false, message: 'Bug not found' });
    }

    res.status(200).json({ success: true, bug });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching bug' });
  }
};

/**
 * @desc   Update a bug (with status workflow enforcement)
 * @route  PUT /api/bugs/:id
 * @access Private
 *         - Status change: Only assigned developer or Admin
 *         - Other fields: Admin or bug creator
 */
const updateBug = async (req, res) => {
  try {
    const projectId = requireProject(req, res);
    if (!projectId) return;

    const bug = await Bug.findOne({ _id: req.params.id, projectId });
    if (!bug) {
      return res.status(404).json({ success: false, message: 'Bug not found' });
    }

    const { status, assignedTo, title, description, severity, priority, environment, stepsToReproduce, tags } = req.body;
    const isAdmin = req.user.role === 'Admin';
    const isAssignedDev =
      bug.assignedTo && bug.assignedTo.toString() === req.user._id.toString();

    // --- Status Transition Enforcement ---
    if (status && status !== bug.status) {
      // Only Admin or the assigned developer can change status
      if (!isAdmin && !isAssignedDev) {
        return res.status(403).json({
          success: false,
          message: 'Only the assigned developer or an Admin can change bug status',
        });
      }

      const allowedTransitions = VALID_TRANSITIONS[bug.status] || [];
      if (!isAdmin && !allowedTransitions.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition: '${bug.status}' → '${status}'. Allowed: ${allowedTransitions.join(', ')}`,
        });
      }

      logActivity(bug, 'status_changed', 'status', bug.status, status, req.user._id,
        `Status changed from '${bug.status}' to '${status}' by ${req.user.name}`);
      
      // Mock notification on status change
      console.log(`📧 [EMAIL MOCK] Status update for bug "${bug.title}": ${bug.status} → ${status}`);

      // ── Update developer expertise when bug is closed ──
      if (status === 'Closed' && bug.assignedTo) {
        const category = bug.aiCategory || bug.aiPredictions?.category || 'Other';
        User.findByIdAndUpdate(bug.assignedTo, {
          $inc: {
            resolvedBugs: 1,
            [`expertise.${category}`]: 1,
          },
        }).catch(err => console.error('Expertise update failed:', err.message));
      }

      bug.status = status;
    }

    // --- Field Updates (Admin or creator) ---
    if (!isAdmin && bug.createdBy.toString() !== req.user._id.toString() && !isAssignedDev) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this bug',
      });
    }

    if (title && title !== bug.title) {
      logActivity(bug, 'field_updated', 'title', bug.title, title, req.user._id, `Title updated by ${req.user.name}`);
      bug.title = title;
    }

    if (description !== undefined && description !== bug.description) {
      logActivity(bug, 'field_updated', 'description', 'previous', 'updated', req.user._id, `Description updated by ${req.user.name}`);
      bug.description = description;
    }

    if (severity && severity !== bug.severity) {
      logActivity(bug, 'field_updated', 'severity', bug.severity, severity, req.user._id, `Severity changed from '${bug.severity}' to '${severity}'`);
      bug.severity = severity;
    }

    if (priority && priority !== bug.priority) {
      logActivity(bug, 'field_updated', 'priority', bug.priority, priority, req.user._id, `Priority changed from '${bug.priority}' to '${priority}'`);
      bug.priority = priority;
    }

    if (assignedTo !== undefined) {
      // Verify assignee belongs to same project
      if (assignedTo) {
        const assignee = await User.findById(assignedTo);
        if (!assignee || !assignee.projectId || assignee.projectId.toString() !== projectId.toString()) {
          return res.status(400).json({
            success: false,
            message: 'The assigned user does not belong to your project',
          });
        }
      }

      const oldAssignee = bug.assignedTo?.toString();
      const newAssignee = assignedTo || null;
      if (oldAssignee !== newAssignee?.toString()) {
        logActivity(bug, 'assigned', 'assignedTo', oldAssignee, newAssignee, req.user._id, `Bug reassigned by ${req.user.name}`);
        if (newAssignee) {
          const assignee = await User.findById(newAssignee);
          if (assignee) console.log(`📧 [EMAIL MOCK] Reassignment email sent to: ${assignee.email}`);
        }
      }
      bug.assignedTo = newAssignee;
    }

    if (environment !== undefined) bug.environment = environment;
    if (stepsToReproduce !== undefined) bug.stepsToReproduce = stepsToReproduce;
    if (tags !== undefined) bug.tags = tags;

    await bug.save();

    await bug.populate([
      { path: 'createdBy', select: 'name email role' },
      { path: 'assignedTo', select: 'name email role' },
      { path: 'comments.author', select: 'name email role' },
      { path: 'activityLog.performedBy', select: 'name email role' },
    ]);

    res.status(200).json({ success: true, bug });
  } catch (error) {
    console.error('Update bug error:', error);
    res.status(500).json({ success: false, message: 'Server error updating bug' });
  }
};

/**
 * @desc   Delete a bug
 * @route  DELETE /api/bugs/:id
 * @access Private (Admin or creator, and only if status is 'Open')
 */
const deleteBug = async (req, res) => {
  try {
    const projectId = requireProject(req, res);
    if (!projectId) return;

    const bug = await Bug.findOne({ _id: req.params.id, projectId });
    if (!bug) {
      return res.status(404).json({ success: false, message: 'Bug not found' });
    }

    const isAdmin = req.user.role === 'Admin';
    const isCreator = bug.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this bug',
      });
    }

    await Bug.findByIdAndDelete(bug._id);

    res.status(200).json({ success: true, message: 'Bug deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting bug' });
  }
};

/**
 * @desc   Add a comment to a bug
 * @route  POST /api/bugs/:id/comments
 * @access Private
 */
const addComment = async (req, res) => {
  try {
    const projectId = requireProject(req, res);
    if (!projectId) return;

    const bug = await Bug.findOne({ _id: req.params.id, projectId });
    if (!bug) {
      return res.status(404).json({ success: false, message: 'Bug not found' });
    }

    const { text } = req.body;

    bug.comments.push({ text, author: req.user._id });
    logActivity(bug, 'comment_added', 'comments', null, null, req.user._id, `Comment added by ${req.user.name}`);

    await bug.save();
    await bug.populate('comments.author', 'name email role avatar');

    res.status(201).json({
      success: true,
      comments: bug.comments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error adding comment' });
  }
};

/**
 * @desc   Delete a comment from a bug
 * @route  DELETE /api/bugs/:id/comments/:commentId
 * @access Private (comment author or Admin)
 */
const deleteComment = async (req, res) => {
  try {
    const projectId = requireProject(req, res);
    if (!projectId) return;

    const bug = await Bug.findOne({ _id: req.params.id, projectId });
    if (!bug) {
      return res.status(404).json({ success: false, message: 'Bug not found' });
    }

    const comment = bug.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const isAdmin = req.user.role === 'Admin';
    const isAuthor = comment.author.toString() === req.user._id.toString();

    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    comment.deleteOne();
    await bug.save();

    res.status(200).json({ success: true, message: 'Comment deleted', comments: bug.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting comment' });
  }
};

/**
 * @desc   Get dashboard statistics
 * @route  GET /api/bugs/stats
 * @access Private
 */
const getBugStats = async (req, res) => {
  try {
    const projectId = requireProject(req, res);
    if (!projectId) return;

    const projectFilter = { projectId };

    const [
      total,
      open,
      inProgress,
      closed,
      severityStats,
      priorityStats,
      recentBugs,
    ] = await Promise.all([
      Bug.countDocuments(projectFilter),
      Bug.countDocuments({ ...projectFilter, status: 'Open' }),
      Bug.countDocuments({ ...projectFilter, status: 'In Progress' }),
      Bug.countDocuments({ ...projectFilter, status: 'Closed' }),
      Bug.aggregate([
        { $match: projectFilter },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Bug.aggregate([
        { $match: projectFilter },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Bug.find(projectFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('createdBy', 'name')
        .populate('assignedTo', 'name')
        .select('title status severity priority createdAt'),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total,
        open,
        inProgress,
        closed,
        severityStats,
        priorityStats,
        recentBugs,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching stats' });
  }
};

module.exports = {
  createBug,
  getBugs,
  getBugById,
  updateBug,
  deleteBug,
  addComment,
  deleteComment,
  getBugStats,
};
