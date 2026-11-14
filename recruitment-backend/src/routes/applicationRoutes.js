
const express = require("express");
const router = express.Router();

const applicationController = require("../controllers/applicationController");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/authenticate");
const {
  applicationSchema,
  screeningSchema,
  applicationStatusSchema,
} = require("../validators/applicationValidator");

router.use(authenticate);

router.get("/", authorize("OPERATIONS_ANALYST", "SYSTEM_ADMIN"), applicationController.getAllApplications);

router.post(
  "/",
  authorize("OPERATIONS_ANALYST", "SYSTEM_ADMIN"),
  validate(applicationSchema),
  applicationController.createApplication
);

router.get("/:id", authorize("OPERATIONS_ANALYST", "SYSTEM_ADMIN"), applicationController.getApplicationById);

router.patch(
  "/:id/screen",
  authorize("OPERATIONS_ANALYST", "SYSTEM_ADMIN"),
  validate(screeningSchema),
  applicationController.screenApplication
);

router.patch(
  "/:id/status",
  authorize("OPERATIONS_ANALYST", "SYSTEM_ADMIN"),
  validate(applicationStatusSchema),
  applicationController.updateApplicationStatus
);

module.exports = router;
