const express = require("express");
const authController = require("../controllers/authController");
const { authenticate, authorize } = require("../middleware/authenticate");
const validate = require("../middleware/validate");
const { bootstrapSchema, loginSchema, createUserSchema } = require("../validators/authValidator");

const router = express.Router();

router.post("/bootstrap", validate(bootstrapSchema), authController.bootstrap);
router.post("/login", validate(loginSchema), authController.login);
router.get("/me", authenticate, authController.me);
router.get("/users", authenticate, authorize("SYSTEM_ADMIN"), authController.listUsers);
router.post(
  "/users",
  authenticate,
  authorize("SYSTEM_ADMIN"),
  validate(createUserSchema),
  authController.createUser
);

module.exports = router;
