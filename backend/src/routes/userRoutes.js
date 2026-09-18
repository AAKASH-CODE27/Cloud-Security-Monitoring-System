const express = require("express");
const router = express.Router();

const asyncHandler = require("../utils/asyncHandler");
const { authenticate, authorize } = require("../middleware/auth");
const {
  profile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

router.use(authenticate);

// GET /api/users/profile
router.get("/profile", authorize("ADMIN", "ITSM", "USER"), asyncHandler(profile));

// GET /api/users (ADMIN only)
router.get("/", authorize("ADMIN"), asyncHandler(getAllUsers));

// GET /api/users/:id (ADMIN only)
router.get("/:id", authorize("ADMIN"), asyncHandler(getUserById));

// PUT /api/users/:id (ADMIN, ITSM, or self update handled in service)
router.put("/:id", authorize("ADMIN", "ITSM", "USER"), asyncHandler(updateUser));

// DELETE /api/users/:id (ADMIN only)
router.delete("/:id", authorize("ADMIN"), asyncHandler(deleteUser));

module.exports = router;
