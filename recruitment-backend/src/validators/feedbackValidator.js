
const { z } = require("zod");

const feedbackSchema = z.object({
  body: z.object({
    interview: z.string().regex(/^[0-9a-fA-F]{24}$/),
    application: z.string().regex(/^[0-9a-fA-F]{24}$/),
    interviewerId: z.string().trim().min(1).optional(),
    interviewerName: z.string().trim().min(2).optional(),

    competencies: z.array(z.object({
      name: z.string().trim().min(2),
      rating: z.number().int().min(1).max(5),
      comments: z.string().max(1000).optional(),
    })).min(1),

    overallRating: z.number().min(1).max(5),

    recommendation: z.enum([
      "STRONG_YES",
      "YES",
      "NO",
      "STRONG_NO",
      "HOLD",
    ]),

    strengths: z.string().max(2000).optional(),
    weaknesses: z.string().max(2000).optional(),
    comments: z.string().max(3000).optional(),
  }),
});

module.exports = { feedbackSchema };
