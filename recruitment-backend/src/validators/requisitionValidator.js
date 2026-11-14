
const { z } = require("zod");

const requisitionBodySchema = z.object({
  title: z.string().trim().min(2).max(100),
  department: z.string().trim().min(2).max(100),
  departmentRef: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  location: z.string().trim().min(2),
  employmentType: z.enum([
    "FULL_TIME",
    "PART_TIME",
    "CONTRACT",
    "INTERNSHIP",
  ]),
  experienceMin: z.number().min(0),
  experienceMax: z.number().min(0),
  salaryMin: z.number().min(0).nullable().optional(),
  salaryMax: z.number().min(0).nullable().optional(),
  currency: z.string().length(3).optional(),
  openings: z.number().int().min(1),
  description: z.string().trim().min(10),
  skills: z.array(z.string().trim().min(1)).default([]),
  requiredSkillRefs: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  hiringManager: z.string().trim().min(2),
});

const validateRequisitionFields = (data, ctx) => {
  if (
    data.experienceMin != null &&
    data.experienceMax != null &&
    data.experienceMax < data.experienceMin
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["experienceMax"],
      message: "Maximum experience must be >= minimum experience",
    });
  }

  if (
    data.salaryMin != null &&
    data.salaryMax != null &&
    data.salaryMax < data.salaryMin
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["salaryMax"],
      message: "Maximum salary must be >= minimum salary",
    });
  }
  if (
    data.experienceMin === 0 &&
    Object.prototype.hasOwnProperty.call(data, "skills") &&
    (!data.skills || data.skills.length === 0)
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["skills"],
      message: "At least one job-related skill or minimum experience is required",
    });
  }
};

const requisitionSchema = z.object({
  body: requisitionBodySchema.superRefine(validateRequisitionFields),
});

const requisitionUpdateSchema = z.object({
  body: requisitionBodySchema
    .partial()
    .superRefine(validateRequisitionFields),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid requisition ID"),
  }),
});

const requisitionActionSchema = z.object({
  body: z.object({
    actorId: z.string().trim().min(2).optional(),
    remarks: z.string().trim().max(1000).optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid requisition ID"),
  }),
});

const requisitionRejectionSchema = z.object({
  body: z.object({
    actorId: z.string().trim().min(2).optional(),
    remarks: z.string().trim().min(2).max(1000),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid requisition ID"),
  }),
});

module.exports = {
  requisitionSchema,
  requisitionUpdateSchema,
  requisitionActionSchema,
  requisitionRejectionSchema,
};
