const mongoose = require("mongoose");

const resumeArtifactSchema = new mongoose.Schema(
  {
    resumeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      index: true,
    },
    storageKey: {
      type: String,
      required: true,
      trim: true,
    },
    checksum: {
      type: String,
      required: true,
      match: /^[a-f0-9]{64}$/i,
    },
    source: {
      type: String,
      enum: ["CANDIDATE_UPLOAD", "REFERRAL", "SYNTHETIC"],
      required: true,
    },
    uploadedAt: {
      type: Date,
      required: true,
    },
    isCurrent: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

resumeArtifactSchema.index({ candidate: 1, uploadedAt: -1 });

module.exports = mongoose.model("ResumeArtifact", resumeArtifactSchema);
