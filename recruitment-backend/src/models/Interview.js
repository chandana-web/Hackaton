
const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    interviewId: {
      type: String,
      unique: true,
      sparse: true,
      immutable: true,
    },

    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      index: true,
    },

    round: {
      type: Number,
      required: true,
      min: 1,
    },

    roundName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    interviewType: {
      type: String,
      enum: ["TECHNICAL", "HR", "MANAGERIAL", "SCREENING", "OTHER"],
      required: true,
    },

    mode: {
      type: String,
      enum: ["ONLINE", "ONSITE"],
      required: true,
    },

    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },

    durationMinutes: {
      type: Number,
      min: 15,
      max: 480,
      default: 60,
    },

    location: {
      type: String,
      default: "",
    },

    meetingLink: {
      type: String,
      default: "",
    },

    panel: [
      {
        interviewerId: {
          type: String,
          required: true,
        },

        interviewerName: {
          type: String,
          required: true,
        },

        interviewerEmail: {
          type: String,
          lowercase: true,
          trim: true,
        },
      },
    ],

    status: {
      type: String,
      enum: [
        "SCHEDULED",
        "RESCHEDULED",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ],
      default: "SCHEDULED",
      index: true,
    },

    result: {
      type: String,
      enum: ["PENDING", "PASS", "FAIL", "ON_HOLD"],
      default: "PENDING",
    },

    notes: {
      type: String,
      maxlength: 2000,
      default: "",
    },

    scheduledBy: {
      type: String,
      required: true,
    },

    cancellationReason: {
      type: String,
      default: "",
    },

    rescheduleHistory: [
      {
        previousDate: Date,
        newDate: Date,
        changedBy: String,
        reason: String,
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    statusHistory: [
      {
        previousStatus: String,
        newStatus: { type: String, required: true },
        changedBy: { type: String, required: true },
        reason: { type: String, default: "" },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Application round uniqueness
interviewSchema.index(
  { application: 1, round: 1 },
  { unique: true }
);

// Interview scheduling queries
interviewSchema.index({ scheduledAt: 1, status: 1 });

module.exports = mongoose.model("Interview", interviewSchema);
