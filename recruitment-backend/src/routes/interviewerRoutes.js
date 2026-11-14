const express = require("express");
const interviewerController = require("../controllers/interviewerController");
const { authenticate, authorize } = require("../middleware/authenticate");
const validate = require("../middleware/validate");
const { interviewerSchema } = require("../validators/interviewerValidator");

const router = express.Router();

router.use(authenticate);
router.get("/", authorize("OPERATIONS_ANALYST", "SYSTEM_ADMIN"), interviewerController.listInterviewers);
router.post(
  "/",
  authorize("SYSTEM_ADMIN"),
  validate(interviewerSchema),
  interviewerController.createInterviewer
);

module.exports = router;
