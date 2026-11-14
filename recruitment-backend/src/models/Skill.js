const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema(
  {
    skillId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 80,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Skill", skillSchema);
