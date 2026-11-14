
const { z } = require("zod");

const offerSchema = z.object({
  body: z.object({
    application: z.string().regex(/^[0-9a-fA-F]{24}$/),
    salary: z.number().min(0),
    currency: z.string().length(3).optional(),
    joiningDate: z.coerce.date(),
    expiryDate: z.coerce.date(),
  }).refine(
    (data) => data.expiryDate > new Date(),
    {
      path: ["expiryDate"],
      message: "Expiry date must be in the future",
    }
  ),
});

const offerResponseSchema = z.object({
  body: z.object({
    rejectionReason: z.string().trim().min(2).max(1000).optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
});

const offerActionSchema = z.object({
  body: z.object({
    actorId: z.string().trim().min(2).optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
});

module.exports = {
  offerSchema,
  offerResponseSchema,
  offerActionSchema,
};
