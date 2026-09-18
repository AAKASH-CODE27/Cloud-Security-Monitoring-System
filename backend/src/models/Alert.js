const mongoose = require("mongoose");

// ============================================================
// Alert Schema
// Equivalent to dto/AlertDto.java, persisted here so
// GET /api/alerts/recent has real, evolving data instead of the
// hardcoded list the Spring DashboardServiceImpl returned.
// ============================================================

const alertSchema = new mongoose.Schema(
  {
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "LOW",
    },
    asset: String,
    assetName: String,
    category: String,
    description: String,
    status: {
      type: String,
      enum: ["OPEN", "ACKNOWLEDGED", "RESOLVED"],
      default: "OPEN",
    },
    assignedTo: String,
    source: String,
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

module.exports = mongoose.model("Alert", alertSchema);
