const mongoose = require("mongoose");

const candidateSkillSchema = new mongoose.Schema(
  {
    candidateSkillId: {
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
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
      required: true,
      index: true,
    },
    proficiency: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
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
        message: "Skill effectiveTo must be on or after effectiveFrom",
      },
    },
  },
  { timestamps: true }
);

candidateSkillSchema.index(
  { candidate: 1, skill: 1, effectiveFrom: 1 },
  { unique: true }
);

module.exports = mongoose.model("CandidateSkill", candidateSkillSchema);
