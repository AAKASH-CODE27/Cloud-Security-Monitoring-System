const express = require("express");
const router = express.Router();

const asyncHandler = require("../utils/asyncHandler");
const { authenticate, authorize } = require("../middleware/auth");

const {
  createAsset,
  updateAsset,
  getAllAssets,
  getAssetById,
  deleteAsset,
  discoverAssets,
  scanNetwork,
  searchAssets,
  getAssetsByDepartment,
  getAssetsByOwner,
  getAssetsByStatus,
  getAssetsByHealth,
} = require("../controllers/assetController");
const { createRateLimiter } = require("../middleware/rateLimiter");

const netScanLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 10,
  message: "Too many network scanning requests. Please wait a few minutes before retrying.",
});

// Every route below requires a valid JWT
router.use(authenticate);

// ============================================================
// IMPORTANT: static/specific routes must be declared BEFORE
// the "/:id" route, otherwise Express treats "search", "scan",
// etc. as an :id value.
// ============================================================

// GET /api/assets/discover
router.get(
  "/discover",
  authorize("ADMIN", "ITSM"),
  netScanLimiter,
  asyncHandler(discoverAssets)
);

// GET /api/assets/scan?subnet=192.168.1
router.get("/scan", authorize("ADMIN", "ITSM"), netScanLimiter, asyncHandler(scanNetwork));

// GET /api/assets/search?keyword=...
router.get(
  "/search",
  authorize("ADMIN", "ITSM", "USER"),
  asyncHandler(searchAssets)
);

// GET /api/assets/department/:department
router.get(
  "/department/:department",
  authorize("ADMIN", "ITSM", "USER"),
  asyncHandler(getAssetsByDepartment)
);

// GET /api/assets/owner/:owner
router.get(
  "/owner/:owner",
  authorize("ADMIN", "ITSM", "USER"),
  asyncHandler(getAssetsByOwner)
);

// GET /api/assets/status/:status
router.get(
  "/status/:status",
  authorize("ADMIN", "ITSM", "USER"),
  asyncHandler(getAssetsByStatus)
);

// GET /api/assets/health/:health
router.get(
  "/health/:health",
  authorize("ADMIN", "ITSM", "USER"),
  asyncHandler(getAssetsByHealth)
);

// GET /api/assets/my-assets/:username
router.get(
  "/my-assets/:username",
  authorize("ADMIN", "ITSM", "USER"),
  asyncHandler((req, res, next) => {
    req.params.owner = req.params.username;
    return getAssetsByOwner(req, res, next);
  })
);

// GET /api/assets/dashboard/:department
router.get(
  "/dashboard/:department",
  authorize("ADMIN", "ITSM", "USER"),
  asyncHandler(getAssetsByDepartment)
);

// ============================================================
// Core CRUD
// ============================================================

// POST /api/assets
router.post("/", authorize("ADMIN", "ITSM"), asyncHandler(createAsset));

// GET /api/assets
router.get(
  "/",
  authorize("ADMIN", "ITSM", "USER"),
  asyncHandler(getAllAssets)
);

// GET /api/assets/:id
router.get(
  "/:id",
  authorize("ADMIN", "ITSM", "USER"),
  asyncHandler(getAssetById)
);

// PUT /api/assets/:id
router.put("/:id", authorize("ADMIN", "ITSM"), asyncHandler(updateAsset));

// DELETE /api/assets/:id
router.delete("/:id", authorize("ADMIN"), asyncHandler(deleteAsset));

module.exports = router;
