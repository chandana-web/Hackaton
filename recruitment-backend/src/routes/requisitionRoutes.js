
const express = require("express");
const router = express.Router();

const requisitionController = require("../controllers/requisitionController");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/authenticate");
const {
  requisitionSchema: createRequisitionSchema,
  requisitionUpdateSchema: updateRequisitionSchema,
  requisitionActionSchema,
  requisitionRejectionSchema,
} = require("../validators/requisitionValidator");

router.use(authenticate);

// GET all requisitions
router.get("/", requisitionController.getAllRequisitions);

// GET requisition by ID
router.get("/:id", requisitionController.getRequisitionById);

// CREATE requisition
router.post(
  "/",
  authorize("BUSINESS_REQUESTER", "PROCESS_OWNER", "SYSTEM_ADMIN"),
  validate(createRequisitionSchema),
  requisitionController.createRequisition
);

// UPDATE requisition
router.patch(
  "/:id",
  authorize("BUSINESS_REQUESTER", "PROCESS_OWNER", "SYSTEM_ADMIN"),
  validate(updateRequisitionSchema),
  requisitionController.updateRequisition
);

// Approval workflow
router.post("/:id/submit", authorize("BUSINESS_REQUESTER", "PROCESS_OWNER", "SYSTEM_ADMIN"), validate(requisitionActionSchema), requisitionController.submitForApproval);
router.post("/:id/approve", authorize("APPROVER", "SYSTEM_ADMIN"), validate(requisitionActionSchema), requisitionController.approveRequisition);
router.post("/:id/reject", authorize("APPROVER", "SYSTEM_ADMIN"), validate(requisitionRejectionSchema), requisitionController.rejectRequisition);

// Lifecycle
router.post("/:id/open", authorize("PROCESS_OWNER", "SYSTEM_ADMIN"), validate(requisitionActionSchema), requisitionController.openRequisition);
router.post("/:id/close", authorize("PROCESS_OWNER", "SYSTEM_ADMIN"), validate(requisitionActionSchema), requisitionController.closeRequisition);
router.post("/:id/hold", authorize("PROCESS_OWNER", "SYSTEM_ADMIN"), validate(requisitionActionSchema), requisitionController.holdRequisition);
router.post("/:id/cancel", authorize("PROCESS_OWNER", "SYSTEM_ADMIN"), validate(requisitionActionSchema), requisitionController.cancelRequisition);

module.exports = router;
