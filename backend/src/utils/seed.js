require("dotenv").config();

const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");
const Asset = require("../models/Asset");
const Alert = require("../models/Alert");
const Incident = require("../models/Incident");
const Vulnerability = require("../models/Vulnerability");
const SecurityEvent = require("../models/SecurityEvent");
const mongoose = require("mongoose");

async function seed() {
  await connectDB();

  console.log("============================================");
  console.log("Seeding SentinelCore SecureOps Database...");
  console.log("============================================");

  // 1. Seed Users (ADMIN, ITSM, USER)
  const passwordHash = await bcrypt.hash("Admin@123", 10);

  const users = [
    {
      username: "admin",
      email: "admin@sentinelcore.com",
      password: passwordHash,
      department: "Security Operations",
      role: "ADMIN",
      designation: "Chief Information Security Officer",
      employeeId: "EMP-1001",
      phone: "+1-555-0192",
    },
    {
      username: "itsm_lead",
      email: "itsm@sentinelcore.com",
      password: passwordHash,
      department: "IT Services",
      role: "ITSM",
      designation: "IT Infrastructure Manager",
      employeeId: "EMP-1002",
      phone: "+1-555-0198",
    },
    {
      username: "john_user",
      email: "user@sentinelcore.com",
      password: passwordHash,
      department: "Engineering",
      role: "USER",
      designation: "Software Engineer",
      employeeId: "EMP-1003",
      phone: "+1-555-0143",
    },
  ];

  for (const u of users) {
    await User.findOneAndUpdate({ email: u.email }, u, { upsert: true, new: true });
  }
  console.log("✔ Users seeded (admin@sentinelcore.com, itsm@sentinelcore.com, user@sentinelcore.com / Pass: Admin@123)");

  // 2. Seed Assets
  const assetsData = [
    {
      assetName: "SEC-DC-01",
      description: "Primary Active Directory Domain Controller",
      assetType: "Server",
      hostname: "sec-dc-01.sentinelcore.internal",
      ipAddress: "192.168.1.10",
      macAddress: "00-15-5D-01-02-10",
      operatingSystem: "Windows Server 2022",
      processor: "Intel Xeon Platinum 8380",
      cpuCores: 16,
      cpuUsage: 34,
      memoryUsage: 62,
      diskUsage: 45,
      networkUsage: 128,
      department: "IT Infrastructure",
      owner: "itsm_lead",
      status: "ACTIVE",
      health: "Healthy",
      riskScore: 12,
    },
    {
      assetName: "APP-SRV-02",
      description: "Production Core Banking API Server",
      assetType: "Server",
      hostname: "app-srv-02.sentinelcore.internal",
      ipAddress: "192.168.1.20",
      macAddress: "00-15-5D-01-02-20",
      operatingSystem: "Ubuntu 22.04 LTS",
      processor: "AMD EPYC 7763",
      cpuCores: 32,
      cpuUsage: 88,
      memoryUsage: 91,
      diskUsage: 78,
      networkUsage: 450,
      department: "Engineering",
      owner: "john_user",
      status: "ACTIVE",
      health: "Warning",
      riskScore: 45,
    },
    {
      assetName: "DB-CLUSTER-01",
      description: "Primary PostgreSQL Database Cluster",
      assetType: "Server",
      hostname: "db-cluster-01.sentinelcore.internal",
      ipAddress: "192.168.1.30",
      macAddress: "00-15-5D-01-02-30",
      operatingSystem: "Red Hat Enterprise Linux 9",
      processor: "AMD EPYC 7763",
      cpuCores: 64,
      cpuUsage: 42,
      memoryUsage: 75,
      diskUsage: 82,
      networkUsage: 620,
      department: "Database Admin",
      owner: "admin",
      status: "ACTIVE",
      health: "Healthy",
      riskScore: 20,
    },
  ];

  for (const a of assetsData) {
    await Asset.findOneAndUpdate({ ipAddress: a.ipAddress }, a, { upsert: true, new: true });
  }
  console.log("✔ Sample assets seeded.");

  // 3. Seed Alerts
  const alertsData = [
    {
      title: "High Memory Utilization",
      severity: "HIGH",
      asset: "APP-SRV-02",
      assetName: "APP-SRV-02",
      category: "Resource Exhaustion",
      description: "RAM usage reached 91% on production API server.",
      status: "OPEN",
      assignedTo: "itsm_lead",
      source: "System Monitor",
    },
    {
      title: "Unpatched CVE Detected",
      severity: "CRITICAL",
      asset: "SEC-DC-01",
      assetName: "SEC-DC-01",
      category: "Vulnerability",
      description: "CVE-2024-30078 detected on Domain Controller host.",
      status: "OPEN",
      assignedTo: "admin",
      source: "Vulnerability Scanner",
    },
  ];

  await Alert.deleteMany({});
  await Alert.insertMany(alertsData);
  console.log("✔ Sample alerts seeded.");

  // 4. Seed Incidents
  const incidentsData = [
    {
      title: "High Memory Threshold Exceeded",
      description: "APP-SRV-02 experience high memory usage > 90% during peak operations.",
      severity: "HIGH",
      asset: "APP-SRV-02",
      assignedUser: "itsm_lead",
      status: "INVESTIGATING",
    },
    {
      title: "Multiple Failed SSH Logins",
      description: "Repeated unauthorized SSH connection attempts logged from internal segment 192.168.1.105.",
      severity: "CRITICAL",
      asset: "DB-CLUSTER-01",
      assignedUser: "admin",
      status: "OPEN",
    },
  ];

  await Incident.deleteMany({});
  await Incident.insertMany(incidentsData);
  console.log("✔ Sample incidents seeded.");

  // 5. Seed Vulnerabilities
  const vulnsData = [
    {
      vulnerabilityId: "VULN-2024-001",
      cve: "CVE-2024-30078",
      title: "Windows Kernel Remote Code Execution Vulnerability",
      description: "An elevation of privilege vulnerability in Windows Kernel allows code execution.",
      severity: "CRITICAL",
      cvss: 9.8,
      asset: "SEC-DC-01",
      status: "OPEN",
      patchLevel: "Pending",
      recommendation: "Apply June 2024 Security Update immediately.",
    },
    {
      vulnerabilityId: "VULN-2024-002",
      cve: "CVE-2024-21626",
      title: "runc Process Leak Container Escape",
      description: "File descriptor leak in runc allows container escape to host system.",
      severity: "HIGH",
      cvss: 8.6,
      asset: "APP-SRV-02",
      status: "PENDING_PATCH",
      patchLevel: "Scheduled",
      recommendation: "Upgrade runc package to version 1.1.12.",
    },
  ];

  await Vulnerability.deleteMany({});
  await Vulnerability.insertMany(vulnsData);
  console.log("✔ Sample vulnerabilities seeded.");

  // 6. Seed Security Events
  const eventsData = [
    {
      asset: "SEC-DC-01",
      eventType: "USER_LOGIN",
      severity: "INFO",
      description: "User admin authenticated successfully.",
      source: "Authentication Service",
    },
    {
      asset: "APP-SRV-02",
      eventType: "RESOURCE_WARNING",
      severity: "HIGH",
      description: "Memory threshold warning triggered (91%).",
      source: "Monitoring Service",
    },
  ];

  await SecurityEvent.deleteMany({});
  await SecurityEvent.insertMany(eventsData);
  console.log("✔ Sample security events seeded.");

  console.log("============================================");
  console.log("Database Seeding Completed Successfully!");
  console.log("============================================");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding Error:", err);
  process.exit(1);
});
