const Asset = require("../models/Asset");
const Incident = require("../models/Incident");
const Vulnerability = require("../models/Vulnerability");
const SecurityEvent = require("../models/SecurityEvent");

/**
 * Calculates a dynamic Security Score (0 to 100) based on actual system state.
 * Formula:
 * Base = 100
 * - 10 per Critical Vulnerability (Open/Pending)
 * - 5 per High Vulnerability (Open/Pending)
 * - 8 per Critical/High Open Incident
 * - 5 per Unhealthy/Warning Asset
 * - 10 per Offline/Critical Asset
 * - 2 per High/Critical Security Event in last 24h
 * Clamped strictly between 0 and 100.
 */
async function calculateSecurityScore() {
  let score = 100;

  try {
    const [
      criticalVulns,
      highVulns,
      openIncidents,
      criticalAssets,
      warningAssets,
      recentCriticalEvents,
    ] = await Promise.all([
      Vulnerability.countDocuments({ severity: "CRITICAL", status: { $ne: "PATCHED" } }),
      Vulnerability.countDocuments({ severity: "HIGH", status: { $ne: "PATCHED" } }),
      Incident.countDocuments({
        severity: { $in: ["HIGH", "CRITICAL"] },
        status: { $in: ["OPEN", "ASSIGNED", "INVESTIGATING"] },
      }),
      Asset.countDocuments({ health: "Critical" }),
      Asset.countDocuments({ health: "Warning" }),
      SecurityEvent.countDocuments({
        severity: { $in: ["HIGH", "CRITICAL"] },
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
    ]);

    score -= criticalVulns * 10;
    score -= highVulns * 5;
    score -= openIncidents * 8;
    score -= criticalAssets * 10;
    score -= warningAssets * 5;
    score -= recentCriticalEvents * 2;

    return Math.max(0, Math.min(100, Math.round(score)));
  } catch (error) {
    console.error("Error calculating security score:", error);
    return 100;
  }
}

module.exports = { calculateSecurityScore };
