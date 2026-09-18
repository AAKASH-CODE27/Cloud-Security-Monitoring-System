const Asset = require("../models/Asset");
const SecurityEvent = require("../models/SecurityEvent");
const Alert = require("../models/Alert");
const stats = require("../utils/systemStats");
const { getIO } = require("../socket");

async function discoverLocalAsset() {
  const snapshot = await stats.getFullSnapshot();
  const currentIp = snapshot.ipAddress || stats.getIPAddress();
  const hostname = snapshot.hostname;

  // Search for existing asset by IP or Hostname
  let asset = await Asset.findOne({
    $or: [{ ipAddress: currentIp }, { hostname }],
  });

  const now = new Date();
  const io = getIO();
  let isNew = false;
  let prevHealth = null;

  if (asset) {
    prevHealth = asset.health;
    // Update existing asset with REAL live metrics
    asset.cpuUsage = snapshot.cpuUsage;
    asset.memoryUsage = snapshot.memoryUsage;
    asset.diskUsage = snapshot.diskUsage;
    asset.networkUsage = snapshot.networkUsage;
    asset.health = snapshot.health;
    asset.riskScore = snapshot.riskScore;
    asset.lastSeen = now;
    asset.lastScan = now;

    await asset.save();

    // Avoid spamming: emit only if health changed
    if (io && prevHealth !== snapshot.health) {
      io.emit("asset:updated", asset);
    }
  } else {
    isNew = true;
    // Create new asset with REAL live metrics
    asset = await Asset.create({
      assetName: hostname,
      description: "Automatically discovered host workstation",
      assetType: "Workstation",
      manufacturer: "System Host",
      model: snapshot.architecture,
      deviceType: "Desktop",

      owner: "System Admin",
      department: "IT Operations",
      assignedDepartment: "IT Operations",
      assignedUser: "System Admin",
      assignedBy: "SentinelCore",
      assignmentStatus: "Assigned",
      assignedDate: now,
      location: "Local Network",

      hostname: hostname,
      ipAddress: currentIp,
      macAddress: snapshot.macAddress,
      wifiName: snapshot.wifiName,
      gateway: snapshot.gateway,
      dnsServer: snapshot.dnsServer,
      subnetMask: snapshot.subnetMask,

      operatingSystem: snapshot.operatingSystem,
      osVersion: snapshot.osVersion,
      architecture: snapshot.architecture,
      processor: snapshot.processor,
      cpuCores: snapshot.cpuCores,

      cpuUsage: snapshot.cpuUsage,
      memoryUsage: snapshot.memoryUsage,
      diskUsage: snapshot.diskUsage,
      networkUsage: snapshot.networkUsage,
      gpuUsage: snapshot.gpuUsage,

      status: "ACTIVE",
      health: snapshot.health,
      riskScore: snapshot.riskScore,
      availability: 99.99,
      vulnerabilityCount: 0,
      incidentCount: 0,
      patchLevel: "Latest",

      discoveredBy: "SentinelCore Auto Discovery",
      scanStatus: "Completed",
      scanDuration: "1 sec",
      discoveryDate: now,
      discoveryTime: now.toLocaleTimeString(),
      discoveredAt: now,
    });

    if (io) {
      io.emit("asset:discovered", asset);
    }

    // Log security event for newly discovered asset
    const secEvent = await SecurityEvent.create({
      asset: asset.assetName,
      assetId: asset._id,
      eventType: "ASSET_DISCOVERED",
      severity: "INFO",
      description: `New asset ${hostname} (${currentIp}) discovered on local network.`,
      source: "Asset Discovery",
    });

    if (io) {
      io.emit("security:event", secEvent);
    }
  }

  // Generate security alerts/events if resource usage is dangerously high
  if (snapshot.health === "Critical" && (isNew || prevHealth !== "Critical")) {
    const criticalEvent = await SecurityEvent.create({
      asset: asset.assetName,
      assetId: asset._id,
      eventType: "RESOURCE_CRITICAL",
      severity: "CRITICAL",
      description: `Host ${hostname} reached Critical threshold! CPU: ${snapshot.cpuUsage}%, Mem: ${snapshot.memoryUsage}%, Disk: ${snapshot.diskUsage}%`,
      source: "Health Check",
    });

    const criticalAlert = await Alert.create({
      title: `Critical Health Alert - ${hostname}`,
      severity: "CRITICAL",
      asset: hostname,
      assetName: hostname,
      category: "System Health",
      description: `Host ${hostname} reached Critical resource usage! CPU: ${snapshot.cpuUsage}%, Mem: ${snapshot.memoryUsage}%, Disk: ${snapshot.diskUsage}%`,
      status: "OPEN",
      assignedTo: "SOC Analyst",
      source: "Auto Discovery Monitor",
    });

    if (io) {
      io.emit("security:event", criticalEvent);
      io.emit("alert:created", criticalAlert);
    }
  } else if (snapshot.health === "Warning" && (isNew || prevHealth !== "Warning")) {
    const warningEvent = await SecurityEvent.create({
      asset: asset.assetName,
      assetId: asset._id,
      eventType: "RESOURCE_WARNING",
      severity: "HIGH",
      description: `Host ${hostname} reached Warning threshold. CPU: ${snapshot.cpuUsage}%, Mem: ${snapshot.memoryUsage}%`,
      source: "Health Check",
    });

    if (io) {
      io.emit("security:event", warningEvent);
    }
  }

  return asset;
}

module.exports = { discoverLocalAsset };
