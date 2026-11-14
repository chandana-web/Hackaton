
const express = require("express");
const router = express.Router();

const candidateController = require("../controllers/candidateController");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/authenticate");
const {
  candidateSchema,
  candidateUpdateSchema,
} = require("../validators/candidateValidator");

router.use(authenticate);

// Search candidates
router.get("/search", authorize("OPERATIONS_ANALYST", "SYSTEM_ADMIN"), candidateController.searchCandidates);

// Get all candidates
router.get("/", authorize("OPERATIONS_ANALYST", "SYSTEM_ADMIN"), candidateController.getAllCandidates);

// Create candidate
router.post(
  "/",
  authorize("OPERATIONS_ANALYST", "SYSTEM_ADMIN"),
  validate(candidateSchema),
  candidateController.createCandidate
);

// Get candidate by ID
router.get("/:id", authorize("OPERATIONS_ANALYST", "SYSTEM_ADMIN"), candidateController.getCandidateById);

// Update candidate
router.patch(
  "/:id",
  authorize("OPERATIONS_ANALYST", "SYSTEM_ADMIN"),
  validate(candidateUpdateSchema),
  candidateController.updateCandidate
);

// Delete candidate
router.delete("/:id", authorize("OPERATIONS_ANALYST", "SYSTEM_ADMIN"), candidateController.deleteCandidate);

module.exports = router;
