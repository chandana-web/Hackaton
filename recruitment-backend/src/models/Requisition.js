
const mongoose = require("mongoose");

const requisitionSchema = new mongoose.Schema(
  {
    requisitionId: {
      type: String,
      unique: true,
      sparse: true,
      immutable: true,
    },

    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: 100,
    },

    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
      maxlength: 100,
    },

    departmentRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },

    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },

    employmentType: {
      type: String,
      enum: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"],
      required: true,
    },

    experienceMin: {
      type: Number,
      min: 0,
      required: true,
    },

    experienceMax: {
      type: Number,
      min: 0,
      required: true,
      validate: {
        validator(value) {
          return value >= this.experienceMin;
        },
        message: "Maximum experience must be >= minimum experience",
      },
    },

    salaryMin: {
      type: Number,
      min: 0,
      default: null,
    },

    salaryMax: {
      type: Number,
      min: 0,
      default: null,
    },

    currency: {
      type: String,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
      default: "INR",
    },

    openings: {
      type: Number,
      min: 1,
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    skills: {
      type: [String],
      default: [],
    },

    requiredSkillRefs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skill",
      },
    ],

    hiringManager: {
      type: String,
      required: true,
      trim: true,
    },

    createdBy: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "PENDING_APPROVAL",
        "APPROVED",
        "REJECTED",
        "OPEN",
        "ON_HOLD",
        "CLOSED",
        "CANCELLED",
      ],
      default: "DRAFT",
      index: true,
    },

    approvalHistory: [
      {
        action: {
          type: String,
          enum: ["SUBMITTED", "APPROVED", "REJECTED"],
        },
        actor: String,
        remarks: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    statusHistory: [
      {
        previousStatus: String,
        newStatus: { type: String, required: true },
        actor: { type: String, required: true },
        remarks: { type: String, default: "" },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
requisitionSchema.index({ department: 1, status: 1 });
requisitionSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Requisition", requisitionSchema);
