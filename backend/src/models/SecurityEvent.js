const mongoose = require("mongoose");

const securityEventSchema = new mongoose.Schema(
  {
    asset: { type: String, default: "System" },
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: "Asset", default: null },
    eventType: { type: String, required: true },
    severity: {
      type: String,
      enum: ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "INFO",
    },
    description: { type: String, required: true },
    source: { type: String, default: "SentinelCore Monitor" },
    status: { type: String, default: "UNREAD" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

securityEventSchema.index({ timestamp: -1 });
securityEventSchema.index({ severity: 1 });

module.exports = mongoose.model("SecurityEvent", securityEventSchema);
