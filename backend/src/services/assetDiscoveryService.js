const Asset = require("../models/Asset");
const SecurityEvent = require("../models/SecurityEvent");
const Alert = require("../models/Alert");
const stats = require("../utils/systemStats");
const { emitToRoles } = require("../socket");

async function discoverLocalAsset() {
  const snapshot = await stats.getFullSnapshot();
  const currentIp = snapshot.ipAddress || stats.getIPAddress();
  const hostname = snapshot.hostname;
  const mac = snapshot.macAddress;

  // Search for existing asset by MAC, IP, or Hostname
  const searchOr = [{ hostname }];
  if (currentIp) searchOr.push({ ipAddress: currentIp });
  if (mac && mac !== "00:00:00:00:00:00") searchOr.push({ macAddress: mac });

  let asset = await Asset.findOne({ $or: searchOr });

  const now = new Date();
  let isNew = false;
  let prevHealth = null;

  if (asset) {
    prevHealth = asset.health;
    asset.cpuUsage = snapshot.cpuUsage;
    asset.memoryUsage = snapshot.memoryUsage;
    asset.diskUsage = snapshot.diskUsage;
    asset.networkUsage = snapshot.networkUsage;
    asset.health = snapshot.health;
    asset.lastSeen = now;
    asset.lastScan = now;

    await asset.save();

    // Avoid spamming: emit only if health state changed
    if (prevHealth !== snapshot.health) {
      emitToRoles(["ADMIN", "ITSM"], "asset:updated", asset);
    }
  } else {
    isNew = true;
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
      health: snapshot.health || "Healthy",
      riskScore: 0,
      availability: 100.0,
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

    emitToRoles(["ADMIN", "ITSM"], "asset:discovered", asset);

    const secEvent = await SecurityEvent.create({
      asset: asset.assetName,
      assetId: asset._id,
      eventType: "ASSET_DISCOVERED",
      severity: "INFO",
      description: `New asset ${hostname} (${currentIp}) discovered on local network.`,
      source: "Asset Discovery",
    });

    emitToRoles(["ADMIN", "ITSM"], "security:event", secEvent);
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

    emitToRoles(["ADMIN", "ITSM"], "security:event", criticalEvent);
    emitToRoles(["ADMIN", "ITSM"], "alert:created", criticalAlert);
  } else if (snapshot.health === "Warning" && (isNew || prevHealth !== "Warning")) {
    const warningEvent = await SecurityEvent.create({
      asset: asset.assetName,
      assetId: asset._id,
      eventType: "RESOURCE_WARNING",
      severity: "HIGH",
      description: `Host ${hostname} reached Warning threshold. CPU: ${snapshot.cpuUsage}%, Mem: ${snapshot.memoryUsage}%`,
      source: "Health Check",
    });

    emitToRoles(["ADMIN", "ITSM"], "security:event", warningEvent);
  }

  return asset;
}

module.exports = { discoverLocalAsset };
