import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FaBug,
  FaShieldVirus,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSyncAlt,
  FaSearch,
  FaPlus,
  FaCrosshairs,
} from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { toast } from "react-toastify";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Pagination from "./Pagination";
import { RealTimeStatusIndicator } from "./socket/RealTimeNotification";

import {
  getVulnerabilities,
  updateVulnerability,
  createVulnerability,
  scanVulnerabilities,
} from "./api/vulnerabilityApi";
import { getAssets } from "./api/assetApi";
import { useAuth } from "./AuthContext";
import { useSocket } from "./hooks/useSocket";

import "./Vulnerabilities.css";

function Vulnerabilities() {
  const { canManageVulnerabilities } = useAuth();
  const { socket } = useSocket();

  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Manual CVE modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newVuln, setNewVuln] = useState({
    cve: "",
    title: "",
    severity: "HIGH",
    cvss: 7.5,
    asset: "Global",
    description: "",
  });

  // Scanner modal state
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanForm, setScanForm] = useState({
    target: ".",
    scanType: "filesystem",
    assetId: "",
  });
  const [scanning, setScanning] = useState(false);
  const [assetsList, setAssetsList] = useState([]);

  const pageSize = 10;

  const fetchVulnerabilitiesData = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getVulnerabilities({ limit: 100 });
      const vulnList = response?.data?.data || response?.data || [];
      setVulnerabilities(Array.isArray(vulnList) ? vulnList : []);
    } catch (err) {
      console.error("Vulnerability load error:", err);
      setError("Unable to load vulnerabilities from server.");
      toast.error("Unable to load vulnerabilities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVulnerabilitiesData();

    // Fetch assets for scan dropdown
    getAssets({ limit: 50 })
      .then((res) => {
        const list = res?.data?.data || res?.data || [];
        setAssetsList(Array.isArray(list) ? list : []);
      })
      .catch((err) => console.warn("Could not load assets for scanner dropdown:", err));
  }, []);

  // Real-time Socket.IO listeners
  useEffect(() => {
    if (!socket) return;

    const onVulnCreated = (newVuln) => {
      setVulnerabilities((prev) => {
        const exists = prev.some(
          (v) =>
            v._id === newVuln._id ||
            v.vulnerabilityId === newVuln.vulnerabilityId ||
            (v.cve === newVuln.cve &&
              v.packageName === newVuln.packageName &&
              v.installedVersion === newVuln.installedVersion)
        );
        if (exists) {
          return prev.map((v) =>
            v._id === newVuln._id || v.vulnerabilityId === newVuln.vulnerabilityId
              ? newVuln
              : v
          );
        }
        return [newVuln, ...prev];
      });
      toast.info(`🛡️ New Vulnerability Logged: ${newVuln.cve}`);
    };

    const onVulnUpdated = (updatedVuln) => {
      setVulnerabilities((prev) =>
        prev.map((v) =>
          v._id === updatedVuln._id || v.vulnerabilityId === updatedVuln.vulnerabilityId
            ? updatedVuln
            : v
        )
      );
    };

    const onVulnResolved = (resolvedVuln) => {
      setVulnerabilities((prev) =>
        prev.map((v) =>
          v._id === resolvedVuln._id || v.vulnerabilityId === resolvedVuln.vulnerabilityId
            ? { ...v, status: "PATCHED", patchLevel: "Applied" }
            : v
        )
      );
      toast.success(`✅ Vulnerability Patched: ${resolvedVuln.cve}`);
    };

    socket.on("vulnerability:created", onVulnCreated);
    socket.on("vulnerability:updated", onVulnUpdated);
    socket.on("vulnerability:resolved", onVulnResolved);

    return () => {
      socket.off("vulnerability:created", onVulnCreated);
      socket.off("vulnerability:updated", onVulnUpdated);
      socket.off("vulnerability:resolved", onVulnResolved);
    };
  }, [socket]);

  const handleRefresh = async () => {
    await fetchVulnerabilitiesData();
    toast.success("Vulnerabilities refreshed.");
  };

  const handlePatchVulnerability = async (id) => {
    try {
      await updateVulnerability(id, { status: "PATCHED", patchLevel: "Applied" });
      toast.success("Vulnerability marked as PATCHED.");
      fetchVulnerabilitiesData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update vulnerability status.");
    }
  };

  const handleCreateVulnerability = async (e) => {
    e.preventDefault();
    try {
      await createVulnerability(newVuln);
      toast.success("Vulnerability CVE recorded.");
      setShowCreateModal(false);
      setNewVuln({
        cve: "",
        title: "",
        severity: "HIGH",
        cvss: 7.5,
        asset: "Global",
        description: "",
      });
      fetchVulnerabilitiesData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to record vulnerability.");
    }
  };

  const handleRunScan = async (e) => {
    e.preventDefault();
    try {
      setScanning(true);
      toast.info(`Starting Trivy ${scanForm.scanType} scan on '${scanForm.target}'...`);
      const payload = {
        target: scanForm.target.trim(),
        scanType: scanForm.scanType,
      };
      if (scanForm.assetId) {
        payload.assetId = scanForm.assetId;
      }
      const res = await scanVulnerabilities(payload);
      setShowScanModal(false);
      const summary = res.data;
      toast.success(
        `Scan complete! Found ${summary.totalFindings} vulnerabilities (${summary.counts.CRITICAL} Critical, ${summary.counts.HIGH} High).`
      );
      fetchVulnerabilitiesData();
    } catch (err) {
      console.error("Scan error:", err);
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 503
          ? "Trivy binary not found on server system. Please verify Trivy is installed."
          : "Vulnerability scan failed.");
      toast.error(msg);
    } finally {
      setScanning(false);
    }
  };

  const filteredVulnerabilities = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return vulnerabilities.filter((item) => {
      const matchesSearch =
        (item.cve || "").toLowerCase().includes(keyword) ||
        (item.title || "").toLowerCase().includes(keyword) ||
        (item.asset || "").toLowerCase().includes(keyword) ||
        (item.packageName || "").toLowerCase().includes(keyword);

      const matchesSeverity = severityFilter === "ALL" || item.severity === severityFilter;

      return matchesSearch && matchesSeverity;
    });
  }, [vulnerabilities, search, severityFilter]);

  const vulnerabilityCounts = useMemo(() => {
    return {
      total: vulnerabilities.length,
      critical: vulnerabilities.filter((item) => item.severity === "CRITICAL").length,
      high: vulnerabilities.filter((item) => item.severity === "HIGH").length,
      medium: vulnerabilities.filter((item) => item.severity === "MEDIUM").length,
      low: vulnerabilities.filter((item) => item.severity === "LOW").length,
    };
  }, [vulnerabilities]);

  const { total: totalVulnerabilities, critical, high, medium, low } = vulnerabilityCounts;

  const pieData = [
    { name: "Critical", value: critical },
    { name: "High", value: high },
    { name: "Medium", value: medium },
    { name: "Low", value: low },
  ];

  const COLORS = ["#ef4444", "#fb923c", "#f59e0b", "#22c55e"];
  const totalPages = Math.max(1, Math.ceil(filteredVulnerabilities.length / pageSize));
  const currentData = filteredVulnerabilities.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content">
        <Navbar />

        <motion.div
          className="vulnerability-page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="page-header">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <h1>Vulnerability Dashboard</h1>
                <RealTimeStatusIndicator />
              </div>
              <p>Real CVE tracking, automated Trivy security scanning, and patch management.</p>
              <small>Total tracked vulnerabilities: {totalVulnerabilities}</small>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {canManageVulnerabilities() && (
                <>
                  <button
                    type="button"
                    className="refresh-btn"
                    style={{
                      background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                      boxShadow: "0 0 12px rgba(99, 102, 241, 0.4)",
                    }}
                    onClick={() => setShowScanModal(true)}
                  >
                    <FaCrosshairs /> Trivy Scan
                  </button>
                  <button
                    type="button"
                    className="refresh-btn"
                    style={{ backgroundColor: "#0284c7" }}
                    onClick={() => setShowCreateModal(true)}
                  >
                    <FaPlus /> Record CVE
                  </button>
                </>
              )}
              <button
                type="button"
                className="refresh-btn"
                onClick={handleRefresh}
                disabled={loading}
              >
                <FaSyncAlt /> {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="summary-grid">
            <motion.div className="summary-card critical" whileHover={{ scale: 1.03 }}>
              <FaShieldVirus />
              <h2>{critical}</h2>
              <span>Critical</span>
            </motion.div>

            <motion.div className="summary-card high" whileHover={{ scale: 1.03 }}>
              <FaExclamationTriangle />
              <h2>{high}</h2>
              <span>High</span>
            </motion.div>

            <motion.div className="summary-card medium" whileHover={{ scale: 1.03 }}>
              <FaBug />
              <h2>{medium}</h2>
              <span>Medium</span>
            </motion.div>

            <motion.div className="summary-card low" whileHover={{ scale: 1.03 }}>
              <FaCheckCircle />
              <h2>{low}</h2>
              <span>Low</span>
            </motion.div>
          </div>

          <div className="toolbar">
            <div className="search-box">
              <FaSearch />
              <input
                type="text"
                placeholder="Search CVE, Title, Package, or Asset..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="ALL">All Severity</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="chart-grid">
            <motion.div
              className="chart-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h3>Severity Distribution</h3>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={110}
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`${entry.name}-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              className="chart-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h3>Severity Overview</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={pieData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#0284c7" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {loading && (
            <div className="loading-container">
              <div className="loader"></div>
              <h3>Loading Vulnerabilities...</h3>
            </div>
          )}

          {error && <div className="error-box">{error}</div>}

          {!loading && !error && filteredVulnerabilities.length > 0 && (
            <div className="table-container">
              <table className="vulnerability-table">
                <thead>
                  <tr>
                    <th>CVE</th>
                    <th>Title & Package</th>
                    <th>Source</th>
                    <th>Asset</th>
                    <th>Severity</th>
                    <th>CVSS</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((item) => (
                    <tr key={item._id || item.vulnerabilityId}>
                      <td>
                        <strong>{item.cve}</strong>
                      </td>
                      <td>
                        <div>{item.title}</div>
                        {item.packageName && (
                          <small style={{ color: "#94a3b8", display: "block" }}>
                            Pkg: {item.packageName}{" "}
                            {item.installedVersion ? `(${item.installedVersion})` : ""}
                            {item.fixedVersion ? ` → Fix: ${item.fixedVersion}` : ""}
                          </small>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            background:
                              item.source === "TRIVY"
                                ? "rgba(99, 102, 241, 0.2)"
                                : "rgba(148, 163, 184, 0.15)",
                            color: item.source === "TRIVY" ? "#818cf8" : "#94a3b8",
                            border: `1px solid ${
                              item.source === "TRIVY"
                                ? "rgba(99, 102, 241, 0.4)"
                                : "rgba(148, 163, 184, 0.2)"
                            }`,
                          }}
                        >
                          {item.source || "MANUAL"}
                        </span>
                      </td>
                      <td>{item.asset}</td>
                      <td>
                        <span
                          className={`severity-badge ${(
                            item.severity || "MEDIUM"
                          ).toLowerCase()}`}
                        >
                          {item.severity}
                        </span>
                      </td>
                      <td>{item.cvss}</td>
                      <td>
                        <span
                          className={`status-badge ${(
                            item.status || "OPEN"
                          ).toLowerCase()}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td>
                        {canManageVulnerabilities() && item.status !== "PATCHED" ? (
                          <button
                            className="patch-btn"
                            onClick={() => handlePatchVulnerability(item._id)}
                          >
                            Apply Patch
                          </button>
                        ) : (
                          <span style={{ color: "#22c55e", fontSize: "0.85rem" }}>
                            Patched
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && filteredVulnerabilities.length > pageSize && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}

          {/* Modal for creating a manual CVE record */}
          {showCreateModal && (
            <div className="modal-overlay">
              <div className="incident-modal" style={{ maxWidth: "500px" }}>
                <h2>Record New Vulnerability (CVE)</h2>
                <form
                  onSubmit={handleCreateVulnerability}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    marginTop: "15px",
                  }}
                >
                  <input
                    type="text"
                    placeholder="CVE Identifier (e.g. CVE-2024-30078)"
                    required
                    value={newVuln.cve}
                    onChange={(e) =>
                      setNewVuln({ ...newVuln, cve: e.target.value })
                    }
                    style={{
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #334155",
                      background: "#1e293b",
                      color: "#fff",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Title"
                    required
                    value={newVuln.title}
                    onChange={(e) =>
                      setNewVuln({ ...newVuln, title: e.target.value })
                    }
                    style={{
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #334155",
                      background: "#1e293b",
                      color: "#fff",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Target Asset Name"
                    value={newVuln.asset}
                    onChange={(e) =>
                      setNewVuln({ ...newVuln, asset: e.target.value })
                    }
                    style={{
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #334155",
                      background: "#1e293b",
                      color: "#fff",
                    }}
                  />
                  <div style={{ display: "flex", gap: "10px" }}>
                    <select
                      value={newVuln.severity}
                      onChange={(e) =>
                        setNewVuln({ ...newVuln, severity: e.target.value })
                      }
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #334155",
                        background: "#1e293b",
                        color: "#fff",
                      }}
                    >
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      placeholder="CVSS (e.g. 9.8)"
                      value={newVuln.cvss}
                      onChange={(e) =>
                        setNewVuln({
                          ...newVuln,
                          cvss: parseFloat(e.target.value),
                        })
                      }
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #334155",
                        background: "#1e293b",
                        color: "#fff",
                      }}
                    />
                  </div>
                  <textarea
                    placeholder="Description & Remediation Guidelines"
                    rows={3}
                    value={newVuln.description}
                    onChange={(e) =>
                      setNewVuln({ ...newVuln, description: e.target.value })
                    }
                    style={{
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #334155",
                      background: "#1e293b",
                      color: "#fff",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      justifyContent: "flex-end",
                      marginTop: "10px",
                    }}
                  >
                    <button
                      type="button"
                      className="close-btn"
                      style={{ background: "#475569" }}
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="close-btn"
                      style={{ background: "#0284c7" }}
                    >
                      Record CVE
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal for triggering Trivy Vulnerability Scan */}
          {showScanModal && (
            <div className="modal-overlay">
              <div className="incident-modal" style={{ maxWidth: "520px" }}>
                <h2>Launch Automated Vulnerability Scan (Trivy)</h2>
                <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "4px" }}>
                  Executes deep CVE inspection on target filesystem or container image.
                </p>
                <form
                  onSubmit={handleRunScan}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                    marginTop: "16px",
                  }}
                >
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", color: "#cbd5e1" }}>
                      Scan Target Type:
                    </label>
                    <select
                      value={scanForm.scanType}
                      onChange={(e) =>
                        setScanForm({ ...scanForm, scanType: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #334155",
                        background: "#1e293b",
                        color: "#fff",
                      }}
                    >
                      <option value="filesystem">Filesystem / Repository Directory</option>
                      <option value="image">Container Image (Docker / OCI)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", color: "#cbd5e1" }}>
                      {scanForm.scanType === "filesystem" ? "Directory Path:" : "Image Name / Tag:"}
                    </label>
                    <input
                      type="text"
                      placeholder={scanForm.scanType === "filesystem" ? "e.g. . or ./backend" : "e.g. node:18-alpine"}
                      required
                      value={scanForm.target}
                      onChange={(e) =>
                        setScanForm({ ...scanForm, target: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #334155",
                        background: "#1e293b",
                        color: "#fff",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", color: "#cbd5e1" }}>
                      Associate with Monitored Asset (Optional):
                    </label>
                    <select
                      value={scanForm.assetId}
                      onChange={(e) =>
                        setScanForm({ ...scanForm, assetId: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #334155",
                        background: "#1e293b",
                        color: "#fff",
                      }}
                    >
                      <option value="">-- No specific asset (Global) --</option>
                      {assetsList.map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.assetName} ({a.ipAddress || "No IP"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      justifyContent: "flex-end",
                      marginTop: "12px",
                    }}
                  >
                    <button
                      type="button"
                      className="close-btn"
                      style={{ background: "#475569" }}
                      disabled={scanning}
                      onClick={() => setShowScanModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="close-btn"
                      disabled={scanning}
                      style={{
                        background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                      }}
                    >
                      {scanning ? "Scanning Target..." : "Start Trivy Scan"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </motion.div>

        <Footer />
      </div>
    </div>
  );
}

export default Vulnerabilities;
