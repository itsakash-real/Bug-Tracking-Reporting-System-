const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Project Schema — represents an isolated workspace / team.
 * Each project has its own set of bugs and members.
 * Members join via a unique invite code.
 */
const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    inviteCode: {
      type: String,
      unique: true,
      required: true,
    },
  },
  { timestamps: true }
);

/**
 * Generate a unique 8-character invite code before saving.
 * Only generates if one is not already set (i.e., on create).
 */
projectSchema.pre('validate', function (next) {
  if (!this.inviteCode) {
    this.inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
