const express = require("express");
const router = express.Router();

const asyncHandler = require("../utils/asyncHandler");
const { validateRegister, validateLogin } = require("../validators/authValidator");
const { register, login, adminCreateUser } = require("../controllers/authController");
const { authenticate, authorize } = require("../middleware/auth");
const { createRateLimiter } = require("../middleware/rateLimiter");

// Login rate limiter: 10 attempts per 15 minutes per IP
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: "Too many login attempts. Please try again after 15 minutes.",
});

// POST /api/auth/register (Public registration - ALWAYS role: USER)
router.post("/register", validateRegister, asyncHandler(register));

// POST /api/auth/login
router.post("/login", loginLimiter, validateLogin, asyncHandler(login));

// POST /api/auth/create-user (ADMIN only endpoint for creating ADMIN/ITSM users)
router.post("/create-user", authenticate, authorize("ADMIN"), validateRegister, asyncHandler(adminCreateUser));

module.exports = router;
