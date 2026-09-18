const dns = require("dns").promises;
const net = require("net");
const Asset = require("../models/Asset");

function pingHost(ip, port = 80, timeoutMs = 300) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);

    socket
      .once("connect", () => {
        socket.destroy();
        resolve(true);
      })
      .once("timeout", () => {
        socket.destroy();
        resolve(false);
      })
      .once("error", () => {
        socket.destroy();
        resolve(false);
      })
      .connect(port, ip);
  });
}

// Process items in concurrency-limited batches (e.g., batchSize = 10)
async function mapConcurrent(items, concurrencyLimit, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrencyLimit) {
    const chunk = items.slice(i, i + concurrencyLimit);
    const chunkResults = await Promise.all(chunk.map((item) => fn(item)));
    results.push(...chunkResults);
  }
  return results;
}

async function scanSubnet(subnet) {
  if (!subnet || !/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(subnet)) {
    const err = new Error("Invalid subnet query parameter. Expected format: e.g. 192.168.1");
    err.statusCode = 400;
    throw err;
  }

  const hosts = Array.from({ length: 254 }, (_, i) => `${subnet}.${i + 1}`);
  const discovered = [];

  // Limit concurrency to 10 hosts simultaneously
  await mapConcurrent(hosts, 10, async (ip) => {
    try {
      const isUp = await pingHost(ip);
      if (!isUp) return;

      let hostname = `Host-${ip.replace(/\./g, "-")}`;
      try {
        const names = await dns.reverse(ip);
        if (names && names.length > 0) hostname = names[0];
      } catch (e) {
        // Reverse DNS lookup failed/timed out, retain default fallback
      }

      let asset = await Asset.findOne({ ipAddress: ip });
      const now = new Date();

      if (!asset) {
        asset = new Asset({
          ipAddress: ip,
          hostname,
          assetName: hostname,
          assetType: "Server",
          department: "IT Network",
          owner: "Network Scanner",
        });
      }

      asset.status = "ACTIVE";
      asset.health = "Healthy";
      if (asset.riskScore == null) asset.riskScore = 0;
      if (asset.availability == null) asset.availability = 99.99;
      if (!asset.patchLevel) asset.patchLevel = "Latest";
      if (!asset.scanStatus) asset.scanStatus = "Completed";
      if (!asset.scanDuration) asset.scanDuration = "1 sec";

      asset.discoveryDate = now;
      asset.discoveryTime = now.toLocaleTimeString();
      asset.discoveredAt = now;
      asset.lastSeen = now;
      asset.lastScan = now;

      await asset.save();
      discovered.push(asset);
    } catch (err) {
      // Individual host failure must never crash scanner
    }
  });

  return discovered;
}

module.exports = { scanSubnet };
