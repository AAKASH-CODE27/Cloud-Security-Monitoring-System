import { useEffect, useState, useCallback } from "react";
import { FaExclamationTriangle, FaCheckCircle, FaSyncAlt } from "react-icons/fa";
import { toast } from "react-toastify";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { RealTimeStatusIndicator } from "./socket/RealTimeNotification";

import { getAssets } from "./api/assetsApi";
import { getAlerts } from "./api/alertApi";
import { useSocket } from "./hooks/useSocket";

import "./Alerts.css";

function Alerts() {
  const { socket } = useSocket();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load and merge alerts from both backend Alert model and asset health metrics
  const fetchAllAlerts = useCallback(async () => {
    try {
      setLoading(true);

      const [assetsRes, alertsRes] = await Promise.allSettled([
        getAssets(),
        getAlerts({ limit: 50 }),
      ]);

      const assetData = assetsRes.status === "fulfilled" ? assetsRes.value?.data || [] : [];
      const backendAlerts =
        alertsRes.status === "fulfilled"
          ? alertsRes.value?.data?.data || alertsRes.value?.data || []
          : [];

      const generatedAlerts = [];

      // Generate alerts from real-time asset telemetry
      assetData.forEach((asset) => {
        const aId = asset._id || asset.id;
        const aName = asset.assetName || asset.hostname || `Asset ${aId}`;

        if (asset.health?.toLowerCase() === "critical") {
          generatedAlerts.push({
            id: `health-${aId}`,
            assetId: aId,
            assetName: aName,
            type: "System Health",
            severity: "Critical",
            status: "OPEN",
            description: "Asset health is in critical condition.",
          });
        }

        if (asset.status?.toLowerCase() === "inactive") {
          generatedAlerts.push({
            id: `status-${aId}`,
            assetId: aId,
            assetName: aName,
            type: "Status",
            severity: "High",
            status: "OPEN",
            description: "Asset is currently inactive.",
          });
        }

        if (Number(asset.riskScore) >= 80) {
          generatedAlerts.push({
            id: `risk-${aId}`,
            assetId: aId,
            assetName: aName,
            type: "Security Risk",
            severity: "Critical",
            status: "OPEN",
            description: `High security risk detected. Risk score: ${asset.riskScore}%.`,
          });
        } else if (Number(asset.riskScore) >= 50) {
          generatedAlerts.push({
            id: `risk-${aId}`,
            assetId: aId,
            assetName: aName,
            type: "Security Risk",
            severity: "Medium",
            status: "OPEN",
            description: `Medium security risk detected. Risk score: ${asset.riskScore}%.`,
          });
        }
      });

      // Normalize backend alert records
      const backendList = backendAlerts.map((b) => ({
        id: b._id || b.id,
        assetId: b.asset || b.assetName || "System",
        assetName: b.assetName || b.asset || "System",
        type: b.category || "Security",
        severity:
          b.severity?.charAt(0).toUpperCase() + b.severity?.slice(1).toLowerCase() || "Medium",
        status: b.status || "OPEN",
        description: b.description || b.title,
      }));

      // Deduplicate by combining backend alerts first then generated alerts
      const combined = [...backendList];
      generatedAlerts.forEach((gen) => {
        if (!combined.some((c) => c.id === gen.id || c.description === gen.description)) {
          combined.push(gen);
        }
      });

      setAlerts(combined);
    } catch (error) {
      console.error("Failed to load alerts:", error);
      toast.error("Unable to load security alerts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllAlerts();
  }, [fetchAllAlerts]);

  // Socket.IO real-time event listeners
  useEffect(() => {
    if (!socket) return;

    const onAlertCreated = (newAlert) => {
      const normalized = {
        id: newAlert._id || newAlert.id,
        assetId: newAlert.asset || newAlert.assetName || "System",
        assetName: newAlert.assetName || newAlert.asset || "System",
        type: newAlert.category || "Security",
        severity:
          newAlert.severity?.charAt(0).toUpperCase() +
            newAlert.severity?.slice(1).toLowerCase() || "Medium",
        status: newAlert.status || "OPEN",
        description: newAlert.description || newAlert.title,
      };

      setAlerts((prev) => [normalized, ...prev.filter((a) => a.id !== normalized.id)]);
      toast.info(`🔔 New Alert: ${normalized.description}`);
    };

    const onAlertUpdated = (updatedAlert) => {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === updatedAlert._id || a.id === updatedAlert.id
            ? {
                ...a,
                status: updatedAlert.status,
                severity:
                  updatedAlert.severity?.charAt(0).toUpperCase() +
                    updatedAlert.severity?.slice(1).toLowerCase() || a.severity,
              }
            : a
        )
      );
    };

    const onAssetUpdated = () => {
      fetchAllAlerts();
    };

    socket.on("alert:created", onAlertCreated);
    socket.on("alert:updated", onAlertUpdated);
    socket.on("asset:updated", onAssetUpdated);
    socket.on("asset:discovered", onAssetUpdated);

    return () => {
      socket.off("alert:created", onAlertCreated);
      socket.off("alert:updated", onAlertUpdated);
      socket.off("asset:updated", onAssetUpdated);
      socket.off("asset:discovered", onAssetUpdated);
    };
  }, [socket, fetchAllAlerts]);

  const criticalAlerts = alerts.filter(
    (alert) => alert.severity?.toLowerCase() === "critical"
  ).length;

  const highAlerts = alerts.filter(
    (alert) => alert.severity?.toLowerCase() === "high"
  ).length;

  const mediumAlerts = alerts.filter(
    (alert) => alert.severity?.toLowerCase() === "medium"
  ).length;

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="content">
        <Navbar />

        <div className="alerts-page">
          <div className="alerts-header">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <h1>Security Alerts</h1>
                <RealTimeStatusIndicator />
              </div>
              <p>Live threat intelligence and telemetry alerts generated from your infrastructure.</p>
            </div>

            <button
              type="button"
              className="refresh-btn"
              onClick={fetchAllAlerts}
              disabled={loading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "6px",
                background: "#1e293b",
                border: "1px solid #334155",
                color: "#e2e8f0",
                cursor: "pointer",
              }}
            >
              <FaSyncAlt /> {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {/* ALERT SUMMARY */}
          <div className="alert-cards">
            <div className="alert-card critical">
              <FaExclamationTriangle />
              <div>
                <h3>Critical</h3>
                <h2>{criticalAlerts}</h2>
              </div>
            </div>

            <div className="alert-card high">
              <FaExclamationTriangle />
              <div>
                <h3>High</h3>
                <h2>{highAlerts}</h2>
              </div>
            </div>

            <div className="alert-card medium">
              <FaExclamationTriangle />
              <div>
                <h3>Medium</h3>
                <h2>{mediumAlerts}</h2>
              </div>
            </div>

            <div className="alert-card total">
              <FaCheckCircle />
              <div>
                <h3>Total Alerts</h3>
                <h2>{alerts.length}</h2>
              </div>
            </div>
          </div>

          {/* LOADING */}
          {loading && <div className="loading">Loading live alerts...</div>}

          {/* ALERT TABLE */}
          {!loading && (
            <div className="table-container">
              <table className="alert-table">
                <thead>
                  <tr>
                    <th>ID / Source</th>
                    <th>Asset</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {alerts.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-data">
                        No active alerts found.
                      </td>
                    </tr>
                  ) : (
                    alerts.map((alert) => (
                      <tr key={alert.id}>
                        <td style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                          {String(alert.id).slice(-8)}
                        </td>
                        <td>{alert.assetName}</td>
                        <td>{alert.type}</td>
                        <td>
                          <span
                            className={`severity ${(
                              alert.severity || "medium"
                            ).toLowerCase()}`}
                          >
                            {alert.severity}
                          </span>
                        </td>
                        <td>{alert.description}</td>
                        <td>
                          <span className="alert-status">{alert.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
}

export default Alerts;