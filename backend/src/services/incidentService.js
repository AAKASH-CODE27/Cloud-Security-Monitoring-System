const Incident = require("../models/Incident");
const { getIO } = require("../socket");

async function getIncidents({ page = 1, limit = 20, status, severity, search }) {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

  const query = {};
  if (status && status !== "ALL") query.status = status;
  if (severity && severity !== "ALL") query.severity = severity;

  if (search && search.trim() !== "") {
    const regex = new RegExp(search.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
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
    title: data.title,
    description: data.description,
    severity: data.severity || "MEDIUM",
    asset: data.asset || "Unspecified Asset",
    assignedUser: data.assignedUser || user.username,
    status: data.status || "OPEN",
    resolutionNotes: data.resolutionNotes || "",
  });

  try {
    const io = getIO();
    if (io) {
      io.emit("incident:created", newIncident);
    }
  } catch (socketErr) {
    console.warn("[incidentService] Failed to emit incident:created:", socketErr.message);
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
    }
  }

  if (data.title) incident.title = data.title;
  if (data.description) incident.description = data.description;
  if (data.severity) incident.severity = data.severity;
  if (data.assignedUser) incident.assignedUser = data.assignedUser;
  if (data.resolutionNotes != null) incident.resolutionNotes = data.resolutionNotes;

  const updatedIncident = await incident.save();

  try {
    const io = getIO();
    if (io) {
      io.emit("incident:updated", updatedIncident);
    }
  } catch (socketErr) {
    console.warn("[incidentService] Failed to emit incident:updated:", socketErr.message);
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

  await incident.deleteOne();
  return { message: "Incident deleted successfully" };
}

module.exports = {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident,
};
