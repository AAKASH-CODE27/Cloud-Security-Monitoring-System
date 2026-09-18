const alertService = require("../services/alertService");

async function getAllAlerts(req, res) {
  const result = await alertService.getAlerts(req.query);
  return res.status(200).json(result);
}

async function getRecentAlerts(req, res) {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const alerts = await alertService.getRecentAlerts(limit);
  return res.status(200).json(alerts);
}

async function createAlert(req, res) {
  const alert = await alertService.createAlert(req.body);
  return res.status(201).json(alert);
}

async function updateAlert(req, res) {
  const status = req.body.status || "ACKNOWLEDGED";
  const alert = await alertService.updateAlertStatus(req.params.id, status, req.user);
  return res.status(200).json(alert);
}

async function deleteAlert(req, res) {
  const result = await alertService.deleteAlert(req.params.id, req.user);
  return res.status(200).json(result);
}

module.exports = { getAllAlerts, getRecentAlerts, createAlert, updateAlert, deleteAlert };
