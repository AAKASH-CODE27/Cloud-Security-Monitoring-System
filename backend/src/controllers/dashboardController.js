const dashboardService = require("../services/dashboardService");

async function getDashboard(req, res) {
  const summary = await dashboardService.getDashboardSummary();
  return res.status(200).json(summary);
}

async function getDashboardCharts(req, res) {
  const charts = await dashboardService.getDashboardChartsData(req.query.days);
  return res.status(200).json(charts);
}

module.exports = { getDashboard, getDashboardCharts };
