const incidentService = require("../services/incidentService");

async function getIncidents(req, res) {
  const result = await incidentService.getIncidents(req.query);
  return res.status(200).json(result);
}

async function getIncidentById(req, res) {
  const incident = await incidentService.getIncidentById(req.params.id);
  return res.status(200).json(incident);
}

async function createIncident(req, res) {
  const created = await incidentService.createIncident(req.body, req.user);
  return res.status(201).json(created);
}

async function updateIncident(req, res) {
  const updated = await incidentService.updateIncident(req.params.id, req.body, req.user);
  return res.status(200).json(updated);
}

async function deleteIncident(req, res) {
  const result = await incidentService.deleteIncident(req.params.id, req.user);
  return res.status(200).json(result);
}

module.exports = {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident,
};
