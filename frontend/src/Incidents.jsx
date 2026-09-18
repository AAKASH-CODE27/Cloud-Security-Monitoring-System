import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FaBug,
  FaSearch,
  FaSyncAlt,
  FaUserShield,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClipboardList,
  FaEye,
  FaPlus,
} from "react-icons/fa";
import { toast } from "react-toastify";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Pagination from "./Pagination";

import { getIncidents, updateIncident, createIncident } from "./api/incidentApi";
import { useAuth } from "./AuthContext";
import { useSocket } from "./hooks/useSocket";
import { RealTimeStatusIndicator } from "./socket/RealTimeNotification";

import "./Incidents.css";

export default function Incidents() {
  const { canManageIncidents } = useAuth();
  const { socket } = useSocket();

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newIncident, setNewIncident] = useState({ title: "", description: "", severity: "HIGH", asset: "Server-01" });

  const pageSize = 8;

  const fetchIncidentsData = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getIncidents({ limit: 100 });
      const incidentList = response?.data?.data || response?.data || [];
      setIncidents(Array.isArray(incidentList) ? incidentList : []);
    } catch (err) {
      console.error(err);
      setError("Unable to load incidents from server.");
      toast.error("Unable to load incidents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentsData();
  }, []);

  // Socket.IO real-time event listeners
  useEffect(() => {
    if (!socket) return;

    const onIncidentCreated = (newInc) => {
      setIncidents((prev) => [newInc, ...prev.filter((i) => i._id !== newInc._id)]);
      toast.info(`⚠️ New Incident Created: ${newInc.title}`);
    };

    const onIncidentUpdated = (updatedInc) => {
      setIncidents((prev) =>
        prev.map((i) => (i._id === updatedInc._id ? updatedInc : i))
      );
      if (selectedIncident && selectedIncident._id === updatedInc._id) {
        setSelectedIncident(updatedInc);
      }
    };

    socket.on("incident:created", onIncidentCreated);
    socket.on("incident:updated", onIncidentUpdated);

    return () => {
      socket.off("incident:created", onIncidentCreated);
      socket.off("incident:updated", onIncidentUpdated);
    };
  }, [socket, selectedIncident]);

  const handleRefresh = () => {
    fetchIncidentsData();
    toast.success("Incidents refreshed from server");
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateIncident(id, { status: newStatus });
      toast.success(`Incident marked as ${newStatus}`);
      fetchIncidentsData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update incident status.");
    }
  };

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    try {
      await createIncident(newIncident);
      toast.success("Incident logged successfully.");
      setShowCreateModal(false);
      setNewIncident({ title: "", description: "", severity: "HIGH", asset: "Server-01" });
      fetchIncidentsData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to log incident.");
    }
  };

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const matchSearch =
        incident.title?.toLowerCase().includes(search.toLowerCase()) ||
        incident.asset?.toLowerCase().includes(search.toLowerCase()) ||
        incident.assignedUser?.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "ALL" || incident.status === statusFilter;
      const matchPriority = priorityFilter === "ALL" || incident.severity === priorityFilter;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [incidents, search, statusFilter, priorityFilter]);

  const openCount = filteredIncidents.filter((i) => i.status === "OPEN").length;
  const investigatingCount = filteredIncidents.filter((i) => i.status === "INVESTIGATING").length;
  const resolvedCount = filteredIncidents.filter((i) => i.status === "RESOLVED").length;
  const assignedCount = filteredIncidents.filter((i) => i.status === "ASSIGNED").length;

  const totalPages = Math.max(1, Math.ceil(filteredIncidents.length / pageSize));
  const currentIncidents = filteredIncidents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content">
        <Navbar />

        <motion.div className="incidents-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <div className="page-header">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <h1>Incident Response Center</h1>
                <RealTimeStatusIndicator />
              </div>
              <p>Real-time security incident tracking and resolution workflows.</p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              {canManageIncidents() && (
                <button className="refresh-btn" style={{ backgroundColor: "#0284c7" }} onClick={() => setShowCreateModal(true)}>
                  <FaPlus /> Log Incident
                </button>
              )}
              <button className="refresh-btn" onClick={handleRefresh}>
                <FaSyncAlt /> Refresh
              </button>
            </div>
          </div>

          <div className="summary-grid">
            <motion.div whileHover={{ scale: 1.03 }} className="summary-card open">
              <FaExclamationTriangle />
              <h2>{openCount}</h2>
              <span>Open</span>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} className="summary-card investigating">
              <FaBug />
              <h2>{investigatingCount}</h2>
              <span>Investigating</span>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} className="summary-card resolved">
              <FaCheckCircle />
              <h2>{resolvedCount}</h2>
              <span>Resolved</span>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} className="summary-card assigned">
              <FaUserShield />
              <h2>{assignedCount}</h2>
              <span>Assigned</span>
            </motion.div>
          </div>

          <div className="toolbar">
            <div className="search-box">
              <FaSearch />
              <input
                type="text"
                placeholder="Search incidents..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Status</option>
              <option value="OPEN">Open</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Severity</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {loading && (
            <div className="loading-container">
              <div className="loader"></div>
              <h3>Loading Incidents...</h3>
            </div>
          )}

          {error && <div className="error-box">{error}</div>}

          {!loading && !error && filteredIncidents.length > 0 && (
            <motion.div className="table-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <table className="incident-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Title</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentIncidents.map((incident) => (
                    <motion.tr key={incident._id || incident.id} whileHover={{ scale: 1.01 }}>
                      <td>{incident.asset}</td>
                      <td>{incident.title}</td>
                      <td>
                        <span className={`priority ${(incident.severity || "MEDIUM").toLowerCase()}`}>{incident.severity || "MEDIUM"}</span>
                      </td>
                      <td>
                        <span className={`status ${(incident.status || "OPEN").toLowerCase()}`}>{incident.status}</span>
                      </td>
                      <td>{incident.assignedUser || "Unassigned"}</td>
                      <td>{new Date(incident.createdAt || Date.now()).toLocaleString()}</td>
                      <td>
                        <div className="table-actions">
                          {canManageIncidents() && (
                            <>
                              <button className="assign-btn" title="Assign" onClick={() => handleUpdateStatus(incident._id || incident.id, "ASSIGNED")}>
                                <FaUserShield />
                              </button>
                              <button className="investigate-btn" title="Investigate" onClick={() => handleUpdateStatus(incident._id || incident.id, "INVESTIGATING")}>
                                <FaBug />
                              </button>
                              <button className="resolve-btn" title="Resolve" onClick={() => handleUpdateStatus(incident._id || incident.id, "RESOLVED")}>
                                <FaCheckCircle />
                              </button>
                            </>
                          )}
                          <button className="view-btn" title="View Details" onClick={() => setSelectedIncident(incident)}>
                            <FaEye />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}

          {!loading && !error && filteredIncidents.length === 0 && (
            <div className="empty-state">
              <FaClipboardList size={70} />
              <h2>No Incidents Found</h2>
              <p>No active incidents registered in database.</p>
            </div>
          )}

          {!loading && !error && filteredIncidents.length > pageSize && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          )}

          {/* Incident Details Modal */}
          {selectedIncident && (
            <div className="modal-overlay">
              <div className="incident-modal">
                <h2>Incident Details</h2>
                <p><strong>Asset:</strong> {selectedIncident.asset}</p>
                <p><strong>Title:</strong> {selectedIncident.title}</p>
                <p><strong>Severity:</strong> {selectedIncident.severity}</p>
                <p><strong>Status:</strong> {selectedIncident.status}</p>
                <p><strong>Assigned User:</strong> {selectedIncident.assignedUser}</p>
                <p><strong>Description:</strong> {selectedIncident.description}</p>
                {selectedIncident.resolutionNotes && <p><strong>Resolution Notes:</strong> {selectedIncident.resolutionNotes}</p>}
                <button className="close-btn" onClick={() => setSelectedIncident(null)}>Close</button>
              </div>
            </div>
          )}

          {/* Create Incident Modal */}
          {showCreateModal && (
            <div className="modal-overlay">
              <div className="incident-modal" style={{ maxWidth: "500px" }}>
                <h2>Log New Incident</h2>
                <form onSubmit={handleCreateIncident} style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "15px" }}>
                  <input
                    type="text"
                    placeholder="Title"
                    required
                    value={newIncident.title}
                    onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                    style={{ padding: "8px", borderRadius: "4px", border: "1px solid #334155", background: "#1e293b", color: "#fff" }}
                  />
                  <input
                    type="text"
                    placeholder="Asset Name"
                    required
                    value={newIncident.asset}
                    onChange={(e) => setNewIncident({ ...newIncident, asset: e.target.value })}
                    style={{ padding: "8px", borderRadius: "4px", border: "1px solid #334155", background: "#1e293b", color: "#fff" }}
                  />
                  <select
                    value={newIncident.severity}
                    onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                    style={{ padding: "8px", borderRadius: "4px", border: "1px solid #334155", background: "#1e293b", color: "#fff" }}
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                  <textarea
                    placeholder="Incident Description"
                    required
                    rows={4}
                    value={newIncident.description}
                    onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                    style={{ padding: "8px", borderRadius: "4px", border: "1px solid #334155", background: "#1e293b", color: "#fff" }}
                  />
                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                    <button type="button" className="close-btn" style={{ background: "#475569" }} onClick={() => setShowCreateModal(false)}>Cancel</button>
                    <button type="submit" className="close-btn" style={{ background: "#0284c7" }}>Submit</button>
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