
const express = require("express");
const router = express.Router();

const feedbackController = require("../controllers/feedbackController");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/authenticate");
const { feedbackSchema } = require("../validators/feedbackValidator");

router.use(authenticate);

router.get("/", authorize("OPERATIONS_ANALYST", "INTERVIEWER", "SYSTEM_ADMIN"), feedbackController.getAllFeedback);

router.post(
  "/",
  authorize("INTERVIEWER", "SYSTEM_ADMIN"),
  validate(feedbackSchema),
  feedbackController.submitFeedback
);

router.get("/interview/:interviewId", authorize("OPERATIONS_ANALYST", "SYSTEM_ADMIN"), feedbackController.getFeedbackByInterview);

router.get("/application/:applicationId", authorize("OPERATIONS_ANALYST", "SYSTEM_ADMIN"), feedbackController.getFeedbackByApplication);

router.get("/:id", authorize("OPERATIONS_ANALYST", "SYSTEM_ADMIN"), feedbackController.getFeedbackById);

module.exports = router;
