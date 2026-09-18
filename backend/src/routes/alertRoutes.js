const express = require("express");
const router = express.Router();

const asyncHandler = require("../utils/asyncHandler");
const { authenticate, authorize } = require("../middleware/auth");
const {
  getAllAlerts,
  getRecentAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
} = require("../controllers/alertController");

router.use(authenticate);

// GET /api/alerts
router.get("/", authorize("ADMIN", "ITSM", "USER"), asyncHandler(getAllAlerts));

// GET /api/alerts/recent
router.get("/recent", authorize("ADMIN", "ITSM", "USER"), asyncHandler(getRecentAlerts));

// POST /api/alerts
router.post("/", authorize("ADMIN", "ITSM"), asyncHandler(createAlert));

// PUT /api/alerts/:id
router.put("/:id", authorize("ADMIN", "ITSM"), asyncHandler(updateAlert));

// DELETE /api/alerts/:id
router.delete("/:id", authorize("ADMIN"), asyncHandler(deleteAlert));

module.exports = router;
