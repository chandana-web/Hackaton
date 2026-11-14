
const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    offerId: {
      type: String,
      unique: true,
      sparse: true,
      immutable: true,
    },

    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      unique: true,
    },

    position: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    salary: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },

    joiningDate: {
      type: Date,
      required: true,
    },

    offerDate: {
      type: Date,
      default: Date.now,
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "PENDING_APPROVAL",
        "APPROVED",
        "SENT",
        "ACCEPTED",
        "REJECTED",
        "EXPIRED",
        "WITHDRAWN",
      ],
      default: "DRAFT",
      index: true,
    },

    approvedBy: {
      type: String,
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    sentAt: {
      type: Date,
      default: null,
    },

    respondedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    negotiationHistory: [
      {
        previousSalary: Number,
        proposedSalary: Number,
        remarks: String,
        changedBy: String,
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
        remarks: { type: String, default: "" },
        changedAt: { type: Date, default: Date.now },
      },
    ],

    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

offerSchema.index({ status: 1, expiryDate: 1 });

module.exports = mongoose.model("Offer", offerSchema);
