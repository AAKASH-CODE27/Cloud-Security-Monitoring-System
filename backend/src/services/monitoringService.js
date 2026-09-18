const stats = require("../utils/systemStats");

/**
 * Collects a normalized snapshot of system monitoring telemetry.
 */
async function getMonitoringTelemetry() {
  const snapshot = await stats.getFullSnapshot();
  const processCount = await stats.getProcessCount();

  return {
    ...snapshot,
    processCount,
    timestamp: new Date().toISOString(),
  };
}

module.exports = { getMonitoringTelemetry };
