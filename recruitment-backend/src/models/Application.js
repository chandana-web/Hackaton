
const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      unique: true,
      sparse: true,
      immutable: true,
    },

    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      index: true,
    },

    requisition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Requisition",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "APPLIED",
        "SCREENING",
        "SHORTLISTED",
        "INTERVIEW",
        "OFFER",
        "HIRED",
        "REJECTED",
        "WITHDRAWN",
      ],
      default: "APPLIED",
      index: true,
    },

    screening: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },

      decision: {
        type: String,
        enum: ["PENDING", "PASS", "FAIL"],
        default: "PENDING",
      },

      remarks: {
        type: String,
        maxlength: 2000,
        default: "",
      },

      screenedBy: {
        type: String,
        default: null,
      },

      screenedAt: {
        type: Date,
        default: null,
      },

      criteriaBreakdown: [
        {
          criterion: { type: String, required: true },
          weight: { type: Number, min: 0, max: 100, required: true },
          score: { type: Number, min: 0, max: 100, required: true },
          contribution: { type: Number, min: 0, max: 100, required: true },
        },
      ],
    },

    stageHistory: [
      {
        stage: {
          type: String,
          required: true,
        },

        previousStatus: {
          type: String,
          default: null,
        },

        newStatus: {
          type: String,
          required: true,
        },

        changedBy: {
          type: String,
          required: true,
        },

        remarks: {
          type: String,
          default: "",
        },

        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    appliedAt: {
      type: Date,
      default: Date.now,
    },

    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent the same candidate applying twice to the same requisition
applicationSchema.index(
  { candidate: 1, requisition: 1 },
  { unique: true }
);

// Analytics and filtering
applicationSchema.index({ requisition: 1, status: 1 });
applicationSchema.index({ status: 1, appliedAt: -1 });

module.exports = mongoose.model("Application", applicationSchema);
