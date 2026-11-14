
const express = require("express");
const router = express.Router();

const interviewController = require("../controllers/interviewController");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/authenticate");
const {
  interviewSchema,
  rescheduleInterviewSchema,
  completeInterviewSchema,
  cancelInterviewSchema,
} = require("../validators/interviewValidator");

router.use(authenticate);

router.get("/", authorize("OPERATIONS_ANALYST", "INTERVIEWER", "SYSTEM_ADMIN"), interviewController.getAllInterviews);

router.post(
  "/",
  authorize("OPERATIONS_ANALYST", "SYSTEM_ADMIN"),
  validate(interviewSchema),
  interviewController.createInterview
);

router.get("/:id", authorize("OPERATIONS_ANALYST", "SYSTEM_ADMIN"), interviewController.getInterviewById);

router.patch(
  "/:id/reschedule",
  authorize("OPERATIONS_ANALYST", "SYSTEM_ADMIN"),
  validate(rescheduleInterviewSchema),
  interviewController.rescheduleInterview
);

router.patch(
  "/:id/complete",
  authorize("OPERATIONS_ANALYST", "INTERVIEWER", "SYSTEM_ADMIN"),
  validate(completeInterviewSchema),
  interviewController.completeInterview
);

router.patch(
  "/:id/cancel",
  authorize("OPERATIONS_ANALYST", "SYSTEM_ADMIN"),
  validate(cancelInterviewSchema),
  interviewController.cancelInterview
);

module.exports = router;
