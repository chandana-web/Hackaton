
const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    candidateId: {
      type: String,
      unique: true,
      sparse: true,
      immutable: true,
    },

    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: 50,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      unique: true,
      maxlength: 254,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    location: {
      type: String,
      trim: true,
      default: "",
    },

    currentCompany: {
      type: String,
      trim: true,
      default: "",
    },

    experience: {
      type: Number,
      min: 0,
      default: 0,
    },

    skills: {
      type: [String],
      default: [],
    },

    skillRefs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skill",
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    resumeUrl: {
      type: String,
      trim: true,
      default: null,
    },

    source: {
      type: String,
      enum: [
        "LINKEDIN",
        "CAREER_PAGE",
        "REFERRAL",
        "JOB_PORTAL",
        "DIRECT",
        "OTHER",
      ],
      default: "DIRECT",
    },

    notes: {
      type: String,
      maxlength: 2000,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

candidateSchema.index({ firstName: 1, lastName: 1 });
candidateSchema.index({ skills: 1 });

module.exports = mongoose.model("Candidate", candidateSchema);
