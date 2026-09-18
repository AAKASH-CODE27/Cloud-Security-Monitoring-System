// src/Dashboard.jsx

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { motion } from "framer-motion";

import {
  FaServer,
  FaUsers,
  FaShieldAlt,
  FaBug,
  FaDatabase,
  FaCloud,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowUp,
  FaArrowDown,
  FaMicrochip,
  FaNetworkWired,
  FaMemory,
  FaHdd,
  FaClock,
  FaWifi,
} from "react-icons/fa";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useSocket } from "./hooks/useSocket";
import { RealTimeStatusIndicator } from "./socket/RealTimeNotification";

import API from "./api/axios";

import "./Dashboard.css";

function Dashboard() {
  const { socket } = useSocket();

  /* =====================================================
      USER
  ===================================================== */

  const [user, setUser] = useState({
    username: "",
    email: "",
    role: "",
    department: "",
  });

  /* =====================================================
      DASHBOARD
  ===================================================== */

  const [dashboard, setDashboard] = useState({

    assets: 0,
    servers: 0,
    endpoints: 0,
    users: 0,

    alerts: 0,
    incidents: 0,
    vulnerabilities: 0,
    securityScore: 0,

    healthy: 0,
    warning: 0,
    critical: 0,
    offline: 0,

    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    gpu: 0,
    database: 0,

    upload: 0,
    download: 0,
    latency: 0,
    packetLoss: 0,

    malware: 0,
    phishing: 0,
    ransomware: 0,
    ddos: 0,

    uptime: 0,

    cloud: [],
    recommendations: [],
    activities: [],

    alertList: [],
  });

  /* =====================================================
      LIVE DATA
  ===================================================== */

  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =====================================================
      HELPERS
  ===================================================== */

  const toNumber = (
    value,
    fallback = 0
  ) => {

    const number =
      Number(value);

    return Number.isFinite(number)
      ? number
      : fallback;
  };

  const clampPercentage = (
    value
  ) => {

    const number =
      toNumber(value);

    return Math.max(
      0,
      Math.min(100, number)
    );

  };

  const normalizeText = (
    value
  ) => {

    return String(
      value ?? ""
    )
      .trim()
      .toLowerCase();

  };

  /* =====================================================
      PROFILE
  ===================================================== */

  const loadProfile = async () => {

    try {

      const response =
        await API.get(
          "/users/profile"
        );

      const profile =
        response?.data || {};

      setUser(profile);

      localStorage.setItem(
        "currentUser",
        JSON.stringify(profile)
      );

      return profile;

    } catch (err) {

      console.error(
        "Profile load error:",
        err
      );

      try {

        const localUser =
          JSON.parse(
            localStorage.getItem(
              "currentUser"
            ) || "null"
          );

        if (localUser) {

          setUser(localUser);

          return localUser;

        }

      } catch (storageError) {

        console.error(
          "Storage error:",
          storageError
        );

      }

      return null;

    }

  };

  /* =====================================================
      DASHBOARD API
  ===================================================== */

  const loadDashboardMetrics =
    async () => {

      const response =
        await API.get(
          "/dashboard"
        );

      return (
        response?.data || {}
      );

    };

  /* =====================================================
      ASSETS API
  ===================================================== */

  const loadAssets =
    async () => {

      try {

        const response = await API.get("/assets");
        const raw = response?.data?.data || response?.data;
        const data = Array.isArray(raw) ? raw : [];

        setAssets(data);

        return data;

      } catch (err) {

        console.error(
          "Assets load error:",
          err
        );

        return [];

      }

    };

  /* =====================================================
      USERS API
  ===================================================== */

  const loadUsers =
    async () => {

      try {

        const response =
          await API.get(
            "/users"
          );

        const data =
          Array.isArray(
            response?.data
          )
            ? response.data
            : [];

        setUsers(data);

        return data;

      } catch (err) {

        console.error(
          "Users load error:",
          err
        );

        return [];

      }

    };

  /* =====================================================
      GENERATE ALERTS FROM ASSETS
  ===================================================== */

  const generateAlertsFromAssets =
    (assetList) => {

      const generatedAlerts = [];

      if (
        !Array.isArray(
          assetList
        )
      ) {

        return generatedAlerts;

      }

      assetList.forEach(
        (asset) => {

          const assetName =
            asset.assetName ||
            asset.hostname ||
            asset.name ||
            `Asset ${asset.id}`;

          /* ==========================================
              CRITICAL HEALTH
          ========================================== */

          if (
            normalizeText(
              asset.health
            ) === "critical"
          ) {

            generatedAlerts.push({

              id:
                `health-${asset.id}`,

              assetId:
                asset.id,

              assetName,

              type:
                "Health",

              severity:
                "Critical",

              status:
                "OPEN",

              description:
                "Asset health is in critical condition.",

            });

          }

          /* ==========================================
              INACTIVE ASSET
          ========================================== */

          if (
            normalizeText(
              asset.status
            ) === "inactive"
          ) {

            generatedAlerts.push({

              id:
                `status-${asset.id}`,

              assetId:
                asset.id,

              assetName,

              type:
                "Status",

              severity:
                "High",

              status:
                "OPEN",

              description:
                "Asset is currently inactive.",

            });

          }

          /* ==========================================
              RISK
          ========================================== */

          const riskScore =
            toNumber(
              asset.riskScore
            );

          if (
            riskScore >= 80
          ) {

            generatedAlerts.push({

              id:
                `risk-${asset.id}`,

              assetId:
                asset.id,

              assetName,

              type:
                "Security Risk",

              severity:
                "Critical",

              status:
                "OPEN",

              description:
                `High security risk detected. Risk score: ${riskScore}%.`,

            });

          } else if (
            riskScore >= 50
          ) {

            generatedAlerts.push({

              id:
                `risk-${asset.id}`,

              assetId:
                asset.id,

              assetName,

              type:
                "Security Risk",

              severity:
                "Medium",

              status:
                "OPEN",

              description:
                `Medium security risk detected. Risk score: ${riskScore}%.`,

            });

          }

        }
      );

      return generatedAlerts;

    };

  /* =====================================================
      BUILD DASHBOARD FROM REAL DATA
  ===================================================== */

  const buildDashboard =
    (
      backendData,
      assetData,
      userData
    ) => {

      const safeAssets =
        Array.isArray(
          assetData
        )
          ? assetData
          : [];

      const safeUsers =
        Array.isArray(
          userData
        )
          ? userData
          : [];

      /* ==========================================
          ASSET COUNTS
      ========================================== */

      const totalAssets =
        safeAssets.length;

      const servers =
        safeAssets.filter(
          (asset) =>
            normalizeText(
              asset.assetType ||
              asset.type
            ) === "server"
        ).length;

      const endpoints =
        safeAssets.filter(
          (asset) => {

            const type =
              normalizeText(
                asset.assetType ||
                asset.type
              );

            return [
              "endpoint",
              "laptop",
              "desktop",
              "mobile",
            ].includes(type);

          }
        ).length;

      /* ==========================================
          HEALTH
      ========================================== */

      const healthy =
        safeAssets.filter(
          (asset) =>
            normalizeText(
              asset.health
            ) === "healthy"
        ).length;

      const warning =
        safeAssets.filter(
          (asset) =>
            normalizeText(
              asset.health
            ) === "warning"
        ).length;

      const criticalHealth =
        safeAssets.filter(
          (asset) =>
            normalizeText(
              asset.health
            ) === "critical"
        ).length;

      const inactive =
        safeAssets.filter(
          (asset) =>
            normalizeText(
              asset.status
            ) === "inactive"
        ).length;

      /* ==========================================
          ALERT BOARD
      ========================================== */

      const generatedAlerts =
        generateAlertsFromAssets(
          safeAssets
        );

      /* ==========================================
          INCIDENTS
      ========================================== */

      const incidents =
        safeAssets.filter(
          (asset) => {

            const incidentType =
              normalizeText(
                asset.incidentType
              );

            return (
              incidentType === "open" ||
              incidentType ===
                "investigating"
            );

          }
        ).length;

      /* ==========================================
          RETURN
      ========================================== */

      return {

        ...backendData,

        assets:
          totalAssets,

          // servers:
          // servers,

        endpoints:
          endpoints,

        users:
          safeUsers.length,

        /*
          IMPORTANT:
          Alert count is generated from
          the exact same asset rules
          used in Alerts.jsx.
        */

        alerts:
          generatedAlerts.length,

        incidents:
          backendData?.incidents ??
          incidents,

        healthy:
          backendData?.healthy ??
          healthy,

        warning:
          backendData?.warning ??
          warning,

        critical:
          backendData?.critical ??
          criticalHealth,

        offline:
          backendData?.offline ??
          inactive,

        alertList:
          generatedAlerts,

      };

    };

  /* =====================================================
      LOAD ALL DATA
  ===================================================== */

  const loadAllData =
    async (
      showInitialLoader = false
    ) => {

      try {

        if (
          showInitialLoader
        ) {

          setLoading(true);

        } else {

          setRefreshing(true);

        }

        setError("");

        const results =
          await Promise.allSettled([

            loadProfile(),

            loadDashboardMetrics(),

            loadAssets(),

            loadUsers(),

          ]);

        const [
          profileResult,
          dashboardResult,
          assetsResult,
          usersResult,
        ] = results;

        /* ==========================================
            PROFILE
        ========================================== */

        if (
          profileResult.status ===
          "rejected"
        ) {

          console.warn(
            "Profile request failed."
          );

        }

        /* ==========================================
            BACKEND DASHBOARD
        ========================================== */

        const backendData =
          dashboardResult.status ===
          "fulfilled"
            ? dashboardResult.value
            : {};

        /* ==========================================
            ASSETS
        ========================================== */

        const assetData =
          assetsResult.status ===
          "fulfilled"
            ? assetsResult.value
            : [];

        /* ==========================================
            USERS
        ========================================== */

        const userData =
          usersResult.status ===
          "fulfilled"
            ? usersResult.value
            : [];

        /* ==========================================
            BUILD DASHBOARD
        ========================================== */

        const calculatedDashboard =
          buildDashboard(
            backendData,
            assetData,
            userData
          );

        setDashboard(
          (previous) => ({

            ...previous,

            ...calculatedDashboard,

            /* =========================
                REAL RESOURCE VALUES
            ========================= */

            cpu:
              backendData.cpu ??
              backendData.cpuUsage ??
              backendData.cpuPercent ??
              previous.cpu ??
              0,

            memory:
              backendData.memory ??
              backendData.memoryUsage ??
              backendData.memoryPercent ??
              previous.memory ??
              0,

            disk:
              backendData.disk ??
              backendData.diskUsage ??
              backendData.diskPercent ??
              previous.disk ??
              0,

            gpu:
              backendData.gpu ??
              backendData.gpuUsage ??
              previous.gpu ??
              0,

            database:
              backendData.database ??
              backendData.databaseUsage ??
              previous.database ??
              0,

            network:
              backendData.network ??
              backendData.networkUsage ??
              previous.network ??
              0,

            upload:
              backendData.upload ??
              backendData.uploadSpeed ??
              previous.upload ??
              0,

            download:
              backendData.download ??
              backendData.downloadSpeed ??
              previous.download ??
              0,

            latency:
              backendData.latency ??
              previous.latency ??
              0,

            packetLoss:
              backendData.packetLoss ??
              previous.packetLoss ??
              0,

            uptime:
              backendData.uptime ??
              previous.uptime ??
              0,

            securityScore:
              backendData.securityScore ??
              previous.securityScore ??
              0,

            vulnerabilities:
              backendData.vulnerabilities ??
              previous.vulnerabilities ??
              0,

            malware:
              backendData.malware ??
              previous.malware ??
              0,

            phishing:
              backendData.phishing ??
              previous.phishing ??
              0,

            ransomware:
              backendData.ransomware ??
              previous.ransomware ??
              0,

            ddos:
              backendData.ddos ??
              previous.ddos ??
              0,

            cloud:
              backendData.cloud ??
              previous.cloud ??
              [],

            recommendations:
              backendData.recommendations ??
              previous.recommendations ??
              [],

            activities:
              backendData.activities ??
              previous.activities ??
              [],

          })
        );

        /*
          Dashboard endpoint is the only required
          backend call. If it fails, show the error.
        */

        if (
          dashboardResult.status ===
          "rejected"
        ) {

          throw (
            dashboardResult.reason
          );

        }

      } catch (err) {

        console.error(
          "Dashboard load error:",
          err?.response?.data ||
            err?.message ||
            err
        );

        if (
          err?.response
        ) {

          setError(
            err.response?.data
              ?.message ||
            "Server Error"
          );

        } else {

          setError(
            "Unable to connect to backend."
          );

        }

      } finally {

        if (
          showInitialLoader
        ) {

          setLoading(false);

        }

        setRefreshing(false);

      }

    };

  /* =====================================================
      INITIAL LOAD + AUTO REFRESH
  ===================================================== */

  useEffect(() => {

    let mounted = true;

    const initialize =
      async () => {

        if (!mounted) return;

        await loadAllData(
          true
        );

      };

    initialize();

    const interval =
      setInterval(() => {

        if (
          mounted
        ) {

          loadAllData(
            false
          );

        }

      }, 5000);

    return () => {

      mounted = false;

      clearInterval(
        interval
      );

    };

  }, []);

  /* =====================================================
      REAL-TIME SOCKET.IO LISTENERS
  ===================================================== */

  useEffect(() => {
    if (!socket) return;

    const onAlertCreated = (newAlert) => {
      setDashboard((prev) => ({
        ...prev,
        alerts: (prev.alerts || 0) + 1,
      }));
    };

    const onIncidentCreated = (newIncident) => {
      setDashboard((prev) => ({
        ...prev,
        incidents: (prev.incidents || 0) + 1,
      }));
    };

    const onVulnCreated = (newVuln) => {
      setDashboard((prev) => ({
        ...prev,
        vulnerabilities: (prev.vulnerabilities || 0) + 1,
      }));
    };

    const onAssetDiscovered = (newAsset) => {
      setDashboard((prev) => ({
        ...prev,
        assets: (prev.assets || 0) + 1,
      }));
    };

    const onAssetUpdated = () => {
      loadDashboardMetrics()
        .then((data) => {
          if (data) {
            setDashboard((prev) => ({
              ...prev,
              cpu: data.cpu ?? data.cpuUsage ?? prev.cpu,
              memory: data.memory ?? data.memoryUsage ?? prev.memory,
              disk: data.disk ?? data.diskUsage ?? prev.disk,
              healthy: data.healthy ?? prev.healthy,
              warning: data.warning ?? prev.warning,
              critical: data.critical ?? prev.critical,
            }));
          }
        })
        .catch((e) => console.warn("Live metric sync error:", e));
    };

    socket.on("alert:created", onAlertCreated);
    socket.on("incident:created", onIncidentCreated);
    socket.on("vulnerability:created", onVulnCreated);
    socket.on("asset:discovered", onAssetDiscovered);
    socket.on("asset:updated", onAssetUpdated);

    return () => {
      socket.off("alert:created", onAlertCreated);
      socket.off("incident:created", onIncidentCreated);
      socket.off("vulnerability:created", onVulnCreated);
      socket.off("asset:discovered", onAssetDiscovered);
      socket.off("asset:updated", onAssetUpdated);
    };
  }, [socket]);

  /* =====================================================
      SAFE VALUES
  ===================================================== */

  const cpuValue =
    clampPercentage(
      dashboard.cpu
    );

  const memoryValue =
    clampPercentage(
      dashboard.memory
    );

  const diskValue =
    clampPercentage(
      dashboard.disk
    );

  const gpuValue =
    clampPercentage(
      dashboard.gpu
    );

  const databaseValue =
    clampPercentage(
      dashboard.database
    );

  const securityScoreValue =
    clampPercentage(
      dashboard.securityScore
    );

  /* =====================================================
      REAL ALERT COUNT
  ===================================================== */

  const alertCount =
    dashboard.alertList?.length ||
    0;

  /* =====================================================
      LOADING
  ===================================================== */

  if (loading) {

    return (

      <div
        className="loading-screen"
      >

        <div
          className="loader"
        />

        <h2>
          Loading SentinelCore SecureOps...
        </h2>

      </div>

    );

  }

  /* =====================================================
      ERROR
  ===================================================== */

  if (error) {

    return (

      <div
        className="error-screen"
      >

        <FaExclamationTriangle />

        <h2>
          {error}
        </h2>

        <button
          type="button"
          className="refresh-dashboard-btn"
          onClick={() =>
            loadAllData(true)
          }
        >
          Retry
        </button>

      </div>

    );

  }

  /* =====================================================
      UI
  ===================================================== */

  return (

    <div
      className="dashboard"
    >

      <Sidebar />

      <div
        className="content"
      >

        <Navbar />

        {/* =================================================
            HERO
        ================================================= */}

        <motion.div
          className="hero-section"

          initial={{
            opacity: 0,
            y: 30,
          }}

          animate={{
            opacity: 1,
            y: 0,
          }}

          transition={{
            duration: 0.7,
          }}
        >

          <div>
            <div style={{ marginBottom: "10px" }}>
              <RealTimeStatusIndicator />
            </div>

            <h1>

              Welcome,{" "}

              {user.username ||
                user.name ||
                "Administrator"}

            </h1>

            <p>

              Monitor infrastructure,
              detect threats,
              manage incidents and
              secure your enterprise
              in real time.

            </p>

            {/* <small>

              {refreshing

                ? "Refreshing live data..."

                : "Live data • Auto refresh every 5 seconds"}

            </small> */}

          </div>

          <div
            className="hero-score"
          >

            <FaShieldAlt
              className="shield-icon"
            />

            <div>

              <h2>

                {securityScoreValue}%

              </h2>

              <span>
                Security Score
              </span>

            </div>

          </div>

        </motion.div>

        {/* =================================================
            KPI CARDS
        ================================================= */}

        <div
          className="dashboard-cards"
        >

          {[
            {
              title: "Assets",
              value:
                dashboard.assets,
              icon:
                <FaServer />,
              color:
                "#3b82f6",
            },

            {
              title: "Servers",
              value:
                dashboard.servers,
              icon:
                <FaDatabase />,
              color:
                "#14b8a6",
            },

            {
              title: "Endpoints",
              value:
                dashboard.endpoints,
              icon:
                <FaNetworkWired />,
              color:
                "#8b5cf6",
            },

            {
              title: "Users",
              value:
                dashboard.users,
              icon:
                <FaUsers />,
              color:
                "#f97316",
            },

            {
              title: "Alerts",
              value:
                alertCount,
              icon:
                <FaExclamationTriangle />,
              color:
                "#ef4444",
            },

            {
              title: "Incidents",
              value:
                dashboard.incidents,
              icon:
                <FaBug />,
              color:
                "#ec4899",
            },

            {
              title:
                "Vulnerabilities",
              value:
                dashboard.vulnerabilities,
              icon:
                <FaShieldAlt />,
              color:
                "#dc2626",
            },

            {
              title: "Uptime",
              value:
                `${toNumber(
                  dashboard.uptime
                )}%`,
              icon:
                <FaClock />,
              color:
                "#22c55e",
            },

          ].map(
            (
              card,
              index
            ) => (

              <motion.div

                key={
                  card.title
                }

                className=
                  "dashboard-card"

                initial={{
                  opacity: 0,
                  y: 40,
                }}

                animate={{
                  opacity: 1,
                  y: 0,
                }}

                transition={{
                  duration: 0.4,
                  delay:
                    index *
                    0.08,
                }}

                whileHover={{
                  y: -10,
                  scale: 1.03,
                }}

              >

                <div

                  className=
                    "card-icon"

                  style={{
                    background:
                      card.color,
                  }}

                >

                  {card.icon}

                </div>

                <div
                  className=
                    "card-content"
                >

                  <h2>
                    {card.value}
                  </h2>

                  <p>
                    {card.title}
                  </p>

                </div>

              </motion.div>

            )
          )}

        </div>

        {/* =================================================
            HEALTH
        ================================================= */}

        <div
          className="health-grid"
        >

          <motion.div
            className=
              "health-card healthy"
            whileHover={{
              scale: 1.03,
            }}
          >

            <FaCheckCircle />

            <h2>
              {dashboard.healthy}
            </h2>

            <p>
              Healthy Systems
            </p>

          </motion.div>

          <motion.div
            className=
              "health-card warning"
            whileHover={{
              scale: 1.03,
            }}
          >

            <FaExclamationTriangle />

            <h2>
              {dashboard.warning}
            </h2>

            <p>
              Warnings
            </p>

          </motion.div>

          <motion.div
            className=
              "health-card critical"
            whileHover={{
              scale: 1.03,
            }}
          >

            <FaBug />

            <h2>
              {dashboard.critical}
            </h2>

            <p>
              Critical Alerts
            </p>

          </motion.div>

          <motion.div
            className=
              "health-card offline"
            whileHover={{
              scale: 1.03,
            }}
          >

            <FaCloud />

            <h2>
              {dashboard.offline}
            </h2>

            <p>
              Offline Devices
            </p>

          </motion.div>

        </div>

        {/* =================================================
            DASHBOARD GRID
        ================================================= */}

        <div
          className="dashboard-grid"
        >

          {/* =================================================
              RESOURCE USAGE
          ================================================= */}

          <motion.div
            className=
              "panel system-panel"

            initial={{
              opacity: 0,
              x: -40,
            }}

            animate={{
              opacity: 1,
              x: 0,
            }}

            transition={{
              duration: 0.6,
            }}
          >

            <h2>

              <FaMicrochip />

              System Resource Usage

            </h2>

            {[
              {
                label:
                  "CPU Usage",
                value:
                  cpuValue,
                icon:
                  <FaMicrochip />,
                color:
                  "#ef4444",
              },

              {
                label:
                  "Memory",
                value:
                  memoryValue,
                icon:
                  <FaMemory />,
                color:
                  "#3b82f6",
              },

              {
                label:
                  "Disk",
                value:
                  diskValue,
                icon:
                  <FaHdd />,
                color:
                  "#f59e0b",
              },

              {
                label:
                  "GPU",
                value:
                  gpuValue,
                icon:
                  <FaMicrochip />,
                color:
                  "#8b5cf6",
              },

              {
                label:
                  "Database",
                value:
                  databaseValue,
                icon:
                  <FaDatabase />,
                color:
                  "#14b8a6",
              },

            ].map(
              (item) => (

                <div
                  className=
                    "resource-item"
                  key={
                    item.label
                  }
                >

                  <div
                    className=
                      "resource-header"
                  >

                    <span>

                      {item.icon}

                      {" "}

                      {item.label}

                    </span>

                    <strong>

                      {item.value.toFixed(
                        1
                      )}

                      %

                    </strong>

                  </div>

                  <div
                    className=
                      "progress-bar"
                  >

                    <motion.div

                      className=
                        "progress-fill"

                      style={{
                        background:
                          item.color,
                      }}

                      initial={{
                        width: 0,
                      }}

                      animate={{
                        width:
                          `${item.value}%`,
                      }}

                      transition={{
                        duration:
                          0.8,
                      }}

                    />

                  </div>

                </div>

              )
            )}

          </motion.div>

          {/* =================================================
              NETWORK
          ================================================= */}

          <motion.div
            className=
              "panel network-panel"

            initial={{
              opacity: 0,
              y: 30,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}
          >

            <h2>

              <FaNetworkWired />

              Network Analytics

            </h2>

            <div
              className=
                "network-grid"
            >

              <div
                className=
                  "metric-card"
              >

                <FaArrowUp />

                <h3>

                  {toNumber(
                    dashboard.upload
                  )}

                  {" "}MB

                </h3>

                <p>
                  Upload
                </p>

              </div>

              <div
                className=
                  "metric-card"
              >

                <FaArrowDown />

                <h3>

                  {toNumber(
                    dashboard.download
                  )}

                  {" "}MB

                </h3>

                <p>
                  Download
                </p>

              </div>

              <div
                className=
                  "metric-card"
              >

                <FaWifi />

                <h3>

                  {toNumber(
                    dashboard.latency
                  )}

                  {" "}ms

                </h3>

                <p>
                  Latency
                </p>

              </div>

              <div
                className=
                  "metric-card"
              >

                <FaNetworkWired />

                <h3>

                  {toNumber(
                    dashboard.packetLoss
                  )}

                  %

                </h3>

                <p>
                  Packet Loss
                </p>

              </div>

            </div>

          </motion.div>

          {/* =================================================
              THREATS
          ================================================= */}

          <motion.div
            className=
              "panel threat-panel"

            initial={{
              opacity: 0,
              x: 40,
            }}

            animate={{
              opacity: 1,
              x: 0,
            }}

            transition={{
              duration: 0.6,
            }}
          >

            <h2>

              <FaShieldAlt />

              Threat Analytics

            </h2>

            <div
              className=
                "threat-grid"
            >

              <div
                className=
                  "threat-card malware"
              >

                <h1>
                  {dashboard.malware}
                </h1>

                <p>
                  Malware
                </p>

              </div>

              <div
                className=
                  "threat-card phishing"
              >

                <h1>
                  {dashboard.phishing}
                </h1>

                <p>
                  Phishing
                </p>

              </div>

              <div
                className=
                  "threat-card ransomware"
              >

                <h1>
                  {dashboard.ransomware}
                </h1>

                <p>
                  Ransomware
                </p>

              </div>

              <div
                className=
                  "threat-card ddos"
              >

                <h1>
                  {dashboard.ddos}
                </h1>

                <p>
                  DDoS
                </p>

              </div>

            </div>

            <div
              className=
                "security-status"
              style={{
                marginTop:
                  25,
              }}
            >

              <h3>
                Overall Security Status
              </h3>

              <div
                className=
                  "security-score-bar"
              >

                <motion.div

                  initial={{
                    width: 0,
                  }}

                  animate={{
                    width:
                      `${securityScoreValue}%`,
                  }}

                  transition={{
                    duration:
                      1.2,
                  }}

                  className=
                    "security-fill"

                >

                  {securityScoreValue}%

                </motion.div>

              </div>

            </div>

          </motion.div>

          {/* =================================================
              INFRASTRUCTURE
          ================================================= */}

          <motion.div
            className=
              "panel system-info"

            initial={{
              opacity: 0,
              y: 30,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}
          >

            <h2>

              <FaServer />

              Infrastructure Summary

            </h2>

            <div
              className=
                "info-list"
            >

              <div>

                <span>
                  Total Assets
                </span>

                <strong>
                  {dashboard.assets}
                </strong>

              </div>

              <div>

                <span>
                  Servers
                </span>

                <strong>
                  {dashboard.servers}
                </strong>

              </div>

              <div>

                <span>
                  Endpoints
                </span>

                <strong>
                  {dashboard.endpoints}
                </strong>

              </div>

              <div>

                <span>
                  Users
                </span>

                <strong>
                  {dashboard.users}
                </strong>

              </div>

              <div>

                <span>
                  Alerts
                </span>

                <strong>
                  {alertCount}
                </strong>

              </div>

              <div>

                <span>
                  Security Score
                </span>

                <strong>
                  {securityScoreValue}%
                </strong>

              </div>

            </div>

          </motion.div>

          {/* =================================================
              LIVE SECURITY ALERTS
          ================================================= */}

          <motion.div
            className=
              "panel alerts-panel"

            initial={{
              opacity: 0,
              y: 40,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}

            transition={{
              duration: 0.6,
            }}
          >

            <h2>

              <FaExclamationTriangle />

              Live Security Alerts

            </h2>

            <div
              className=
                "alert-table"
            >

              <div
                className=
                  "alert-header"
              >

                <span>
                  Severity
                </span>

                <span>
                  Asset
                </span>

                <span>
                  Category
                </span>

                <span>
                  Status
                </span>

              </div>

              {dashboard.alertList?.length > 0 ? (

                dashboard.alertList
                  .slice(0, 10)
                  .map(
                    (
                      alert,
                      index
                    ) => (

                      <motion.div

                        key={
                          alert.id ??
                          index
                        }

                        whileHover={{
                          scale:
                            1.01,
                        }}

                        className={
                          `alert-row ${normalizeText(
                            alert.severity
                          )}`
                        }

                      >

                        <span>

                          <strong>

                            {
                              alert.severity ||
                              "Unknown"
                            }

                          </strong>

                        </span>

                        <span>

                          {
                            alert.assetName ||
                            alert.asset ||
                            "Unknown Asset"
                          }

                        </span>

                        <span>

                          {
                            alert.type ||
                            alert.category ||
                            "Security"
                          }

                        </span>

                        <span>

                          {
                            alert.status ||
                            "OPEN"
                          }

                        </span>

                      </motion.div>

                    )
                  )

              ) : (

                <p>
                  No Alerts Available
                </p>

              )}

            </div>

          </motion.div>

          {/* =================================================
              RECENT ACTIVITIES
          ================================================= */}

          <motion.div
            className=
              "panel"

            initial={{
              opacity: 0,
              x: -40,
            }}

            animate={{
              opacity: 1,
              x: 0,
            }}

            transition={{
              duration:
                0.6,
            }}
          >

            <h2>

              <FaClock />

              Recent Activities

            </h2>

            <div
              className=
                "timeline"
            >

              {dashboard.activities?.length > 0 ? (

                dashboard.activities.map(
                  (
                    activity,
                    index
                  ) => (

                    <motion.div

                      key={
                        index
                      }

                      className=
                        "timeline-item"

                      initial={{
                        opacity: 0,
                        x: -20,
                      }}

                      animate={{
                        opacity: 1,
                        x: 0,
                      }}

                      transition={{
                        delay:
                          index *
                          0.15,
                      }}

                    >

                      <div
                        className=
                          "timeline-dot"
                      />

                      <div
                        className=
                          "timeline-content"
                      >

                        <h4>

                          {
                            typeof activity ===
                            "string"

                              ? activity

                              : activity?.message ||
                                activity?.title ||
                                "Activity"
                          }

                        </h4>

                        <p>

                          {
                            activity?.createdAt

                              ? new Date(
                                  activity.createdAt
                                ).toLocaleString()

                              : new Date().toLocaleString()
                          }

                        </p>

                      </div>

                    </motion.div>

                  )
                )

              ) : (

                <p>
                  No recent activities.
                </p>

              )}

            </div>

          </motion.div>

          {/* =================================================
              CLOUD
          ================================================= */}

          <motion.div
            className=
              "panel"

            initial={{
              opacity: 0,
              y: 30,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}
          >

            <h2>

              <FaCloud />

              Cloud Infrastructure

            </h2>

            <div
              className=
                "cloud-grid"
            >

              {dashboard.cloud?.length > 0 ? (

                dashboard.cloud.map(
                  (
                    item,
                    index
                  ) => (

                    <motion.div

                      key={
                        index
                      }

                      whileHover={{
                        scale:
                          1.05,
                      }}

                      className=
                        "cloud-card"

                    >

                      <FaCloud
                        size={
                          32
                        }
                      />

                      <h3>
                        {item}
                      </h3>

                    </motion.div>

                  )
                )

              ) : (

                <p>
                  No cloud infrastructure data.
                </p>

              )}

            </div>

          </motion.div>

          {/* =================================================
              RECOMMENDATIONS
          ================================================= */}

          <motion.div
            className=
              "panel"

            initial={{
              opacity: 0,
              x: 40,
            }}

            animate={{
              opacity: 1,
              x: 0,
            }}

            transition={{
              duration:
                0.7,
            }}
          >

            <h2>

              <FaShieldAlt />

              Security Recommendations

            </h2>

            <div
              className=
                "recommendation-list"
            >

              {dashboard.recommendations?.length > 0 ? (

                dashboard.recommendations.map(
                  (
                    item,
                    index
                  ) => (

                    <motion.div

                      key={
                        index
                      }

                      className=
                        "recommendation"

                      whileHover={{
                        x: 8,
                      }}

                    >

                      <FaCheckCircle
                        color=
                          "#22c55e"
                      />

                      <p>

                        {
                          typeof item ===
                          "string"

                            ? item

                            : item?.message ||
                              item?.title ||
                              "Recommendation"
                        }

                      </p>

                    </motion.div>

                  )
                )

              ) : (

                <p>
                  No recommendations available.
                </p>

              )}

            </div>

          </motion.div>

          {/* =================================================
              LIVE EVENT FEED
          ================================================= */}

          <motion.div
            className=
              "panel"

            initial={{
              opacity: 0,
              y: 30,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}
          >

            <h2>
              🔥 Live Event Feed
            </h2>

            <div
              className=
                "event-feed"
            >

              <div>

                <span
                  className=
                    "event-green"
                />

                Firewall policy updated

              </div>

              <div>

                <span
                  className=
                    "event-blue"
                />

                Windows Defender Scan Completed

              </div>

              <div>

                <span
                  className=
                    "event-yellow"
                />

                Patch Deployment Scheduled

              </div>

              <div>

                <span
                  className=
                    "event-red"
                />

                High CPU detected on Server-01

              </div>

              <div>

                <span
                  className=
                    "event-green"
                />

                Database Backup Successful

              </div>

              <div>

                <span
                  className=
                    "event-blue"
                />

                User Login Verified

              </div>

            </div>

          </motion.div>

          {/* =================================================
              HEALTH SUMMARY
          ================================================= */}

          <motion.div
            className=
              "panel"

            initial={{
              opacity: 0,
              scale:
                0.95,
            }}

            animate={{
              opacity: 1,
              scale: 1,
            }}
          >

            <h2>
              System Health Summary
            </h2>

            <div
              className=
                "health-summary"
            >

              <div>

                <h3>
                  {cpuValue.toFixed(1)}%
                </h3>

                <p>
                  CPU
                </p>

              </div>

              <div>

                <h3>
                  {memoryValue.toFixed(1)}%
                </h3>

                <p>
                  Memory
                </p>

              </div>

              <div>

                <h3>
                  {diskValue.toFixed(1)}%
                </h3>

                <p>
                  Disk
                </p>

              </div>

              <div>

                <h3>
                  {toNumber(
                    dashboard.network
                  )}
                </h3>

                <p>
                  Network
                </p>

              </div>

            </div>

          </motion.div>

        </div>

        <Footer />

      </div>

    </div>

  );

}

export default Dashboard;