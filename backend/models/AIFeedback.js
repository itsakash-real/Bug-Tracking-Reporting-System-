const mongoose = require('mongoose');

/**
 * AI Feedback Schema — records user corrections to AI predictions.
 *
 * This creates a feedback loop:
 *   AI Prediction → User reviews → Accepts or corrects → Stored here
 *   → Used to track accuracy metrics → Displayed in AI Insights Dashboard
 *
 * Future enhancement: use accumulated feedback to fine-tune prompts
 * or build a local classifier trained on project-specific patterns.
 */
const aiFeedbackSchema = new mongoose.Schema(
  {
    bugId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bug',
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // What kind of AI prediction this feedback is for
    predictionType: {
      type: String,
      enum: ['classification', 'priority', 'severity', 'duplicate', 'assignment'],
      required: true,
    },
    // What the AI predicted
    aiPrediction: {
      type: String,
      required: true,
    },
    // What the user corrected it to (or same value if accepted)
    userCorrection: {
      type: String,
      required: true,
    },
    // Was the AI correct?
    isCorrect: {
      type: Boolean,
      required: true,
    },
    // Optional reason for the correction
    reason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Indexes for analytics queries
aiFeedbackSchema.index({ projectId: 1, predictionType: 1 });
aiFeedbackSchema.index({ projectId: 1, isCorrect: 1 });
aiFeedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AIFeedback', aiFeedbackSchema);
