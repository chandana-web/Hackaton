
const { z } = require("zod");

const interviewSchema = z.object({
  body: z.object({
    application: z.string().regex(/^[0-9a-fA-F]{24}$/),
    round: z.number().int().min(1),
    roundName: z.string().trim().min(2).max(100),
    interviewType: z.enum([
      "TECHNICAL",
      "HR",
      "MANAGERIAL",
      "SCREENING",
      "OTHER",
    ]),
    mode: z.enum(["ONLINE", "ONSITE"]),
    scheduledAt: z.coerce.date(),
    durationMinutes: z.number().int().min(15).max(480).optional(),
    location: z.string().optional(),
    meetingLink: z.string().url().optional(),
    panel: z.array(z.object({
      interviewerId: z.string().trim().min(1),
      interviewerName: z.string().trim().min(2),
      interviewerEmail: z.string().email().optional(),
    })).min(1),
    scheduledBy: z.string().trim().min(2).optional(),
  }),
});

const rescheduleInterviewSchema = z.object({
  body: z.object({
    scheduledAt: z.coerce.date(),
    changedBy: z.string().trim().min(2).optional(),
    reason: z.string().trim().min(2).max(1000),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
});

const completeInterviewSchema = z.object({
  body: z.object({
    result: z.enum(["PASS", "FAIL", "ON_HOLD"]),
    notes: z.string().max(2000).optional(),
    changedBy: z.string().trim().min(2).optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
});

const cancelInterviewSchema = z.object({
  body: z.object({
    reason: z.string().trim().min(2).max(1000),
    changedBy: z.string().trim().min(2).optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
});

module.exports = {
  interviewSchema,
  rescheduleInterviewSchema,
  completeInterviewSchema,
  cancelInterviewSchema,
};
