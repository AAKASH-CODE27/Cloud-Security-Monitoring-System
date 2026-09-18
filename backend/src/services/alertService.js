const Alert = require("../models/Alert");
const { getIO } = require("../socket");

async function getAlerts({ page = 1, limit = 20, severity, status, category }) {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

  const query = {};
  if (severity) query.severity = severity;
  if (status) query.status = status;
  if (category) query.category = category;

  const total = await Alert.countDocuments(query);
  const totalPages = Math.ceil(total / limit) || 1;

  const data = await Alert.find(query)
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

async function getRecentAlerts(limitCount = 10) {
  return await Alert.find().sort({ createdAt: -1 }).limit(limitCount);
}

async function createAlert(alertData) {
  if (!alertData.description) {
    const err = new Error("Alert description is required.");
    err.statusCode = 400;
    throw err;
  }

  const newAlert = await Alert.create({
    title: alertData.title || alertData.category || "Security Alert",
    severity: alertData.severity || "MEDIUM",
    asset: alertData.asset || "System",
    assetName: alertData.assetName || alertData.asset || "System",
    category: alertData.category || "General",
    description: alertData.description,
    status: "OPEN",
    assignedTo: alertData.assignedTo || "SOC Analyst",
    source: alertData.source || "SentinelCore",
  });

  try {
    const io = getIO();
    if (io) {
      io.emit("alert:created", newAlert);
    }
  } catch (socketErr) {
    console.warn("[alertService] Failed to emit alert:created:", socketErr.message);
  }

  return newAlert;
}

async function updateAlertStatus(id, newStatus, user) {
  const alert = await Alert.findById(id);
  if (!alert) {
    const err = new Error("Alert not found");
    err.statusCode = 404;
    throw err;
  }

  const validStatuses = ["OPEN", "ACKNOWLEDGED", "RESOLVED"];
  if (!validStatuses.includes(newStatus)) {
    const err = new Error("Invalid alert status");
    err.statusCode = 400;
    throw err;
  }

  alert.status = newStatus;
  const now = new Date();
  if (newStatus === "ACKNOWLEDGED" && !alert.acknowledgedAt) {
    alert.acknowledgedAt = now;
  } else if (newStatus === "RESOLVED") {
    alert.resolvedAt = now;
  }

  const updatedAlert = await alert.save();

  try {
    const io = getIO();
    if (io) {
      io.emit("alert:updated", updatedAlert);
    }
  } catch (socketErr) {
    console.warn("[alertService] Failed to emit alert:updated:", socketErr.message);
  }

  return updatedAlert;
}

async function deleteAlert(id, user) {
  if (user.role !== "ADMIN") {
    const err = new Error("Only ADMIN can delete alerts.");
    err.statusCode = 403;
    throw err;
  }

  const alert = await Alert.findById(id);
  if (!alert) {
    const err = new Error("Alert not found");
    err.statusCode = 404;
    throw err;
  }

  await alert.deleteOne();
  return { message: "Alert deleted successfully" };
}

module.exports = {
  getAlerts,
  getRecentAlerts,
  createAlert,
  updateAlertStatus,
  deleteAlert,
};
