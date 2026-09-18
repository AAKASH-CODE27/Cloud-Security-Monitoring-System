const express = require("express");
const router = express.Router();

const asyncHandler = require("../utils/asyncHandler");
const { authenticate, authorize } = require("../middleware/auth");
const {
  getDashboard,
  getDashboardCharts,
} = require("../controllers/dashboardController");

router.use(authenticate);

// GET /api/dashboard
router.get(
  "/",
  authorize("ADMIN", "ITSM", "USER"),
  asyncHandler(getDashboard)
);

// GET /api/dashboard/charts?days=30
router.get(
  "/charts",
  authorize("ADMIN", "ITSM", "USER"),
  asyncHandler(getDashboardCharts)
);

module.exports = router;
