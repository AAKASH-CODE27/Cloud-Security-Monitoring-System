const express = require("express");
const router = express.Router();

const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/auth");
const {
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/profileController");
const { createRateLimiter } = require("../middleware/rateLimiter");

const passwordLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: "Too many password change attempts. Please try again after 15 minutes.",
});

router.use(authenticate);

// GET /api/profile-data
router.get("/", asyncHandler(getProfile));

// PUT /api/profile-data
router.put("/", asyncHandler(updateProfile));

// PUT /api/profile-data/password
router.put("/password", passwordLimiter, asyncHandler(changePassword));

module.exports = router;
