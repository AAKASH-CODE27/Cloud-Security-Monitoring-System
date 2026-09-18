const os = require("os");
const dns = require("dns");
const si = require("systeminformation");

// ============================================================
// System Stats Helper
//
// Equivalent to the OSHI-based helper methods inside
// AssetServiceImpl.java and DashboardServiceImpl.java.
//
// IMPORTANT (kept for parity with the original app, per request):
// Just like the Spring Boot version, these functions read the
// stats of the machine the BACKEND process is running on, not the
// actual remote/client asset. This is a known quirk of the source
// project, preserved intentionally rather than "fixed".
// ============================================================

// =====================================================
// Host Name
// =====================================================

function getHostName() {
  try {
    return os.hostname();
  } catch (e) {
    return "Unknown";
  }
}

// =====================================================
// Local IP Address
// =====================================================

function getIPAddress() {
  try {
    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === "IPv4" && !iface.internal) {
          return iface.address;
        }
      }
    }

    return "0.0.0.0";
  } catch (e) {
    return "0.0.0.0";
  }
}

// =====================================================
// MAC Address
// =====================================================

function getMacAddress() {
  try {
    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === "IPv4" && !iface.internal && iface.mac) {
          return iface.mac.toUpperCase().replace(/:/g, "-");
        }
      }
    }

    return "Unknown";
  } catch (e) {
    return "Unknown";
  }
}

// =====================================================
// Connected Wi-Fi SSID
// =====================================================

async function getWifiSSID() {
  try {
    const connections = await si.wifiConnections();

    if (connections && connections.length > 0) {
      return connections[0].ssid || "Unknown";
    }

    return "Unsupported";
  } catch (e) {
    return "Unknown";
  }
}

// =====================================================
// Default Gateway
// =====================================================

async function getGateway() {
  try {
    const defaultIface = await si.networkGatewayDefault();
    return defaultIface || "Unknown";
  } catch (e) {
    return "Unknown";
  }
}

// =====================================================
// DNS Servers
// =====================================================

function getDnsServer() {
  try {
    return dns.getServers().join(", ") || "Unknown";
  } catch (e) {
    return "Unknown";
  }
}

// =====================================================
// CPU Info (processor name + core count)
// =====================================================

async function getCpuInfo() {
  try {
    const cpu = await si.cpu();

    return {
      processor: `${cpu.manufacturer} ${cpu.brand}`.trim(),
      cores: cpu.physicalCores || os.cpus().length,
    };
  } catch (e) {
    return {
      processor: "Unknown",
      cores: os.cpus().length,
    };
  }
}

// =====================================================
// CPU Usage (%)
// =====================================================

async function getCpuUsage() {
  try {
    const load = await si.currentLoad();
    return Math.round(load.currentLoad);
  } catch (e) {
    return 0;
  }
}

// =====================================================
// Memory Usage (%)
// =====================================================

async function getMemoryUsage() {
  try {
    const mem = await si.mem();
    return Math.round(((mem.total - mem.available) / mem.total) * 100);
  } catch (e) {
    const total = os.totalmem();
    const free = os.freemem();
    return Math.round(((total - free) / total) * 100);
  }
}

// =====================================================
// Disk Usage (%)
// =====================================================

async function getDiskUsage() {
  try {
    const disks = await si.fsSize();

    if (disks && disks.length > 0) {
      return Math.round(disks[0].use);
    }

    return 0;
  } catch (e) {
    return 0;
  }
}

// =====================================================
// Network Usage (MB, cumulative sent+received)
// =====================================================

async function getNetworkUsage() {
  try {
    const stats = await si.networkStats();

    let bytesSent = 0;
    let bytesRecv = 0;

    stats.forEach((n) => {
      bytesSent += n.tx_bytes || 0;
      bytesRecv += n.rx_bytes || 0;
    });

    return {
      usageMB: Math.round((bytesSent + bytesRecv) / 1024 / 1024),
      uploadMB: Math.round(bytesSent / 1024 / 1024),
      downloadMB: Math.round(bytesRecv / 1024 / 1024),
    };
  } catch (e) {
    return { usageMB: 0, uploadMB: 0, downloadMB: 0 };
  }
}

// =====================================================
// OS Info
// =====================================================

function getOsInfo() {
  return {
    operatingSystem: os.type(),
    osVersion: os.release(),
    architecture: os.arch(),
  };
}

// =====================================================
// Process Count (equivalent to
// systemInfo.getOperatingSystem().getProcessCount())
// =====================================================

async function getProcessCount() {
  try {
    const processes = await si.processes();
    return processes.all;
  } catch (e) {
    return 0;
  }
}

// =====================================================
// Health / Risk Score
// Same thresholds as AssetServiceImpl.java
// =====================================================

function computeHealth(cpuUsage, memoryUsage, diskUsage) {
  if (cpuUsage >= 90 || memoryUsage >= 90 || diskUsage >= 90) {
    return "Critical";
  }

  if (cpuUsage >= 70 || memoryUsage >= 70 || diskUsage >= 70) {
    return "Warning";
  }

  return "Healthy";
}

function computeRiskScore(cpuUsage, memoryUsage, diskUsage, networkUsage, health) {
  let risk = 0;

  if (cpuUsage > 80) risk += 20;
  if (memoryUsage > 80) risk += 20;
  if (diskUsage > 80) risk += 20;
  if (networkUsage > 500) risk += 20;
  if (health === "Critical") risk += 20;

  return Math.min(risk, 100);
}

// =====================================================
// Full Snapshot — everything AssetServiceImpl.createAsset()
// and updateAsset() gather about the host machine
// =====================================================

async function getFullSnapshot() {
  const cpuInfo = await getCpuInfo();
  const cpuUsage = await getCpuUsage();
  const memoryUsage = await getMemoryUsage();
  const diskUsage = await getDiskUsage();
  const network = await getNetworkUsage();
  const osInfo = getOsInfo();
  const wifiName = await getWifiSSID();
  const gateway = await getGateway();

  const health = computeHealth(cpuUsage, memoryUsage, diskUsage);
  const riskScore = computeRiskScore(
    cpuUsage,
    memoryUsage,
    diskUsage,
    network.usageMB,
    health
  );

  return {
    hostname: getHostName(),
    ipAddress: getIPAddress(),
    macAddress: getMacAddress(),
    wifiName,
    gateway,
    dnsServer: getDnsServer(),
    subnetMask: "255.255.255.0",

    operatingSystem: osInfo.operatingSystem,
    osVersion: osInfo.osVersion,
    architecture: osInfo.architecture,

    processor: cpuInfo.processor,
    cpuCores: cpuInfo.cores,
    cpuUsage,
    memoryUsage,
    diskUsage,
    networkUsage: network.usageMB,
    gpuUsage: 35, // hardcoded in the original app too

    health,
    riskScore,
  };
}

module.exports = {
  getHostName,
  getIPAddress,
  getMacAddress,
  getWifiSSID,
  getGateway,
  getDnsServer,
  getCpuInfo,
  getCpuUsage,
  getMemoryUsage,
  getDiskUsage,
  getNetworkUsage,
  getOsInfo,
  getProcessCount,
  computeHealth,
  computeRiskScore,
  getFullSnapshot,
};
