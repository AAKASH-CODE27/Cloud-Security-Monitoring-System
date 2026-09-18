const assetService = require("../services/assetService");
const assetDiscoveryService = require("../services/assetDiscoveryService");
const networkScannerService = require("../services/networkScannerService");

async function getAllAssets(req, res) {
  const result = await assetService.getAssets(req.query);
  return res.status(200).json(result);
}

async function getAssetById(req, res) {
  const asset = await assetService.getAssetById(req.params.id);
  return res.status(200).json(asset);
}

async function createAsset(req, res) {
  const created = await assetService.createAsset(req.body);
  return res.status(201).json(created);
}

async function updateAsset(req, res) {
  const updated = await assetService.updateAsset(req.params.id, req.body);
  return res.status(200).json(updated);
}

async function deleteAsset(req, res) {
  const result = await assetService.deleteAsset(req.params.id);
  return res.status(200).json(result);
}

async function discoverAssets(req, res) {
  const asset = await assetDiscoveryService.discoverLocalAsset();
  const allAssets = await assetService.getAssets({ page: 1, limit: 100 });
  return res.status(200).json(allAssets);
}

async function scanNetwork(req, res) {
  const subnet = req.query.subnet;
  const discovered = await networkScannerService.scanSubnet(subnet);
  return res.status(200).json(discovered);
}

async function searchAssets(req, res) {
  const keyword = req.query.keyword || "";
  const result = await assetService.getAssets({ search: keyword, limit: 100 });
  return res.status(200).json(result.data);
}

async function getAssetsByDepartment(req, res) {
  const result = await assetService.getAssets({ department: req.params.department, limit: 100 });
  return res.status(200).json(result.data);
}

async function getAssetsByOwner(req, res) {
  const result = await assetService.getAssets({ owner: req.params.owner, limit: 100 });
  return res.status(200).json(result.data);
}

async function getAssetsByStatus(req, res) {
  const result = await assetService.getAssets({ status: req.params.status, limit: 100 });
  return res.status(200).json(result.data);
}

async function getAssetsByHealth(req, res) {
  const result = await assetService.getAssets({ health: req.params.health, limit: 100 });
  return res.status(200).json(result.data);
}

module.exports = {
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  discoverAssets,
  scanNetwork,
  searchAssets,
  getAssetsByDepartment,
  getAssetsByOwner,
  getAssetsByStatus,
  getAssetsByHealth,
};
