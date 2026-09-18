const Asset = require("../models/Asset");
const stats = require("../utils/systemStats");
const { getIO } = require("../socket");

// Regex escaping helper to prevent regex injection attacks
function escapeRegex(text) {
  return String(text).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

async function getAssets({ page = 1, limit = 20, search = "", status, health, department, owner, assetType }) {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

  const query = {};

  if (search && search.trim() !== "") {
    const escaped = escapeRegex(search.trim());
    const regex = new RegExp(escaped, "i");
    query.$or = [
      { assetName: regex },
      { hostname: regex },
      { ipAddress: regex },
      { department: regex },
      { owner: regex },
      { operatingSystem: regex },
      { assetType: regex },
    ];
  }

  if (status) query.status = status;
  if (health) query.health = health;
  if (department) query.department = department;
  if (owner) query.owner = owner;
  if (assetType) query.assetType = assetType;

  const total = await Asset.countDocuments(query);
  const totalPages = Math.ceil(total / limit) || 1;

  const data = await Asset.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

async function getAssetById(id) {
  const asset = await Asset.findById(id);
  if (!asset) {
    const err = new Error(`Asset not found with id: ${id}`);
    err.statusCode = 404;
    throw err;
  }
  return asset;
}

async function createAsset(body) {
  const snapshot = await stats.getFullSnapshot();

  const asset = new Asset({
    assetName: body.assetName || snapshot.hostname,
    description: body.description || "Monitored Asset",
    assetType: body.assetType || "Workstation",
    assetTag: body.assetTag,
    serialNumber: body.serialNumber,
    manufacturer: body.manufacturer || "Generic",
    model: body.model || "Standard",
    deviceType: body.deviceType || "Desktop",

    owner: body.owner || "Unassigned",
    department: body.department || "IT",
    assignedDepartment: body.department || "IT",
    assignedUser: body.owner || "Unassigned",
    assignedBy: "SentinelCore Admin",
    assignmentStatus: "Assigned",
    assignedDate: new Date(),
    location: body.location || "Primary HQ",

    hostname: body.hostname || snapshot.hostname,
    ipAddress: body.ipAddress || snapshot.ipAddress,
    macAddress: body.macAddress || snapshot.macAddress,
    wifiName: snapshot.wifiName,
    gateway: snapshot.gateway,
    dnsServer: snapshot.dnsServer,
    subnetMask: snapshot.subnetMask,

    operatingSystem: body.operatingSystem || snapshot.operatingSystem,
    osVersion: snapshot.osVersion,
    architecture: snapshot.architecture,

    processor: snapshot.processor,
    cpuCores: snapshot.cpuCores,
    cpuUsage: snapshot.cpuUsage,
    memoryUsage: snapshot.memoryUsage,
    diskUsage: snapshot.diskUsage,
    networkUsage: snapshot.networkUsage,
    gpuUsage: snapshot.gpuUsage,

    health: snapshot.health,
    status: body.status || "ACTIVE",
    riskScore: snapshot.riskScore,

    availability: 99.99,
    vulnerabilityCount: 0,
    incidentCount: 0,
    patchLevel: "Latest",

    discoveredBy: "Manual / SentinelCore",
    scanStatus: "Completed",
    scanDuration: "1 sec",
    discoveryDate: new Date(),
    discoveryTime: new Date().toLocaleTimeString(),
    discoveredAt: new Date(),
  });

  const savedAsset = await asset.save();

  try {
    const io = getIO();
    if (io) {
      io.emit("asset:created", savedAsset);
    }
  } catch (socketErr) {
    console.warn("[assetService] Failed to emit asset:created:", socketErr.message);
  }

  return savedAsset;
}

async function updateAsset(id, body) {
  const asset = await Asset.findById(id);
  if (!asset) {
    const err = new Error(`Asset not found with id: ${id}`);
    err.statusCode = 404;
    throw err;
  }

  if (body.assetName) asset.assetName = body.assetName;
  if (body.description) asset.description = body.description;
  if (body.assetType) asset.assetType = body.assetType;
  if (body.owner) {
    asset.owner = body.owner;
    asset.assignedUser = body.owner;
  }
  if (body.department) {
    asset.department = body.department;
    asset.assignedDepartment = body.department;
  }
  if (body.location) asset.location = body.location;
  if (body.status) asset.status = body.status;
  if (body.health) asset.health = body.health;
  if (body.riskScore != null) asset.riskScore = body.riskScore;

  const updatedAsset = await asset.save();

  try {
    const io = getIO();
    if (io) {
      io.emit("asset:updated", updatedAsset);
    }
  } catch (socketErr) {
    console.warn("[assetService] Failed to emit asset:updated:", socketErr.message);
  }

  return updatedAsset;
}

async function deleteAsset(id) {
  const asset = await Asset.findById(id);
  if (!asset) {
    const err = new Error(`Asset not found with id: ${id}`);
    err.statusCode = 404;
    throw err;
  }
  await asset.deleteOne();
  return { message: "Asset deleted successfully." };
}

module.exports = {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  escapeRegex,
};
