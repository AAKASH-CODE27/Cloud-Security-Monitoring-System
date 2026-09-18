const Incident = require("../models/Incident");
const Asset = require("../models/Asset");
const { emitToRoles } = require("../socket");
const { escapeRegex } = require("../utils/escapeRegex");
const { recalculateAssetRisk } = require("./riskService");

async function getIncidents({ page = 1, limit = 20, status, severity, search }) {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

  const query = {};
  if (status && status !== "ALL") query.status = status;
  if (severity && severity !== "ALL") query.severity = severity;

  if (search && search.trim() !== "") {
    const escaped = escapeRegex(search.trim());
    const regex = new RegExp(escaped, "i");
    query.$or = [{ title: regex }, { asset: regex }, { description: regex }, { assignedUser: regex }];
  }

  const total = await Incident.countDocuments(query);
  const totalPages = Math.ceil(total / limit) || 1;

  const data = await Incident.find(query)
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

async function getIncidentById(id) {
  const incident = await Incident.findById(id);
  if (!incident) {
    const err = new Error("Incident not found");
    err.statusCode = 404;
    throw err;
  }
  return incident;
}

async function createIncident(data, user) {
  if (user.role === "USER") {
    const err = new Error("Regular users cannot create security incidents.");
    err.statusCode = 403;
    throw err;
  }

  if (!data.title || !data.description) {
    const err = new Error("Title and description are required.");
    err.statusCode = 400;
    throw err;
  }

  const newIncident = await Incident.create({
    title: data.title.trim(),
    description: data.description.trim(),
    severity: data.severity || "MEDIUM",
    asset: data.asset ? data.asset.trim() : "Unspecified Asset",
    assignedUser: data.assignedUser || user.username,
    status: data.status || "OPEN",
    resolutionNotes: data.resolutionNotes || "",
  });

  emitToRoles(["ADMIN", "ITSM"], "incident:created", newIncident);

  // If incident belongs to a known asset, trigger risk recalculation
  if (newIncident.asset) {
    const matchedAsset = await Asset.findOne({
      $or: [{ assetName: newIncident.asset }, { hostname: newIncident.asset }],
    });
    if (matchedAsset) {
      await recalculateAssetRisk(matchedAsset._id);
    }
  }

  return newIncident;
}

async function updateIncident(id, data, user) {
  if (user.role === "USER") {
    const err = new Error("Regular users cannot update security incidents.");
    err.statusCode = 403;
    throw err;
  }

  const incident = await Incident.findById(id);
  if (!incident) {
    const err = new Error("Incident not found");
    err.statusCode = 404;
    throw err;
  }

  const validStatuses = ["OPEN", "ASSIGNED", "INVESTIGATING", "MITIGATED", "RESOLVED"];
  if (data.status) {
    if (!validStatuses.includes(data.status)) {
      const err = new Error("Invalid incident status.");
      err.statusCode = 400;
      throw err;
    }
    incident.status = data.status;
    if (data.status === "RESOLVED") {
      incident.resolvedAt = new Date();
    } else {
      incident.resolvedAt = null;
    }
  }

  if (data.title) incident.title = data.title;
  if (data.description) incident.description = data.description;
  if (data.severity) incident.severity = data.severity;
  if (data.assignedUser) incident.assignedUser = data.assignedUser;
  if (data.resolutionNotes != null) incident.resolutionNotes = data.resolutionNotes;

  const updatedIncident = await incident.save();

  emitToRoles(["ADMIN", "ITSM"], "incident:updated", updatedIncident);

  // Recalculate asset risk upon status changes (e.g., when mitigated or resolved)
  if (updatedIncident.asset) {
    const matchedAsset = await Asset.findOne({
      $or: [{ assetName: updatedIncident.asset }, { hostname: updatedIncident.asset }],
    });
    if (matchedAsset) {
      await recalculateAssetRisk(matchedAsset._id);
    }
  }

  return updatedIncident;
}

async function deleteIncident(id, user) {
  if (user.role !== "ADMIN") {
    const err = new Error("Only ADMIN can delete incidents.");
    err.statusCode = 403;
    throw err;
  }

  const incident = await Incident.findById(id);
  if (!incident) {
    const err = new Error("Incident not found");
    err.statusCode = 404;
    throw err;
  }

  const assetName = incident.asset;
  await incident.deleteOne();

  if (assetName) {
    const matchedAsset = await Asset.findOne({
      $or: [{ assetName }, { hostname: assetName }],
    });
    if (matchedAsset) {
      await recalculateAssetRisk(matchedAsset._id);
    }
  }

  return { message: "Incident deleted successfully" };
}

module.exports = {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident,
};
