const { z } = require("zod");
const ROLES = require("../utils/roles");

const credentials = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(72),
});

const bootstrapSchema = z.object({
  body: credentials.extend({
    name: z.string().trim().min(2).max(100),
    setupKey: z.string().min(1).max(256),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(72),
  }),
});

const createUserSchema = z.object({
  body: credentials.extend({
    name: z.string().trim().min(2).max(100),
    role: z.enum(ROLES),
    interviewerId: z.string().trim().min(3).max(50).optional(),
  }),
}).superRefine(({ body }, ctx) => {
  if (body.role === "INTERVIEWER" && !body.interviewerId) {
    ctx.addIssue({
      code: "custom",
      path: ["body", "interviewerId"],
      message: "An active interviewer profile must be assigned",
    });
  }
  if (body.role !== "INTERVIEWER" && body.interviewerId) {
    ctx.addIssue({
      code: "custom",
      path: ["body", "interviewerId"],
      message: "Only interviewer accounts can be linked to an interviewer profile",
    });
  }
});

module.exports = { bootstrapSchema, loginSchema, createUserSchema };
