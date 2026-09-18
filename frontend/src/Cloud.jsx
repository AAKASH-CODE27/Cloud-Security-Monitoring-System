import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FaCloud,
  FaAws,
  FaMicrosoft,
  FaServer,
  FaSyncAlt,
  FaSearch,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
} from "react-icons/fa";

import {
  SiGooglecloud,
  SiKubernetes,
  SiDocker,
} from "react-icons/si";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";

import { toast } from "react-toastify";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Pagination from "./Pagination";

import { getAssets } from "./api/assetsApi";

import "./Cloud.css";

export default function Cloud() {
  // ===============================
  // State
  // ===============================

  const [assets, setAssets] = useState([]);

  const [resources, setResources] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [provider, setProvider] = useState("ALL");

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);

  const pageSize = 10;

  // ===============================
  // Generate Cloud Resources
  // ===============================

  const generateCloudResources = (assetList) => {
    const generated = assetList.map((asset) => ({
      id: asset.id,

      provider:
        asset.cloudProvider ||
        asset.provider ||
        "AWS",

      name:
        asset.name ||
        asset.assetName ||
        asset.hostname ||
        `Asset ${asset.id}`,

      region:
        asset.region ||
        "ap-south-1",

      cpu:
        asset.cpuUsage ??
        asset.cpu ??
        Math.floor(Math.random() * 90),

      memory:
        asset.memoryUsage ??
        asset.memory ??
        Math.floor(Math.random() * 90),

      disk:
        asset.diskUsage ??
        asset.disk ??
        Math.floor(Math.random() * 90),

      health:
        asset.health || "Healthy",

      kubernetes:
        asset.kubernetes ?? false,

      docker:
        asset.docker ?? false,
    }));

    setResources(generated);
  };

  // ===============================
  // Load Assets
  // ===============================

  const loadResources = async () => {
    try {
      setLoading(true);

      setError("");

      const response = await getAssets();

      const assetData = response?.data || [];

      setAssets(assetData);

      generateCloudResources(assetData);
    } catch (err) {
      console.error(err);

      setError("Unable to load cloud resources.");

      toast.error("Unable to load cloud resources.");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // Initial Load
  // ===============================

  useEffect(() => {
    loadResources();
  }, []);

  // ===============================
  // Refresh
  // ===============================

  const handleRefresh = () => {
    loadResources();

    toast.success("Cloud resources refreshed");
  };
    // ===============================
  // Search & Filter
  // ===============================

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchesSearch =
        resource.name?.toLowerCase().includes(search.toLowerCase()) ||
        resource.region?.toLowerCase().includes(search.toLowerCase()) ||
        resource.provider?.toLowerCase().includes(search.toLowerCase());

      const matchesProvider =
        provider === "ALL" ||
        resource.provider?.toUpperCase() === provider;

      return matchesSearch && matchesProvider;
    });
  }, [resources, search, provider]);

  // ===============================
  // Dashboard Statistics
  // ===============================

  const awsCount = filteredResources.filter(
    (r) => r.provider?.toUpperCase() === "AWS"
  ).length;

  const azureCount = filteredResources.filter(
    (r) => r.provider?.toUpperCase() === "AZURE"
  ).length;

  const gcpCount = filteredResources.filter(
    (r) => r.provider?.toUpperCase() === "GCP"
  ).length;

  const healthy = filteredResources.filter(
    (r) => r.health?.toLowerCase() === "healthy"
  ).length;

  const warning = filteredResources.filter(
    (r) => r.health?.toLowerCase() === "warning"
  ).length;

  const critical = filteredResources.filter(
    (r) => r.health?.toLowerCase() === "critical"
  ).length;

  const totalResources = filteredResources.length;

  // ===============================
  // Pie Chart Data
  // ===============================

  const providerData = [
    {
      name: "AWS",
      value: awsCount,
    },
    {
      name: "Azure",
      value: azureCount,
    },
    {
      name: "GCP",
      value: gcpCount,
    },
  ];

  const healthData = [
    {
      name: "Healthy",
      value: healthy,
    },
    {
      name: "Warning",
      value: warning,
    },
    {
      name: "Critical",
      value: critical,
    },
  ];

  const COLORS = [
    "#3b82f6",
    "#8b5cf6",
    "#22c55e",
  ];

  // ===============================
  // Resource Utilization
  // ===============================

  const utilizationData = [
    {
      name: "CPU",
      value:
        filteredResources.length > 0
          ? Math.round(
              filteredResources.reduce(
                (sum, item) => sum + Number(item.cpu || 0),
                0
              ) / filteredResources.length
            )
          : 0,
    },
    {
      name: "Memory",
      value:
        filteredResources.length > 0
          ? Math.round(
              filteredResources.reduce(
                (sum, item) => sum + Number(item.memory || 0),
                0
              ) / filteredResources.length
            )
          : 0,
    },
    {
      name: "Disk",
      value:
        filteredResources.length > 0
          ? Math.round(
              filteredResources.reduce(
                (sum, item) => sum + Number(item.disk || 0),
                0
              ) / filteredResources.length
            )
          : 0,
    },
  ];

  // ===============================
  // Pagination
  // ===============================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredResources.length / pageSize)
  );

  const currentResources = filteredResources.slice(
    (page - 1) * pageSize,
    page * pageSize
  );
    // ===============================
  // UI
  // ===============================

  return (
    <div className="dashboard">

      <Sidebar />

      <div className="content">

        <Navbar />

        <motion.div
          className="cloud-page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >

          {/* ================= Header ================= */}

          <div className="page-header">

            <div>

              <h1>Cloud Infrastructure Monitoring</h1>

              <p>
                Cloud resources generated automatically from your Asset Inventory.
              </p>

            </div>

            <button
              className="refresh-btn"
              onClick={handleRefresh}
            >
              <FaSyncAlt />
              Refresh
            </button>

          </div>

          {/* ================= Summary Cards ================= */}

          <div className="summary-grid">

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="summary-card aws"
            >
              <FaAws />

              <h2>{awsCount}</h2>

              <span>AWS Resources</span>

            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="summary-card azure"
            >
              <FaMicrosoft />

              <h2>{azureCount}</h2>

              <span>Azure Resources</span>

            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="summary-card gcp"
            >
              <SiGooglecloud />

              <h2>{gcpCount}</h2>

              <span>Google Cloud</span>

            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="summary-card total"
            >
              <FaCloud />

              <h2>{totalResources}</h2>

              <span>Total Resources</span>

            </motion.div>

          </div>

          {/* ================= Toolbar ================= */}

          <div className="toolbar">

            <div className="search-box">

              <FaSearch />

              <input
                type="text"
                placeholder="Search resource, provider or region..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />

            </div>

            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value);
                setPage(1);
              }}
            >

              <option value="ALL">All Providers</option>
              <option value="AWS">AWS</option>
              <option value="AZURE">Azure</option>
              <option value="GCP">Google Cloud</option>

            </select>

          </div>

          {/* ================= Charts ================= */}

          <div className="chart-grid">

            {/* Provider Distribution */}

            <motion.div
              className="chart-card"
              whileHover={{ scale: 1.02 }}
            >

              <h3>Cloud Provider Distribution</h3>

              <ResponsiveContainer
                width="100%"
                height={300}
              >

                <PieChart>

                  <Pie
                    data={providerData}
                    dataKey="value"
                    outerRadius={100}
                    label
                  >

                    {providerData.map((entry, index) => (

                      <Cell
                        key={index}
                        fill={COLORS[index]}
                      />

                    ))}

                  </Pie>

                  <Tooltip />

                  <Legend />

                </PieChart>

              </ResponsiveContainer>

            </motion.div>

            {/* Health Overview */}

            <motion.div
              className="chart-card"
              whileHover={{ scale: 1.02 }}
            >

              <h3>Infrastructure Health</h3>

              <ResponsiveContainer
                width="100%"
                height={300}
              >

                <BarChart data={healthData}>

                  <CartesianGrid strokeDasharray="3 3" />

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

            {/* Average Utilization */}

            <motion.div
              className="chart-card"
              whileHover={{ scale: 1.02 }}
            >

              <h3>Average Resource Utilization</h3>

              <ResponsiveContainer
                width="100%"
                height={300}
              >

                <LineChart data={utilizationData}>

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="name" />

                  <YAxis />

                  <Tooltip />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#22c55e"
                    strokeWidth={3}
                  />

                </LineChart>

              </ResponsiveContainer>

            </motion.div>

          </div>
                    {/* ================= Loading ================= */}

          {loading && (
            <div className="loading">
              Loading Cloud Resources...
            </div>
          )}

          {/* ================= Error ================= */}

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          {/* ================= Cloud Resources Table ================= */}

          {!loading && !error && filteredResources.length > 0 && (

            <motion.div
              className="table-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >

              <table className="cloud-table">

                <thead>

                  <tr>

                    <th>Provider</th>

                    <th>Resource Name</th>

                    <th>Region</th>

                    <th>CPU</th>

                    <th>Memory</th>

                    <th>Disk</th>

                    <th>Health</th>

                    {/* <th>Container</th> */}

                  </tr>

                </thead>

                <tbody>

                  {currentResources.map((resource) => (

                    <motion.tr
                      key={resource.id}
                      whileHover={{ scale: 1.01 }}
                    >

                      <td>

                        {resource.provider === "AWS" && (
                          <FaAws color="#ff9900" />
                        )}

                        {resource.provider === "AZURE" && (
                          <FaMicrosoft color="#0078D4" />
                        )}

                        {resource.provider === "GCP" && (
                          <SiGooglecloud color="#4285F4" />
                        )}

                        {" "}

                        {resource.provider}

                      </td>

                      <td>{resource.name}</td>

                      <td>{resource.region}</td>

                      <td>

                        <span className="metric cpu">
                          {resource.cpu}%
                        </span>

                      </td>

                      <td>

                        <span className="metric memory">
                          {resource.memory}%
                        </span>

                      </td>

                      <td>

                        <span className="metric disk">
                          {resource.disk}%
                        </span>

                      </td>

                      <td>

                        <span
                          className={`health ${resource.health?.toLowerCase()}`}
                        >

                          {resource.health === "Healthy" && (
                            <FaCheckCircle />
                          )}

                          {resource.health === "Warning" && (
                            <FaExclamationTriangle />
                          )}

                          {resource.health === "Critical" && (
                            <FaTimesCircle />
                          )}

                          {" "}

                          {resource.health}

                        </span>

                      </td>

                      <td>

                        <div className="container-icons">

                          {resource.kubernetes && (
                            <SiKubernetes
                              className="k8s"
                              title="Kubernetes"
                            />
                          )}

                          {resource.docker && (
                            <SiDocker
                              className="docker"
                              title="Docker"
                            />
                          )}

                        </div>

                      </td>

                    </motion.tr>

                  ))}

                </tbody>

              </table>

            </motion.div>

          )}

          {/* ================= Empty State ================= */}

          {!loading &&
            !error &&
            filteredResources.length === 0 && (

              <motion.div
                className="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >

                <FaServer size={70} />

                <h2>No Cloud Resources Found</h2>

                <p>
                  No cloud resources are available from your Asset Inventory.
                </p>

              </motion.div>

          )}

          {/* ================= Pagination ================= */}

          {!loading &&
            !error &&
            filteredResources.length > pageSize && (

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />

          )}

        </motion.div>

        {/* ================= Footer ================= */}

        <Footer />

      </div>

    </div>

  );

}