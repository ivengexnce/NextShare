const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'Anonymous',
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: ['testimonial', 'issue'],
      default: 'testimonial',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved'],
      default: 'open',
      required: true,
      index: true,
    },
    approved: {
      type: Boolean,
      default: false,
      index: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    page: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '/',
    },
    ip: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

feedbackSchema.index({ approved: 1, type: 1, createdAt: -1 });
feedbackSchema.index({ type: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
