const Asset = require("../models/Asset");
const Incident = require("../models/Incident");
const Vulnerability = require("../models/Vulnerability");
const SecurityEvent = require("../models/SecurityEvent");
const { emitToRoles } = require("../socket");

/**
 * Calculates a dynamic Global Security Score (0 to 100) based on actual system state.
 * Global Security Score: HIGHER = BETTER security.
 * Asset Risk Score: HIGHER = GREATER risk.
 *
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

    let score = 100;
    score -= criticalVulns * 10;
    score -= highVulns * 5;
    score -= openIncidents * 8;
    score -= criticalAssets * 10;
    score -= warningAssets * 5;
    score -= recentCriticalEvents * 2;

    return Math.max(0, Math.min(100, Math.round(score)));
  } catch (error) {
    console.error("[riskService] Error calculating security score:", error);
    // Explicit unavailable state — never fake 100% security on database/query failure
    return null;
  }
}

/**
 * Recalculates an individual Asset's dynamic Risk Score (0 to 100) from its CURRENT active state.
 * Allows risk to decrease when vulnerabilities are patched or incidents resolved.
 */
async function recalculateAssetRisk(assetId) {
  if (!assetId) return null;

  try {
    const asset = await Asset.findById(assetId);
    if (!asset) return null;

    const [vulnCounts, incidentCount] = await Promise.all([
      Vulnerability.aggregate([
        {
          $match: {
            $or: [{ assetId: asset._id }, { asset: asset.assetName }],
            status: { $ne: "PATCHED" },
          },
        },
        { $group: { _id: "$severity", count: { $sum: 1 } } },
      ]),
      Incident.countDocuments({
        $or: [{ asset: asset.assetName }, { asset: asset.hostname }],
        status: { $in: ["OPEN", "ASSIGNED", "INVESTIGATING"] },
        severity: { $in: ["HIGH", "CRITICAL"] },
      }),
    ]);

    const countMap = Object.fromEntries(vulnCounts.map((v) => [v._id, v.count]));
    const critVulns = countMap.CRITICAL || 0;
    const highVulns = countMap.HIGH || 0;
    const medVulns = countMap.MEDIUM || 0;

    let healthPenalty = 0;
    if (asset.health?.toLowerCase() === "critical") healthPenalty = 30;
    else if (asset.health?.toLowerCase() === "warning") healthPenalty = 15;

    const computedRisk = Math.min(
      100,
      Math.max(
        0,
        healthPenalty + critVulns * 25 + highVulns * 15 + medVulns * 5 + incidentCount * 20
      )
    );

    const totalOpenVulns = critVulns + highVulns + medVulns + (countMap.LOW || 0);
    asset.vulnerabilityCount = totalOpenVulns;
    asset.incidentCount = incidentCount;
    asset.riskScore = computedRisk;
    await asset.save();

    emitToRoles(["ADMIN", "ITSM"], "asset:updated", asset);
    return asset;
  } catch (err) {
    console.error(`[riskService] Error recalculating risk for asset ${assetId}:`, err);
    return null;
  }
}

module.exports = { calculateSecurityScore, recalculateAssetRisk };
