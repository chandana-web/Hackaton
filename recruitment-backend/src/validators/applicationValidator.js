
const { z } = require("zod");

const applicationSchema = z.object({
  body: z.object({
    candidate: z.string().regex(/^[0-9a-fA-F]{24}$/),
    requisition: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
});

const screeningSchema = z.object({
  body: z.object({
    remarks: z.string().max(2000).optional(),
    screenedBy: z.string().trim().min(2).optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
});

const applicationStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      "SCREENING",
      "REJECTED",
      "WITHDRAWN",
    ]),
    changedBy: z.string().trim().min(2).optional(),
    remarks: z.string().max(2000).optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
});

module.exports = {
  applicationSchema,
  screeningSchema,
  applicationStatusSchema,
};
