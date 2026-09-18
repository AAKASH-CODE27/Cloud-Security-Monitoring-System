const express = require("express");
const router = express.Router();

const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/auth");
const {
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/profileController");

router.use(authenticate);

// GET /api/profile-data
router.get("/", asyncHandler(getProfile));

// PUT /api/profile-data
router.put("/", asyncHandler(updateProfile));

// PUT /api/profile-data/password
router.put("/password", asyncHandler(changePassword));

module.exports = router;
