
const { z } = require("zod");

const candidateSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(2).max(50),
    lastName: z.string().trim().min(1).max(50),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().min(7).max(20),
    location: z.string().trim().optional(),
    currentCompany: z.string().trim().optional(),
    experience: z.number().min(0),
    skills: z.array(z.string().trim().min(1)).default([]),
    skillRefs: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
    resumeUrl: z.string().url().nullable().optional(),
    source: z.enum([
      "LINKEDIN",
      "CAREER_PAGE",
      "REFERRAL",
      "JOB_PORTAL",
      "DIRECT",
      "OTHER",
    ]).optional(),
    notes: z.string().max(2000).optional(),
  }),
});

const candidateUpdateSchema = z.object({
  body: candidateSchema.shape.body.partial(),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
});

module.exports = {
  candidateSchema,
  candidateUpdateSchema,
};
