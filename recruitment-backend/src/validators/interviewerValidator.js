const { z } = require("zod");

const interviewerSchema = z.object({
  body: z.object({
    interviewerId: z.string().trim().min(3).max(50),
    firstName: z.string().trim().min(2).max(50),
    lastName: z.string().trim().min(1).max(50),
    email: z.string().trim().email().max(254),
    skills: z.array(z.string().trim().min(1)).default([]),
    availability: z.array(z.object({
      startTime: z.coerce.date(),
      endTime: z.coerce.date(),
    }).refine((slot) => slot.endTime > slot.startTime, {
      path: ["endTime"],
      message: "Availability end must be after its start",
    })).min(1),
  }),
});

module.exports = { interviewerSchema };
