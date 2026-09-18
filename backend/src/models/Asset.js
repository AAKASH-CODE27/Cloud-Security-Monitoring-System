const mongoose = require("mongoose");

// ============================================================
// Asset Schema
// Equivalent to model/Asset.java
// ============================================================

const assetSchema = new mongoose.Schema(
  {
    // =====================================================
    // Asset Information
    // =====================================================

    assetName: { type: String, required: true },
    description: { type: String, maxlength: 3000 },
    assetType: String,
    assetTag: String,
    serialNumber: String,
    manufacturer: String,
    model: String,
    deviceType: String,

    // =====================================================
    // Ownership
    // =====================================================

    owner: String,
    department: String,
    assignedDepartment: String,
    assignedUser: String,
    assignedBy: String,
    assignmentStatus: String,
    assignedDate: Date,
    location: String,

    // =====================================================
    // Host Information
    // =====================================================

    hostname: String,
    ipAddress: { type: String, unique: true, sparse: true },
    macAddress: String,
    wifiName: String,
    gateway: String,
    subnetMask: String,
    dnsServer: String,

    // =====================================================
    // Operating System
    // =====================================================

    operatingSystem: String,
    osVersion: String,
    architecture: String,

    // =====================================================
    // Hardware
    // =====================================================

    processor: { type: String, maxlength: 500 },
    cpuCores: Number,
    cpuUsage: Number,
    memoryUsage: Number,
    diskUsage: Number,
    networkUsage: Number,
    gpuUsage: Number,

    // =====================================================
    // Security
    // =====================================================

    status: String,
    health: String,
    riskScore: Number,
    availability: Number,
    vulnerabilityCount: Number,
    incidentCount: Number,
    patchLevel: String,

    // =====================================================
    // Discovery
    // =====================================================

    discoveredBy: String,
    scanStatus: String,
    scanDuration: String,
    discoveryDate: Date,
    discoveryTime: String,
    discoveredAt: Date,

    // =====================================================
    // Audit Information
    // =====================================================

    lastSeen: Date,
    lastScan: Date,
  },
  {
    // createdAt / updatedAt handled automatically, mirroring
    // Asset.java's createdAt/updatedAt fields
    timestamps: true,
  }
);

assetSchema.index({ hostname: 1 });
assetSchema.index({ department: 1 });
assetSchema.index({ owner: 1 });
assetSchema.index({ status: 1 });
assetSchema.index({ health: 1 });
assetSchema.index({ createdAt: -1 });

// ============================================================
// @PrePersist equivalent — defaults applied only on insert
// ============================================================

assetSchema.pre("save", function (next) {
  const now = new Date();

  if (this.isNew) {
    this.lastSeen = now;
    this.lastScan = now;
    this.discoveredAt = now;
    this.discoveryDate = now;
    this.discoveryTime = now.toLocaleTimeString();

    if (!this.status) this.status = "ACTIVE";
    if (!this.health) this.health = "Healthy";
    if (!this.assignmentStatus) this.assignmentStatus = "Assigned";
    if (!this.scanStatus) this.scanStatus = "Completed";
    if (!this.scanDuration) this.scanDuration = "1 sec";

    if (this.availability == null) this.availability = 99.99;
    if (this.riskScore == null) this.riskScore = 0;
    if (this.vulnerabilityCount == null) this.vulnerabilityCount = 0;
    if (this.incidentCount == null) this.incidentCount = 0;
    if (!this.patchLevel) this.patchLevel = "Latest";

    if (!this.assignedDate) this.assignedDate = now;
    if (!this.assignedDepartment) this.assignedDepartment = this.department;
    if (!this.assignedUser) this.assignedUser = this.owner;
    if (!this.assignedBy) this.assignedBy = "SentinelCore";

    if (!this.discoveredBy) this.discoveredBy = "SentinelCore Auto Discovery";
  } else {
    // @PreUpdate equivalent
    this.lastSeen = now;
    this.lastScan = now;
  }

  next();
});

module.exports = mongoose.model("Asset", assetSchema);
