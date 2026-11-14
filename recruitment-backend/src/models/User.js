const mongoose = require("mongoose");
const ROLES = require("../utils/roles");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true },
    interviewerId: { type: String, trim: true, sparse: true, unique: true },
    isActive: { type: Boolean, default: true },
    isBootstrapAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index(
  { isBootstrapAdmin: 1 },
  { unique: true, partialFilterExpression: { isBootstrapAdmin: true } }
);

module.exports = mongoose.model("User", userSchema);
