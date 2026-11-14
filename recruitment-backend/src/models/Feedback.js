
const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    feedbackId: {
      type: String,
      unique: true,
      sparse: true,
      immutable: true,
    },

    interview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
      required: true,
      index: true,
    },

    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      index: true,
    },

    interviewerId: {
      type: String,
      required: true,
    },

    interviewerName: {
      type: String,
      required: true,
      trim: true,
    },

    submittedBy: {
      type: String,
      required: true,
    },

    competencies: [
      {
        name: {
          type: String,
          required: true,
        },

        rating: {
          type: Number,
          min: 1,
          max: 5,
          required: true,
        },

        comments: {
          type: String,
          default: "",
          maxlength: 1000,
        },
      },
    ],

    overallRating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    recommendation: {
      type: String,
      enum: ["STRONG_YES", "YES", "NO", "STRONG_NO", "HOLD"],
      required: true,
    },

    strengths: {
      type: String,
      maxlength: 2000,
      default: "",
    },

    weaknesses: {
      type: String,
      maxlength: 2000,
      default: "",
    },

    comments: {
      type: String,
      maxlength: 3000,
      default: "",
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// One feedback submission per interviewer per interview
feedbackSchema.index(
  { interview: 1, interviewerId: 1 },
  { unique: true }
);

feedbackSchema.index({ application: 1, recommendation: 1 });

module.exports = mongoose.model("Feedback", feedbackSchema);
