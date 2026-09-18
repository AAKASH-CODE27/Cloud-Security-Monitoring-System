const express = require("express");
const router = express.Router();

const asyncHandler = require("../utils/asyncHandler");
const { authenticate, authorize } = require("../middleware/auth");
const {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident,
} = require("../controllers/incidentController");

router.use(authenticate);

// GET /api/incidents
router.get("/", authorize("ADMIN", "ITSM", "USER"), asyncHandler(getIncidents));

// GET /api/incidents/:id
router.get("/:id", authorize("ADMIN", "ITSM", "USER"), asyncHandler(getIncidentById));

// POST /api/incidents
router.post("/", authorize("ADMIN", "ITSM"), asyncHandler(createIncident));

// PUT /api/incidents/:id
router.put("/:id", authorize("ADMIN", "ITSM"), asyncHandler(updateIncident));

// DELETE /api/incidents/:id
router.delete("/:id", authorize("ADMIN"), asyncHandler(deleteIncident));

module.exports = router;
