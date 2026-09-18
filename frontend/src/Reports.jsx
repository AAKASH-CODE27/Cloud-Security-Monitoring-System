// src/Reports.jsx

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

import {
  FaFilePdf,
  FaFileExcel,
  FaFileCsv,
  FaChartBar,
  FaSyncAlt,
  FaServer,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

import { toast } from "react-toastify";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";

import { getAssets } from "./api/assetsApi";

import {
  exportToPDF,
  exportToExcel,
  exportToCSV,
} from "./api/ExportService";

import "./Reports.css";

const COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

function Reports() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD ASSETS
  // =========================================================

  const loadAssets = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAssets();

      const data = Array.isArray(response?.data)
        ? response.data
        : [];

      setAssets(data);
    } catch (err) {
      console.error("Reports load error:", err);

      setError("Unable to load reports.");

      toast.error("Unable to load report data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  // =========================================================
  // NORMALIZE ASSET DATA
  // =========================================================

  const normalizedAssets = useMemo(() => {
    return assets.map((asset) => ({
      ...asset,

      id: asset.id,

      // AssetForm -> Report
      name: asset.assetName || asset.name || "-",

      vendor:
        asset.manufacturer ||
        asset.vendor ||
        "-",

      department:
        asset.department ||
        asset.assignedDepartment ||
        "-",

      owner: asset.owner || "-",

      // Asset / backend -> Report
      ip:
        asset.ipAddress ||
        asset.ip ||
        "-",

      os:
        asset.operatingSystem ||
        asset.os ||
        "-",

      status: asset.status || "-",

      health: asset.health || "-",

      riskScore: Number(asset.riskScore || 0),

      patchLevel: asset.patchLevel || "-",

      cpu: Number(asset.cpu ?? asset.cpuUsage ?? 0),

      memory: Number(
        asset.memory ??
          asset.memoryUsage ??
          0
      ),

      disk: Number(
        asset.disk ??
          asset.diskUsage ??
          0
      ),
    }));
  }, [assets]);

  // =========================================================
  // SUMMARY
  // =========================================================

  const totalAssets = normalizedAssets.length;

  const activeAssets = normalizedAssets.filter(
    (asset) =>
      String(asset.status).toLowerCase() === "active"
  ).length;

  const inactiveAssets = normalizedAssets.filter(
    (asset) =>
      String(asset.status).toLowerCase() === "inactive"
  ).length;

  const healthyAssets = normalizedAssets.filter(
    (asset) =>
      String(asset.health).toLowerCase() === "healthy"
  ).length;

  const warningAssets = normalizedAssets.filter(
    (asset) =>
      String(asset.health).toLowerCase() === "warning"
  ).length;

  const criticalAssets = normalizedAssets.filter(
    (asset) =>
      String(asset.health).toLowerCase() === "critical"
  ).length;

  // =========================================================
  // STATUS DATA
  // =========================================================

  const statusData = [
    {
      name: "Active",
      value: activeAssets,
    },
    {
      name: "Inactive",
      value: inactiveAssets,
    },
  ];

  // =========================================================
  // HEALTH DATA
  // =========================================================

  const healthData = [
    {
      name: "Healthy",
      value: healthyAssets,
    },
    {
      name: "Warning",
      value: warningAssets,
    },
    {
      name: "Critical",
      value: criticalAssets,
    },
  ];

  // =========================================================
  // DEPARTMENT DATA
  // =========================================================

  const departmentData = useMemo(() => {
    const map = {};

    normalizedAssets.forEach((asset) => {
      const department = asset.department || "Unknown";

      map[department] =
        (map[department] || 0) + 1;
    });

    return Object.keys(map).map((key) => ({
      name: key,
      value: map[key],
    }));
  }, [normalizedAssets]);

  // =========================================================
  // VENDOR DATA
  // =========================================================

  const vendorData = useMemo(() => {
    const map = {};

    normalizedAssets.forEach((asset) => {
      const vendor = asset.vendor || "Unknown";

      map[vendor] =
        (map[vendor] || 0) + 1;
    });

    return Object.keys(map).map((key) => ({
      name: key,
      value: map[key],
    }));
  }, [normalizedAssets]);

  // =========================================================
  // OPERATING SYSTEM DATA
  // =========================================================

  const osData = useMemo(() => {
    const map = {};

    normalizedAssets.forEach((asset) => {
      const os = asset.os || "Unknown";

      map[os] = (map[os] || 0) + 1;
    });

    return Object.keys(map).map((key) => ({
      name: key,
      value: map[key],
    }));
  }, [normalizedAssets]);

  // =========================================================
  // PATCH COMPLIANCE
  // =========================================================

  const patchData = useMemo(() => {
    const latest = normalizedAssets.filter(
      (asset) =>
        String(asset.patchLevel).toUpperCase() ===
        "LATEST"
    ).length;

    const outdated = normalizedAssets.filter(
      (asset) =>
        String(asset.patchLevel).toUpperCase() ===
        "OUTDATED"
    ).length;

    const pending = normalizedAssets.filter(
      (asset) =>
        String(asset.patchLevel).toUpperCase() ===
        "PENDING"
    ).length;

    return [
      {
        name: "Latest",
        value: latest,
      },
      {
        name: "Outdated",
        value: outdated,
      },
      {
        name: "Pending",
        value: pending,
      },
    ];
  }, [normalizedAssets]);

  // =========================================================
  // RISK DISTRIBUTION
  // =========================================================

  const riskData = useMemo(() => {
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    normalizedAssets.forEach((asset) => {
      const risk = Number(asset.riskScore) || 0;

      if (risk >= 90) {
        critical += 1;
      } else if (risk >= 75) {
        high += 1;
      } else if (risk >= 50) {
        medium += 1;
      } else {
        low += 1;
      }
    });

    return [
      {
        severity: "Critical",
        count: critical,
      },
      {
        severity: "High",
        count: high,
      },
      {
        severity: "Medium",
        count: medium,
      },
      {
        severity: "Low",
        count: low,
      },
    ];
  }, [normalizedAssets]);

  // =========================================================
  // RESOURCE USAGE DATA
  // Average CPU / Memory / Disk across assets
  // =========================================================

  const resourceData = useMemo(() => {
    if (normalizedAssets.length === 0) {
      return [
        { name: "CPU", value: 0 },
        { name: "Memory", value: 0 },
        { name: "Disk", value: 0 },
      ];
    }

    const totals = normalizedAssets.reduce(
      (accumulator, asset) => {
        accumulator.cpu += Number(asset.cpu) || 0;
        accumulator.memory +=
          Number(asset.memory) || 0;
        accumulator.disk +=
          Number(asset.disk) || 0;

        return accumulator;
      },
      {
        cpu: 0,
        memory: 0,
        disk: 0,
      }
    );

    return [
      {
        name: "CPU",
        value: Number(
          (totals.cpu / normalizedAssets.length).toFixed(1)
        ),
      },
      {
        name: "Memory",
        value: Number(
          (totals.memory / normalizedAssets.length).toFixed(1)
        ),
      },
      {
        name: "Disk",
        value: Number(
          (totals.disk / normalizedAssets.length).toFixed(1)
        ),
      },
    ];
  }, [normalizedAssets]);

  // =========================================================
  // RESOURCE SUMMARY HELPERS
  // =========================================================

  const cpuAverage =
    resourceData.find(
      (item) => item.name === "CPU"
    )?.value || 0;

  const memoryAverage =
    resourceData.find(
      (item) => item.name === "Memory"
    )?.value || 0;

  const diskAverage =
    resourceData.find(
      (item) => item.name === "Disk"
    )?.value || 0;

  // =========================================================
  // MONTHLY TREND
  // =========================================================

  const monthlyTrend = useMemo(() => {
    const months = {};

    normalizedAssets.forEach((asset) => {
      const date =
        asset.createdAt ||
        asset.purchaseDate ||
        asset.assignedDate;

      if (!date) return;

      const parsedDate = new Date(date);

      if (Number.isNaN(parsedDate.getTime())) {
        return;
      }

      const month = parsedDate.toLocaleString(
        "default",
        {
          month: "short",
        }
      );

      months[month] =
        (months[month] || 0) + 1;
    });

    return Object.keys(months).map((month) => ({
      month,
      assets: months[month],
    }));
  }, [normalizedAssets]);

  // =========================================================
  // EXPORT DATA
  // =========================================================

  const exportRows = normalizedAssets.map(
    (asset) => ({
      Name: asset.name,
      IP: asset.ip,
      Owner: asset.owner,
      Department: asset.department,
      Vendor: asset.vendor,
      OS: asset.os,
      Status: asset.status,
      Health: asset.health,
      CPU: asset.cpu,
      Memory: asset.memory,
      Disk: asset.disk,
      Risk: asset.riskScore,
      Patch: asset.patchLevel,
    })
  );

  // =========================================================
  // PDF EXPORT
  // =========================================================

  const handlePDF = () => {
    try {
      exportToPDF(
        "Asset Inventory Report",
        [
          "Name",
          "IP",
          "Owner",
          "Department",
          "Status",
          "Health",
          "CPU",
          "Memory",
          "Disk",
          "Risk",
        ],
        exportRows.map((item) => [
          item.Name,
          item.IP,
          item.Owner,
          item.Department,
          item.Status,
          item.Health,
          `${item.CPU}%`,
          `${item.Memory}%`,
          `${item.Disk}%`,
          item.Risk,
        ]),
        "Asset_Report.pdf"
      );

      toast.success("PDF report exported successfully.");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Unable to export PDF report.");
    }
  };

  // =========================================================
  // EXCEL EXPORT
  // =========================================================

  const handleExcel = () => {
    try {
      exportToExcel(
        exportRows,
        "Assets",
        "Asset_Report.xlsx"
      );

      toast.success(
        "Excel report exported successfully."
      );
    } catch (err) {
      console.error("Excel export error:", err);
      toast.error("Unable to export Excel report.");
    }
  };

  // =========================================================
  // CSV EXPORT
  // =========================================================

  const handleCSV = () => {
    try {
      exportToCSV(
        exportRows,
        "Asset_Report.csv"
      );

      toast.success(
        "CSV report exported successfully."
      );
    } catch (err) {
      console.error("CSV export error:", err);
      toast.error("Unable to export CSV report.");
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="content">
        <Navbar />

        <motion.div
          className="reports-page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* =================================================
              HEADER
          ================================================= */}

          <div className="reports-header">
            <div>
              <h1>Reports & Analytics</h1>

              <p>
                Executive dashboard generated from
                Asset Inventory
              </p>
            </div>

            <div className="header-actions">
              <button
                type="button"
                className="refresh-btn"
                onClick={loadAssets}
                disabled={loading}
              >
                <FaSyncAlt />
                {loading ? "Refreshing..." : "Refresh"}
              </button>

              <button
                type="button"
                className="pdf-btn"
                onClick={handlePDF}
                disabled={loading || assets.length === 0}
              >
                <FaFilePdf />
                PDF
              </button>

              <button
                type="button"
                className="excel-btn"
                onClick={handleExcel}
                disabled={loading || assets.length === 0}
              >
                <FaFileExcel />
                Excel
              </button>

              <button
                type="button"
                className="csv-btn"
                onClick={handleCSV}
                disabled={loading || assets.length === 0}
              >
                <FaFileCsv />
                CSV
              </button>
            </div>
          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loading && (
            <div className="loading-container">
              <div className="loader"></div>
              <h3>Loading Report Data...</h3>
            </div>
          )}

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {/* =================================================
                  KPI CARDS
              ================================================= */}

              <div className="summary-grid">
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  className="summary-card"
                >
                  <FaServer />
                  <h2>{totalAssets}</h2>
                  <span>Total Assets</span>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.04 }}
                  className="summary-card success"
                >
                  <FaCheckCircle />
                  <h2>{healthyAssets}</h2>
                  <span>Healthy Assets</span>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.04 }}
                  className="summary-card warning"
                >
                  <FaExclamationTriangle />
                  <h2>{warningAssets}</h2>
                  <span>Warning Assets</span>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.04 }}
                  className="summary-card danger"
                >
                  <FaChartBar />
                  <h2>{criticalAssets}</h2>
                  <span>Critical Assets</span>
                </motion.div>
              </div>

              {/* =================================================
                  RESOURCE KPI CARDS
              ================================================= */}

              <div className="summary-grid resource-summary-grid">
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  className="summary-card resource-cpu"
                >
                  <FaServer />
                  <h2>{cpuAverage}%</h2>
                  <span>Average CPU</span>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.04 }}
                  className="summary-card resource-memory"
                >
                  <FaServer />
                  <h2>{memoryAverage}%</h2>
                  <span>Average Memory</span>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.04 }}
                  className="summary-card resource-disk"
                >
                  <FaServer />
                  <h2>{diskAverage}%</h2>
                  <span>Average Disk</span>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.04 }}
                  className="summary-card"
                >
                  <FaChartBar />
                  <h2>{activeAssets}</h2>
                  <span>Active Assets</span>
                </motion.div>
              </div>

              {/* =================================================
                  FIRST ROW
              ================================================= */}

              <div className="charts-grid">
                <motion.div
                  className="chart-card"
                  whileHover={{ y: -5 }}
                >
                  <h3>Asset Status</h3>

                  <ResponsiveContainer
                    width="100%"
                    height={320}
                  >
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={110}
                        label
                      >
                        {statusData.map(
                          (entry, index) => (
                            <Cell
                              key={`${entry.name}-${index}`}
                              fill={
                                COLORS[
                                  index % COLORS.length
                                ]
                              }
                            />
                          )
                        )}
                      </Pie>

                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>

                <motion.div
                  className="chart-card"
                  whileHover={{ y: -5 }}
                >
                  <h3>Infrastructure Health</h3>

                  <ResponsiveContainer
                    width="100%"
                    height={320}
                  >
                    <BarChart data={healthData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="value"
                        fill="#22c55e"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* =================================================
                  SECOND ROW
              ================================================= */}

              <div className="charts-grid">
                <motion.div
                  className="chart-card"
                  whileHover={{ y: -5 }}
                >
                  <h3>Department Distribution</h3>

                  <ResponsiveContainer
                    width="100%"
                    height={320}
                  >
                    <PieChart>
                      <Pie
                        data={departmentData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={110}
                        label
                      >
                        {departmentData.map(
                          (item, index) => (
                            <Cell
                              key={`${item.name}-${index}`}
                              fill={
                                COLORS[
                                  index % COLORS.length
                                ]
                              }
                            />
                          )
                        )}
                      </Pie>

                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>

                <motion.div
                  className="chart-card"
                  whileHover={{ y: -5 }}
                >
                  <h3>Operating Systems</h3>

                  <ResponsiveContainer
                    width="100%"
                    height={320}
                  >
                    <BarChart data={osData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="value"
                        fill="#3b82f6"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* =================================================
                  THIRD ROW
              ================================================= */}

              <div className="charts-grid">
                <motion.div
                  className="chart-card"
                  whileHover={{ y: -5 }}
                >
                  <h3>Vendor Distribution</h3>

                  <ResponsiveContainer
                    width="100%"
                    height={320}
                  >
                    <BarChart data={vendorData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="value"
                        fill="#8b5cf6"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>

                <motion.div
                  className="chart-card"
                  whileHover={{ y: -5 }}
                >
                  <h3>Patch Compliance</h3>

                  <ResponsiveContainer
                    width="100%"
                    height={320}
                  >
                    <PieChart>
                      <Pie
                        data={patchData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={110}
                        label
                      >
                        {patchData.map(
                          (item, index) => (
                            <Cell
                              key={`${item.name}-${index}`}
                              fill={
                                COLORS[
                                  index % COLORS.length
                                ]
                              }
                            />
                          )
                        )}
                      </Pie>

                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* =================================================
                  FOURTH ROW
              ================================================= */}

              <div className="charts-grid">
                <motion.div
                  className="chart-card"
                  whileHover={{ y: -5 }}
                >
                  <h3>Risk Distribution</h3>

                  <ResponsiveContainer
                    width="100%"
                    height={320}
                  >
                    <BarChart data={riskData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />
                      <XAxis dataKey="severity" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="count"
                        fill="#ef4444"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>

                <motion.div
                  className="chart-card"
                  whileHover={{ y: -5 }}
                >
                  <h3>Monthly Asset Trend</h3>

                  <ResponsiveContainer
                    width="100%"
                    height={320}
                  >
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="assets"
                        stroke="#22c55e"
                        strokeWidth={3}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* =================================================
                  FIFTH ROW - RESOURCE USAGE
              ================================================= */}

              <div className="charts-grid">
                <motion.div
                  className="chart-card"
                  whileHover={{ y: -5 }}
                >
                  <h3>System Resource Usage</h3>

                  <ResponsiveContainer
                    width="100%"
                    height={320}
                  >
                    <BarChart
                      data={resourceData}
                      margin={{
                        top: 20,
                        right: 20,
                        left: 0,
                        bottom: 10,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                      />
                      <XAxis dataKey="name" />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(value) =>
                          `${value}%`
                        }
                      />
                      <Tooltip
                        formatter={(value) => [
                          `${value}%`,
                          "Usage",
                        ]}
                      />
                      <Legend />
                      <Bar
                        dataKey="value"
                        fill="#3b82f6"
                        name="Average Usage"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>

                <motion.div
                  className="chart-card resource-summary-panel"
                  whileHover={{ y: -5 }}
                >
                  <h3>Resource Summary</h3>

                  <div className="resource-summary">
                    <div className="resource-report-card cpu">
                      <h4>CPU</h4>

                      <strong>
                        {cpuAverage}%
                      </strong>

                      <p>
                        Average CPU Usage
                      </p>
                    </div>

                    <div className="resource-report-card memory">
                      <h4>Memory</h4>

                      <strong>
                        {memoryAverage}%
                      </strong>

                      <p>
                        Average Memory Usage
                      </p>
                    </div>

                    <div className="resource-report-card disk">
                      <h4>Disk</h4>

                      <strong>
                        {diskAverage}%
                      </strong>

                      <p>
                        Average Disk Usage
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* =================================================
                  REPORT TABLE
              ================================================= */}

              <motion.div
                className="table-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="table-card-header">
                  <div>
                    <h3>Asset Inventory Report</h3>

                    <p>
                      Detailed asset and system resource information.
                    </p>
                  </div>

                  <span className="asset-count">
                    {normalizedAssets.length} Assets
                  </span>
                </div>

                <div className="reports-table-wrapper">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>IP</th>
                        <th>Owner</th>
                        <th>Department</th>
                        <th>Vendor</th>
                        <th>OS</th>
                        <th>Status</th>
                        <th>Health</th>
                        <th>CPU</th>
                        <th>Memory</th>
                        <th>Disk</th>
                        <th>Risk</th>
                        <th>Patch</th>
                      </tr>
                    </thead>

                    <tbody>
                      {normalizedAssets.length > 0 ? (
                        normalizedAssets.map((asset) => (
                          <tr key={asset.id}>
                            <td>{asset.name}</td>
                            <td>{asset.ip}</td>
                            <td>{asset.owner}</td>
                            <td>{asset.department}</td>
                            <td>{asset.vendor}</td>
                            <td>{asset.os}</td>
                            <td>{asset.status}</td>
                            <td>{asset.health}</td>

                            <td>
                              {asset.cpu}%
                            </td>

                            <td>
                              {asset.memory}%
                            </td>

                            <td>
                              {asset.disk}%
                            </td>

                            <td>
                              {asset.riskScore}%
                            </td>

                            <td>
                              {asset.patchLevel}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="13"
                            className="empty-cell"
                          >
                            No asset data available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}
        </motion.div>

        <Footer />
      </div>
    </div>
  );
}

export default Reports;
