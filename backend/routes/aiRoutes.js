const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/authMiddleware');
const {
  classifyBug,
  detectDuplicate,
  predictPriority,
  summarizeBug,
  getAssignmentSuggestion,
  fullAnalysis,
  submitFeedback,
  getInsights,
} = require('../controllers/aiController');

/**
 * Rate limiter for AI endpoints.
 *
 * Cost optimization strategy:
 *   - 30 requests per minute per user (generous for interactive use)
 *   - Prevents accidental spam from frontend retries
 *   - Separate from general API rate limiting
 *
 * In production, combine with:
 *   - API key-level quotas on Gemini
 *   - Per-project daily limits for teams on free tier
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute window
  max: 30,                // 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many AI requests. Please wait a moment before trying again.',
  },
});

// All AI routes require authentication + rate limiting
router.use(protect);
router.use(aiLimiter);

// ────────────────────────────────────────────────────────────────
// Core AI endpoints
// ────────────────────────────────────────────────────────────────

/**
 * @route  POST /api/ai/classify-bug
 * @desc   Classify bug category (UI/Backend/Performance/Security/etc.)
 * @body   { title, description, stepsToReproduce? }
 */
router.post('/classify-bug', classifyBug);

/**
 * @route  POST /api/ai/detect-duplicate
 * @desc   Find similar/duplicate bugs using semantic similarity
 * @body   { title, description, excludeBugId? }
 */
router.post('/detect-duplicate', detectDuplicate);

/**
 * @route  POST /api/ai/predict-priority
 * @desc   Predict severity (Low/Med/High/Critical) and priority (P1-P4)
 * @body   { title, description, stepsToReproduce?, environment? }
 */
router.post('/predict-priority', predictPriority);

/**
 * @route  POST /api/ai/summarize
 * @desc   Generate concise summary of a bug report
 * @body   { title, description, stepsToReproduce?, comments? } OR { bugId }
 */
router.post('/summarize', summarizeBug);

/**
 * @route  POST /api/ai/suggestions
 * @desc   Suggest best developer for assignment
 * @body   { title, description, category? }
 */
router.post('/suggestions', getAssignmentSuggestion);

/**
 * @route  POST /api/ai/analyze
 * @desc   Full analysis — classification + priority + summary + duplicates + assignment
 * @body   { title, description, stepsToReproduce?, environment? }
 */
router.post('/analyze', fullAnalysis);

// ────────────────────────────────────────────────────────────────
// Feedback & Insights
// ────────────────────────────────────────────────────────────────

/**
 * @route  POST /api/ai/feedback
 * @desc   Submit user feedback/correction on AI prediction
 * @body   { bugId, predictionType, aiPrediction, userCorrection, reason? }
 */
router.post('/feedback', submitFeedback);

/**
 * @route  GET /api/ai/insights
 * @desc   Get AI accuracy metrics and insights for dashboard
 */
router.get('/insights', getInsights);

module.exports = router;
