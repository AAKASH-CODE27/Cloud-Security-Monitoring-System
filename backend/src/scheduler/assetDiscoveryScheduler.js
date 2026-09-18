const cron = require("node-cron");
const { discoverLocalAsset } = require("../services/assetDiscoveryService");

let isRunning = false;

async function runDiscoveryJob() {
  if (isRunning) {
    console.log("[Scheduler] Discovery job already in progress, skipping overlapping run.");
    return;
  }

  isRunning = true;

  try {
    console.log("[Scheduler] Starting periodic asset discovery & telemetry sync...");
    await discoverLocalAsset();
    console.log("[Scheduler] Asset discovery & telemetry sync completed.");
  } catch (error) {
    console.error("[Scheduler] Error during asset discovery job:", error.message);
  } finally {
    isRunning = false;
  }
}

function startScheduler() {
  if (process.env.ASSET_DISCOVERY_ENABLED === "false") {
    console.log("[Scheduler] Asset discovery disabled via ASSET_DISCOVERY_ENABLED=false");
    return;
  }

  // Single clean schedule: runs once every 5 minutes
  cron.schedule("*/5 * * * *", runDiscoveryJob);
  console.log("[Scheduler] Asset discovery scheduler started (Interval: every 5 minutes)");
}

module.exports = { startScheduler, runDiscoveryJob };
