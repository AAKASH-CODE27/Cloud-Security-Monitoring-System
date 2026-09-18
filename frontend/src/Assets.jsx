// src/Assets.jsx

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FaPlus,
  FaSyncAlt,
  FaServer,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";

import AssetTable from "./AssetTable";
import AssetForm from "./AssetForm";
import SearchBar from "./SearchBar";
import Pagination from "./Pagination";

import {
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset,
} from "./api/assetsApi";
import { useSocket } from "./hooks/useSocket";
import { RealTimeStatusIndicator } from "./socket/RealTimeNotification";

import "./Assets.css";

export default function Assets() {
  const { socket } = useSocket();

  // ==========================
  // State
  // ==========================

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 8;

  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  // ==========================
  // Load Assets
  // ==========================

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAssets({ limit: 100 });
      const assetList = response?.data?.data || response?.data || [];
      setAssets(Array.isArray(assetList) ? assetList : []);
    } catch (err) {
      console.error(err);
      setError("Unable to load assets.");
      toast.error("Unable to load assets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // Socket.IO real-time event listeners
  useEffect(() => {
    if (!socket) return;

    const onAssetCreated = (newAsset) => {
      setAssets((prev) => [newAsset, ...prev.filter((a) => (a._id || a.id) !== (newAsset._id || newAsset.id))]);
      toast.info(`💻 Asset Registered: ${newAsset.assetName || newAsset.hostname}`);
    };

    const onAssetDiscovered = (discAsset) => {
      setAssets((prev) => {
        const id = discAsset._id || discAsset.id;
        const exists = prev.some((a) => (a._id || a.id) === id);
        if (exists) {
          return prev.map((a) => ((a._id || a.id) === id ? discAsset : a));
        }
        return [discAsset, ...prev];
      });
      toast.success(`🌐 Discovered Host: ${discAsset.assetName || discAsset.hostname}`);
    };

    const onAssetUpdated = (updAsset) => {
      setAssets((prev) =>
        prev.map((a) =>
          (a._id || a.id) === (updAsset._id || updAsset.id) ? updAsset : a
        )
      );
    };

    socket.on("asset:created", onAssetCreated);
    socket.on("asset:discovered", onAssetDiscovered);
    socket.on("asset:updated", onAssetUpdated);

    return () => {
      socket.off("asset:created", onAssetCreated);
      socket.off("asset:discovered", onAssetDiscovered);
      socket.off("asset:updated", onAssetUpdated);
    };
  }, [socket]);

  // ==========================
  // Save Asset
  // ==========================

  const handleSave = async (asset) => {

    try {

      if (editingAsset) {

        await updateAsset(editingAsset.id, asset);

        toast.success("Asset updated successfully.");

      } else {

        await createAsset(asset);

        toast.success("Asset created successfully.");

      }

      await fetchAssets();

      setEditingAsset(null);

      setShowForm(false);

    } catch (err) {

      console.error(err);

      toast.error("Unable to save asset.");

    }

  };

  // ==========================
  // Delete Asset
  // ==========================

  const handleDelete = async (id) => {

    if (!window.confirm("Delete this asset?")) return;

    try {

      await deleteAsset(id);

      toast.success("Asset deleted.");

      fetchAssets();

    } catch (err) {

      console.error(err);

      toast.error("Delete failed.");

    }

  };

  // ==========================
  // Search & Filter
  // ==========================

  const filteredAssets = useMemo(() => {

    return assets.filter((asset) => {

      const matchSearch =

        asset.name?.toLowerCase().includes(search.toLowerCase()) ||

        asset.ip?.toLowerCase().includes(search.toLowerCase()) ||

        asset.owner?.toLowerCase().includes(search.toLowerCase());

      const matchStatus =

        statusFilter === "All" ||

        asset.status === statusFilter;

      const matchDepartment =

        departmentFilter === "All" ||

        asset.department === departmentFilter;

      return (

        matchSearch &&

        matchStatus &&

        matchDepartment

      );

    });

  }, [

    assets,

    search,

    statusFilter,

    departmentFilter

  ]);

  // ==========================
  // Dashboard Statistics
  // ==========================

  const totalAssets = assets.length;

 const activeAssets = assets.filter(
    asset => asset.status?.toLowerCase() === "active"
).length;

const inactiveAssets = assets.filter(
    asset => asset.status?.toLowerCase() === "inactive"
).length;

const healthyAssets = assets.filter(
    asset => asset.health?.toLowerCase() === "healthy"
).length;

  // ==========================
  // Pagination
  // ==========================

  const totalPages = Math.max(

    1,

    Math.ceil(filteredAssets.length / pageSize)

  );

  const currentAssets = filteredAssets.slice(

    (currentPage - 1) * pageSize,

    currentPage * pageSize

  );
    // ==========================
  // Refresh
  // ==========================

  const handleRefresh = () => {

    fetchAssets();

    toast.success("Assets refreshed");

  };

  // ==========================
  // Return UI
  // ==========================

  return (

    <div className="dashboard">

      <Sidebar />

      <div className="content">

        <Navbar />

        <motion.div

          className="assets-page"

          initial={{ opacity: 0 }}

          animate={{ opacity: 1 }}

          transition={{ duration: 0.5 }}

        >

          {/* ================= Summary Cards ================= */}

          <div className="assets-header">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <h1>Asset Inventory</h1>
                <RealTimeStatusIndicator />
              </div>
              <p>
                Manage and monitor all infrastructure assets.
              </p>
            </div>

            <div className="header-actions">

              <button

                className="refresh-btn"

                onClick={handleRefresh}

              >

                <FaSyncAlt />

                Refresh

              </button>

              <button

                className="add-btn"

                onClick={() => {

                  setEditingAsset(null);

                  setShowForm(true);

                }}

              >

                <FaPlus />

                Add Asset

              </button>
              {/* <button
  type="button"
  className="cancel-btn"
  onClick={() => setShowForm(false)}
>
  Cancel
</button> */}

            </div>

          </div>

          {/* ================= Dashboard Cards ================= */}

          <div className="asset-cards">

            <motion.div
              whileHover={{ scale: 1.03 }}
              className="asset-card"
            >
              <FaServer className="card-icon blue" />

              <h3>Total Assets</h3>

              <h2>{totalAssets}</h2>

            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              className="asset-card"
            >

              <FaCheckCircle className="card-icon green" />

              <h3>Active</h3>

              <h2>{activeAssets}</h2>

            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              className="asset-card"
            >

              <FaExclamationTriangle className="card-icon orange" />

              <h3>Inactive</h3>

              <h2>{inactiveAssets}</h2>

            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              className="asset-card"
            >

              <FaCheckCircle className="card-icon teal" />

              <h3>Healthy</h3>

              <h2>{healthyAssets}</h2>

            </motion.div>

          </div>

          {/* ================= Toolbar ================= */}
{/* 
          <div className="toolbar">

            <SearchBar

              value={search}

              onChange={(value) => {

                setSearch(value);

                setCurrentPage(1);

              }}

            />

            <select

              value={statusFilter}

              onChange={(e) => {

                setStatusFilter(e.target.value);

                setCurrentPage(1);

              }}

            >

              <option value="All">All Status</option>

              <option value="Healthy">Healthy</option>

              <option value="Active">Active</option>

              <option value="Inactive">Inactive</option>

              <option value="Critical">Critical</option>

            </select>

            <select

              value={departmentFilter}

              onChange={(e) => {

                setDepartmentFilter(e.target.value);

                setCurrentPage(1);

              }}

            >

              <option value="All">All Departments</option>

              <option value="IT">IT</option>

              <option value="SOC">SOC</option>

              <option value="HR">HR</option>

              <option value="Finance">Finance</option>

            </select>

          </div> */}

          {/* ================= Loading ================= */}

          {loading && (

            <div className="loading">

              Loading Assets...

            </div>

          )}

          {/* ================= Error ================= */}

          {error && (

            <div className="error">

              {error}

            </div>

          )}

                    {/* ================= Asset Table ================= */}

          {!loading && !error && filteredAssets.length > 0 && (

            <motion.div

              className="table-container"

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              transition={{ duration: 0.5 }}

            >

              <AssetTable

                assets={currentAssets}

                onEdit={(asset) => {

                  setEditingAsset(asset);

                  setShowForm(true);

                }}

                onDelete={handleDelete}

              />

            </motion.div>

          )}

          {/* ================= Empty State ================= */}

          {!loading &&

            !error &&

            filteredAssets.length === 0 && (

              <motion.div

                className="empty-state"

                initial={{ opacity: 0 }}

                animate={{ opacity: 1 }}

              >

                <FaTimesCircle size={70} />

                <h2>No Assets Found</h2>

                <p>

                  No assets match your current search or filter.

                </p>

                <button

                  className="add-btn"

                  onClick={() => {

                    setEditingAsset(null);

                    setShowForm(true);

                  }}

                >

                  <FaPlus />

                  Create First Asset

                </button>

              </motion.div>

            )}

          {/* ================= Pagination ================= */}

          {!loading &&

            !error &&

            filteredAssets.length > pageSize && (

              <Pagination

                currentPage={currentPage}

                totalPages={totalPages}

                onPageChange={setCurrentPage}

              />

            )}

          {/* ================= Asset Form Modal ================= */}

         {showForm && (
  <div className="asset-form-overlay">

    <div className="asset-form-modal">

      <AssetForm
        key={editingAsset?.id || "new"}
        asset={editingAsset}
        onSave={handleSave}
        onCancel={() => {
          setEditingAsset(null);
          setShowForm(false);
        }}
      />

    </div>

  </div>
)}

        </motion.div>

        {/* ================= Footer ================= */}

        <Footer />

      </div>

    </div>

  );

}