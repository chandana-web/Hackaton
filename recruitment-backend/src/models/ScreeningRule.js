const mongoose = require("mongoose");

const screeningRuleSchema = new mongoose.Schema(
  {
    ruleId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    requisition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Requisition",
      required: true,
      index: true,
    },
    requiredSkills: [
      {
        skill: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Skill",
          default: null,
        },
        skillName: {
          type: String,
          required: true,
          trim: true,
        },
        weight: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
      },
    ],
    minimumExperience: {
      type: Number,
      min: 0,
      default: 0,
    },
    experienceWeight: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    passThreshold: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    effectiveFrom: {
      type: Date,
      required: true,
    },
    effectiveTo: {
      type: Date,
      default: null,
      validate: {
        validator(value) {
          return value == null || value >= this.effectiveFrom;
        },
        message: "Rule effectiveTo must be on or after effectiveFrom",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

screeningRuleSchema.index(
  { requisition: 1, effectiveFrom: 1 },
  { unique: true }
);
screeningRuleSchema.index({ requisition: 1, isActive: 1, effectiveFrom: -1 });

module.exports = mongoose.model("ScreeningRule", screeningRuleSchema);
