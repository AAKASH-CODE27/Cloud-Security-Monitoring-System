const os = require("os");
const Asset = require("../models/Asset");
const User = require("../models/User");
const Alert = require("../models/Alert");
const Incident = require("../models/Incident");
const Vulnerability = require("../models/Vulnerability");
const SecurityEvent = require("../models/SecurityEvent");
const stats = require("../utils/systemStats");
const { calculateSecurityScore } = require("./riskService");

async function getDashboardSummary() {
  const snapshot = await stats.getFullSnapshot();
  const processCount = await stats.getProcessCount();
  const network = await stats.getNetworkUsage();
  const totalMemGB = Math.round(os.totalmem() / 1024 / 1024 / 1024);

  const [
    assetCount,
    serverCount,
    endpointCount,
    userCount,
    openAlertsCount,
    openIncidentsCount,
    openVulnsCount,
    healthyAssetsCount,
    warningAssetsCount,
    criticalAssetsCount,
    recentAlerts,
    recentEvents,
    securityScore,
  ] = await Promise.all([
    Asset.countDocuments(),
    Asset.countDocuments({ assetType: "Server" }),
    Asset.countDocuments({ assetType: { $in: ["Workstation", "Endpoint", "Desktop"] } }),
    User.countDocuments(),
    Alert.countDocuments({ status: { $ne: "RESOLVED" } }),
    Incident.countDocuments({ status: { $ne: "RESOLVED" } }),
    Vulnerability.countDocuments({ status: { $ne: "PATCHED" } }),
    Asset.countDocuments({ health: "Healthy" }),
    Asset.countDocuments({ health: "Warning" }),
    Asset.countDocuments({ health: "Critical" }),
    Alert.find().sort({ createdAt: -1 }).limit(10),
    SecurityEvent.find().sort({ timestamp: -1 }).limit(8),
    calculateSecurityScore(),
  ]);

  return {
    assets: assetCount || processCount,
    servers: serverCount,
    endpoints: endpointCount || Math.max(0, assetCount - serverCount),
    users: userCount,

    alerts: openAlertsCount,
    incidents: openIncidentsCount,
    vulnerabilities: openVulnsCount,
    securityScore: securityScore,

    healthy: healthyAssetsCount,
    warning: warningAssetsCount,
    critical: criticalAssetsCount,
    offline: 0,

    cpu: snapshot.cpuUsage,
    memory: snapshot.memoryUsage,
    disk: snapshot.diskUsage,
    network: snapshot.networkUsage,
    gpu: snapshot.gpuUsage || 0,
    database: 1,

    upload: network.uploadMB,
    download: network.downloadMB,

    uptime: 99.99,

    cloud: [
      `${snapshot.operatingSystem} ${snapshot.osVersion}`,
      snapshot.processor,
      `${snapshot.cpuCores} Cores`,
      `${totalMemGB} GB RAM`,
    ],

    activities: recentEvents.map(
      (e) => `[${e.severity}] ${e.asset}: ${e.description}`
    ),

    recommendations: [
      "Ensure all workstations have antivirus active.",
      "Patch high & critical CVEs identified in Vulnerability Management.",
      "Enforce strong authentication policies across all user accounts.",
      "Review firewall rule exceptions on external gateway interfaces.",
    ],

    alertList: recentAlerts,
  };
}

async function getDashboardChartsData(daysParam = 30) {
  const days = Math.min(Math.max(Number(daysParam) || 30, 1), 365);

  // 1. Assets by Type Breakdown
  const assetsByType = await Asset.aggregate([
    { $group: { _id: "$assetType", value: { $sum: 1 } } },
  ]);

  let assets = assetsByType
    .filter((a) => a._id)
    .map((a) => ({ name: a._id, value: a.value }));

  if (assets.length === 0) {
    assets = [
      { name: "Workstation", value: 0 },
      { name: "Server", value: 0 },
    ];
  }

  // 2. Alerts by Severity Breakdown
  const alertsBySeverity = await Alert.aggregate([
    { $group: { _id: "$severity", count: { $sum: 1 } } },
  ]);

  const severityOrder = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const alertsMap = Object.fromEntries(alertsBySeverity.map((a) => [a._id, a.count]));
  const alerts = severityOrder.map((severity) => ({
    severity,
    count: alertsMap[severity] || 0,
  }));

  // 3. Time Series: Incidents & Vulnerabilities registered over time
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const incidentsGrouped = await Incident.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
  ]);

  const vulnsGrouped = await Vulnerability.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
  ]);

  const incidentsMap = Object.fromEntries(incidentsGrouped.map((item) => [item._id, item.count]));
  const vulnsMap = Object.fromEntries(vulnsGrouped.map((item) => [item._id, item.count]));

  const incidents = [];
  const vulnerabilities = [];

  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateLabel = d.toISOString().slice(0, 10);

    incidents.push({
      date: dateLabel,
      count: incidentsMap[dateLabel] || 0,
    });

    vulnerabilities.push({
      date: dateLabel,
      count: vulnsMap[dateLabel] || 0,
    });
  }

  return {
    assets,
    alerts,
    incidents,
    vulnerabilities,
  };
}

module.exports = {
  getDashboardSummary,
  getDashboardChartsData,
};
