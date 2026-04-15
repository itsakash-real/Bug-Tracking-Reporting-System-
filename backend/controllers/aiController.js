const Bug = require('../models/Bug');
const User = require('../models/User');
const AIFeedback = require('../models/AIFeedback');
const aiService = require('../services/aiService');
const vectorService = require('../services/vectorService');
const { getCache, setCache } = require('../middleware/aiCache');

/**
 * Helper: requireProject — ensures user belongs to a project.
 */
const requireProject = (req, res) => {
  if (!req.user.projectId) {
    res.status(400).json({
      success: false,
      message: 'You must join or create a project before using AI features',
    });
    return null;
  }
  return req.user.projectId;
};

/**
 * @desc   Classify a bug into a category (UI/Backend/Performance/Security/etc.)
 * @route  POST /api/ai/classify-bug
 * @access Private
 *
 * Request body: { title, description, stepsToReproduce? }
 * Response: { category, confidence, reasoning, keywords }
 */
const classifyBug = async (req, res) => {
  try {
    const projectId = requireProject(req, res);
    if (!projectId) return;

    const { title, description, stepsToReproduce } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required',
      });
    }

    // Check cache
    const cacheKey = `classify:${title}:${description}`.substring(0, 200);
    const cached = getCache(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, cached: true, ...cached });
    }

    const result = await aiService.classifyBug(title, description, stepsToReproduce);

    // Cache for 10 minutes
    setCache(cacheKey, result, 600);

    res.status(200).json({ success: true, cached: false, ...result });
  } catch (error) {
    console.error('AI classify error:', error);
    res.status(500).json({
      success: false,
      message: 'AI classification failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc   Detect duplicate bugs using semantic similarity
 * @route  POST /api/ai/detect-duplicate
 * @access Private
 *
 * Request body: { title, description, excludeBugId? }
 * Response: { isDuplicate, duplicates: [{ bugId, title, similarity, ... }] }
 */
const detectDuplicate = async (req, res) => {
  try {
    const projectId = requireProject(req, res);
    if (!projectId) return;

    const { title, description, excludeBugId } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required',
      });
    }

    const result = await vectorService.findDuplicates(
      title,
      description,
      projectId,
      { excludeBugId, threshold: 0.70, limit: 5 }
    );

    // Don't return the raw embedding vector to the client
    const { embedding, ...response } = result;

    res.status(200).json({ success: true, ...response });
  } catch (error) {
    console.error('AI duplicate detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Duplicate detection failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc   Predict severity and priority for a bug
 * @route  POST /api/ai/predict-priority
 * @access Private
 *
 * Request body: { title, description, stepsToReproduce?, environment? }
 * Response: { severity, priority, confidence, reasoning, factors }
 */
const predictPriority = async (req, res) => {
  try {
    const projectId = requireProject(req, res);
    if (!projectId) return;

    const { title, description, stepsToReproduce, environment } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required',
      });
    }

    // Check cache
    const cacheKey = `priority:${title}:${description}`.substring(0, 200);
    const cached = getCache(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, cached: true, ...cached });
    }

    const result = await aiService.predictPriority(title, description, stepsToReproduce, environment);

    setCache(cacheKey, result, 600);

    res.status(200).json({ success: true, cached: false, ...result });
  } catch (error) {
    console.error('AI priority prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Priority prediction failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc   Summarize a bug report
 * @route  POST /api/ai/summarize
 * @access Private
 *
 * Request body: { title, description, stepsToReproduce?, comments? }
 *   — OR — { bugId } (to summarize an existing bug)
 * Response: { summary, impact, suggestedAction }
 */
const summarizeBug = async (req, res) => {
  try {
    const projectId = requireProject(req, res);
    if (!projectId) return;

    let { title, description, stepsToReproduce, comments, bugId } = req.body;

    // If bugId provided, load the bug data
    if (bugId) {
      const bug = await Bug.findOne({ _id: bugId, projectId })
        .populate('comments.author', 'name');
      if (!bug) {
        return res.status(404).json({ success: false, message: 'Bug not found' });
      }
      title = bug.title;
      description = bug.description;
      stepsToReproduce = bug.stepsToReproduce;
      comments = bug.comments.map(c => ({
        text: c.text,
        author: c.author?.name || 'Unknown',
      }));
    }

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required (or provide bugId)',
      });
    }

    const cacheKey = `summary:${bugId || title}:${description}`.substring(0, 200);
    const cached = getCache(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, cached: true, ...cached });
    }

    const result = await aiService.summarizeBug(title, description, stepsToReproduce, comments);

    setCache(cacheKey, result, 600);

    // If bugId was provided, also save the summary to the bug document
    if (bugId) {
      await Bug.findByIdAndUpdate(bugId, {
        'aiPredictions.summary': result.summary,
      });
    }

    res.status(200).json({ success: true, cached: false, ...result });
  } catch (error) {
    console.error('AI summarize error:', error);
    res.status(500).json({
      success: false,
      message: 'Summarization failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc   Get auto-assignment suggestion for a bug
 * @route  POST /api/ai/suggestions
 * @access Private
 *
 * Request body: { title, description, category? }
 * Response: { suggestedDeveloperId, developerName, confidence, reasoning }
 */
const getAssignmentSuggestion = async (req, res) => {
  try {
    const projectId = requireProject(req, res);
    if (!projectId) return;

    const { title, description, category } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required',
      });
    }

    // Get all developers in this project
    const developers = await User.find({
      projectId,
      role: 'Developer',
      isActive: true,
    }).select('name expertise resolvedBugs').lean();

    // Enrich developer profiles with resolved bug counts
    for (const dev of developers) {
      dev.resolvedBugs = await Bug.countDocuments({
        assignedTo: dev._id,
        status: 'Closed',
      });
    }

    const result = await aiService.suggestAssignment(
      title, description, category, developers
    );

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('AI assignment suggestion error:', error);
    res.status(500).json({
      success: false,
      message: 'Assignment suggestion failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc   Full AI analysis — classification + priority + summary + duplicates
 * @route  POST /api/ai/analyze
 * @access Private
 *
 * This is the main endpoint called during bug creation for real-time AI insights.
 * Runs all AI modules in parallel for speed.
 *
 * Request body: { title, description, stepsToReproduce?, environment? }
 */
const fullAnalysis = async (req, res) => {
  try {
    const projectId = requireProject(req, res);
    if (!projectId) return;

    const { title, description, stepsToReproduce, environment } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required',
      });
    }

    // Run all AI operations in parallel
    const [analysis, duplicateResult] = await Promise.all([
      aiService.fullAnalysis(title, description, stepsToReproduce, environment),
      vectorService.findDuplicates(title, description, projectId, { threshold: 0.70, limit: 3 }),
    ]);

    // Get assignment suggestion using the classification
    let assignment = null;
    try {
      const developers = await User.find({
        projectId,
        role: 'Developer',
        isActive: true,
      }).select('name expertise resolvedBugs').lean();

      for (const dev of developers) {
        dev.resolvedBugs = await Bug.countDocuments({
          assignedTo: dev._id,
          status: 'Closed',
        });
      }

      if (developers.length > 0) {
        assignment = await aiService.suggestAssignment(
          title, description, analysis.classification?.category, developers
        );
      }
    } catch (err) {
      console.error('Assignment suggestion failed (non-critical):', err.message);
    }

    // Don't expose raw embedding
    const { embedding, ...duplicates } = duplicateResult;

    res.status(200).json({
      success: true,
      classification: analysis.classification,
      priority: analysis.priority,
      summary: analysis.summary,
      duplicates,
      assignment,
    });
  } catch (error) {
    console.error('AI full analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'AI analysis failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc   Submit feedback on AI predictions (for the feedback loop)
 * @route  POST /api/ai/feedback
 * @access Private
 *
 * Request body: { bugId, predictionType, aiPrediction, userCorrection, reason? }
 */
const submitFeedback = async (req, res) => {
  try {
    const projectId = requireProject(req, res);
    if (!projectId) return;

    const { bugId, predictionType, aiPrediction, userCorrection, reason } = req.body;

    if (!bugId || !predictionType || !aiPrediction || !userCorrection) {
      return res.status(400).json({
        success: false,
        message: 'bugId, predictionType, aiPrediction, and userCorrection are required',
      });
    }

    const validTypes = ['classification', 'priority', 'severity', 'duplicate', 'assignment'];
    if (!validTypes.includes(predictionType)) {
      return res.status(400).json({
        success: false,
        message: `predictionType must be one of: ${validTypes.join(', ')}`,
      });
    }

    const feedback = await AIFeedback.create({
      bugId,
      projectId,
      userId: req.user._id,
      predictionType,
      aiPrediction,
      userCorrection,
      isCorrect: aiPrediction === userCorrection,
      reason: reason || '',
    });

    // Update the bug's AI predictions if user corrected them
    if (aiPrediction !== userCorrection) {
      const updateField = {};
      if (predictionType === 'classification') {
        updateField['aiPredictions.category'] = userCorrection;
      } else if (predictionType === 'severity') {
        updateField['aiPredictions.severity'] = userCorrection;
      } else if (predictionType === 'priority') {
        updateField['aiPredictions.priority'] = userCorrection;
      }
      if (Object.keys(updateField).length > 0) {
        await Bug.findByIdAndUpdate(bugId, updateField);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Feedback recorded. Thank you for helping improve our AI!',
      feedback,
    });
  } catch (error) {
    console.error('AI feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record feedback.',
    });
  }
};

/**
 * @desc   Get AI insights and accuracy metrics
 * @route  GET /api/ai/insights
 * @access Private
 *
 * Returns:
 *   - AI prediction accuracy (overall + per type)
 *   - Most common bug categories
 *   - AI usage stats
 *   - Recent feedback entries
 */
const getInsights = async (req, res) => {
  try {
    const projectId = requireProject(req, res);
    if (!projectId) return;

    const projectFilter = { projectId };

    // Run all aggregation queries in parallel
    const [
      totalFeedback,
      correctFeedback,
      accuracyByType,
      categoryDistribution,
      severityDistribution,
      recentFeedback,
      totalBugsWithAI,
      duplicatesDetected,
    ] = await Promise.all([
      // Total feedback entries
      AIFeedback.countDocuments(projectFilter),
      // Correct predictions
      AIFeedback.countDocuments({ ...projectFilter, isCorrect: true }),
      // Accuracy breakdown by prediction type
      AIFeedback.aggregate([
        { $match: projectFilter },
        {
          $group: {
            _id: '$predictionType',
            total: { $sum: 1 },
            correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
          },
        },
        {
          $project: {
            _id: 1,
            total: 1,
            correct: 1,
            accuracy: {
              $cond: [
                { $gt: ['$total', 0] },
                { $multiply: [{ $divide: ['$correct', '$total'] }, 100] },
                0,
              ],
            },
          },
        },
      ]),
      // Bug category distribution (from AI predictions)
      Bug.aggregate([
        { $match: { ...projectFilter, 'aiPredictions.category': { $exists: true, $ne: null } } },
        { $group: { _id: '$aiPredictions.category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // Severity distribution (AI vs user-set)
      Bug.aggregate([
        { $match: { ...projectFilter, 'aiPredictions.severity': { $exists: true, $ne: null } } },
        {
          $group: {
            _id: null,
            totalPredicted: { $sum: 1 },
            matched: {
              $sum: { $cond: [{ $eq: ['$severity', '$aiPredictions.severity'] }, 1, 0] },
            },
          },
        },
      ]),
      // Recent feedback
      AIFeedback.find(projectFilter)
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'name')
        .populate('bugId', 'title')
        .lean(),
      // Total bugs that have AI predictions
      Bug.countDocuments({
        ...projectFilter,
        'aiPredictions.category': { $exists: true, $ne: null },
      }),
      // Bugs flagged as potential duplicates
      Bug.countDocuments({
        ...projectFilter,
        'aiPredictions.isDuplicate': true,
      }),
    ]);

    const overallAccuracy = totalFeedback > 0
      ? Math.round((correctFeedback / totalFeedback) * 100)
      : null;

    res.status(200).json({
      success: true,
      insights: {
        overallAccuracy,
        totalFeedback,
        correctFeedback,
        accuracyByType,
        categoryDistribution,
        severityDistribution: severityDistribution[0] || null,
        totalBugsWithAI,
        duplicatesDetected,
        recentFeedback,
      },
    });
  } catch (error) {
    console.error('AI insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI insights.',
    });
  }
};

module.exports = {
  classifyBug,
  detectDuplicate,
  predictPriority,
  summarizeBug,
  getAssignmentSuggestion,
  fullAnalysis,
  submitFeedback,
  getInsights,
};
