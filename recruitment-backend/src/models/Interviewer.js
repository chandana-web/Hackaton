
const mongoose = require("mongoose");

const interviewerSchema = new mongoose.Schema(
  {
    interviewerId: {
      type: String,
      unique: true,
      required: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },

    skills: [String],

    availability: [
      {
        startTime: {
          type: Date,
          required: true,
        },
        endTime: {
          type: Date,
          required: true,
          validate: {
            validator(value) {
              return value > this.startTime;
            },
            message: "Availability endTime must be after startTime",
          },
        },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },

    scheduleLockToken: {
      type: String,
      default: null,
      select: false,
    },

    scheduleLockExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interviewer", interviewerSchema);
