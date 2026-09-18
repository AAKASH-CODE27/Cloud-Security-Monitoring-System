const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },
    asset: { type: String, default: "Unknown Asset" },
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: "Asset", default: null },
    assignedUser: { type: String, default: "Unassigned" },
    assignedUserEmail: { type: String, default: "" },
    status: {
      type: String,
      enum: ["OPEN", "ASSIGNED", "INVESTIGATING", "MITIGATED", "RESOLVED"],
      default: "OPEN",
    },
    resolutionNotes: { type: String, default: "" },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

incidentSchema.index({ status: 1 });
incidentSchema.index({ severity: 1 });
incidentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Incident", incidentSchema);
