
const express = require("express");
const router = express.Router();

const offerController = require("../controllers/offerController");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/authenticate");
const {
  offerSchema,
  offerResponseSchema,
  offerActionSchema,
} = require("../validators/offerValidator");

router.use(authenticate);
router.use(authorize("OPERATIONS_ANALYST", "APPROVER", "SYSTEM_ADMIN"));

router.get("/", authorize("OPERATIONS_ANALYST", "APPROVER", "SYSTEM_ADMIN"), offerController.getAllOffers);

router.post(
  "/",
  authorize("OPERATIONS_ANALYST", "SYSTEM_ADMIN"),
  validate(offerSchema),
  offerController.createOffer
);

router.get("/:id", authorize("OPERATIONS_ANALYST", "APPROVER", "SYSTEM_ADMIN"), offerController.getOfferById);

router.post("/:id/submit", authorize("OPERATIONS_ANALYST", "SYSTEM_ADMIN"), validate(offerActionSchema), offerController.submitForApproval);
router.post("/:id/approve", authorize("APPROVER", "SYSTEM_ADMIN"), validate(offerActionSchema), offerController.approveOffer);
router.post("/:id/send", authorize("OPERATIONS_ANALYST", "SYSTEM_ADMIN"), validate(offerActionSchema), offerController.sendOffer);

router.patch(
  "/:id/accept",
  validate(offerResponseSchema),
  offerController.acceptOffer
);

router.patch(
  "/:id/reject",
  validate(offerResponseSchema),
  offerController.rejectOffer
);

router.patch("/:id/withdraw", authorize("OPERATIONS_ANALYST", "SYSTEM_ADMIN"), validate(offerActionSchema), offerController.withdrawOffer);
router.patch("/:id/expire", offerController.expireOffer);

module.exports = router;
