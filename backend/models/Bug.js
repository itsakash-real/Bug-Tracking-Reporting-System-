const mongoose = require('mongoose');

/**
 * Comment sub-document schema
 */
const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

/**
 * Activity log sub-document schema
 * Records every change made to the bug for audit trail
 */
const activitySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      // e.g. "status_changed", "assigned", "priority_changed", "comment_added"
    },
    field: String,
    oldValue: String,
    newValue: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: String,
  },
  { timestamps: true }
);

/**
 * Bug Schema — Core document of the system
 * Lifecycle: Open → In Progress → Closed
 */
const bugSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Bug title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Bug description is required'],
      trim: true,
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
      required: true,
    },
    priority: {
      type: String,
      enum: ['P1', 'P2', 'P3', 'P4'],
      default: 'P3',
      required: true,
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Closed'],
      default: 'Open',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    comments: [commentSchema],
    activityLog: [activitySchema],
    // Tags for additional categorization
    tags: [{ type: String, trim: true }],
    // Optional: environment where bug was found
    environment: {
      type: String,
      trim: true,
      default: '',
    },
    // Optional: steps to reproduce
    stepsToReproduce: {
      type: String,
      trim: true,
      default: '',
    },

    // ──── AI-generated fields ────
    // Embedding vector for semantic similarity / duplicate detection
    embedding: {
      type: [Number],
      default: [],
      select: false, // Never return in normal queries (large payload)
    },
    // AI predictions stored alongside the bug
    aiPredictions: {
      category: { type: String, default: null },          // UI, Backend, Performance, Security, etc.
      severity: { type: String, default: null },           // AI-predicted severity
      priority: { type: String, default: null },           // AI-predicted priority
      confidence: { type: Number, default: null },         // 0.0 - 1.0
      reasoning: { type: String, default: '' },            // Explainable AI: WHY this prediction
      summary: { type: String, default: '' },              // AI-generated summary
      suggestedAssignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      isDuplicate: { type: Boolean, default: false },
      duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Bug', default: null },
      similarityScore: { type: Number, default: null },    // 0-100
      factors: [{
        factor: String,
        impact: { type: String, enum: ['positive', 'negative', 'neutral'] },
        explanation: String,
      }],
      analyzedAt: { type: Date, default: null },
    },
    // AI-assigned category (can be overridden by user via feedback loop)
    aiCategory: {
      type: String,
      enum: ['UI', 'Backend', 'Performance', 'Security', 'Database', 'Network', 'Other', null],
      default: null,
    },
  },
  { timestamps: true }
);

// Index for fast search and filtering
bugSchema.index({ title: 'text', description: 'text' });
bugSchema.index({ projectId: 1, status: 1, priority: 1, severity: 1 });
bugSchema.index({ projectId: 1, assignedTo: 1 });
bugSchema.index({ projectId: 1, createdBy: 1 });

module.exports = mongoose.model('Bug', bugSchema);
