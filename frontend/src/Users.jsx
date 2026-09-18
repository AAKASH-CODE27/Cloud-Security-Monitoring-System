// src/Users.jsx

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { motion } from "framer-motion";

import {
  FaUserPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaUserShield,
  FaUserTie,
  FaUsers,
  FaSyncAlt,
  FaTimes,
  FaSave,
} from "react-icons/fa";

import { toast } from "react-toastify";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Pagination from "./Pagination";

import API from "./api/axios";

import "./Users.css";

export default function Users() {

  /* =====================================================
      STATES
  ===================================================== */

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  /* =====================================================
      SEARCH
  ===================================================== */

  const [search, setSearch] = useState("");

  /* =====================================================
      FILTERS
  ===================================================== */

  const [roleFilter, setRoleFilter] =
    useState("ALL");

  const [departmentFilter, setDepartmentFilter] =
    useState("ALL");

  /* =====================================================
      PAGINATION
  ===================================================== */

  const [page, setPage] = useState(1);

  const pageSize = 10;

  /* =====================================================
      EDIT MODAL
  ===================================================== */

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [editingUser, setEditingUser] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  /* =====================================================
      EDIT FORM
  ===================================================== */

  const [editForm, setEditForm] = useState({

    name: "",

    email: "",

    department: "",

    role: "USER",

    enabled: true,

  });

  /* =====================================================
      LOAD USERS
  ===================================================== */

  const loadUsers = async () => {

    try {

      setLoading(true);

      setError("");

      const response =
        await API.get("/users");

      setUsers(
        Array.isArray(response.data)
          ? response.data
          : []
      );

    } catch (err) {

      console.error(
        "Load Users Error:",
        err.response?.data ||
        err.message
      );

      setError(
        "Unable to load users."
      );

      toast.error(
        "Unable to load users."
      );

    } finally {

      setLoading(false);

    }

  };

  /* =====================================================
      INITIAL LOAD
  ===================================================== */

  useEffect(() => {

    loadUsers();

  }, []);

  /* =====================================================
      DELETE USER
  ===================================================== */

  const deleteUser = async (id) => {

    if (
      !window.confirm(
        "Are you sure you want to delete this user?"
      )
    ) {
      return;
    }

    try {

      await API.delete(
        `/users/${id}`
      );

      toast.success(
        "User deleted successfully."
      );

      await loadUsers();

    } catch (err) {

      console.error(
        "Delete User Error:",
        err.response?.data ||
        err.message
      );

      toast.error(
        err.response?.data?.message ||
        "Unable to delete user."
      );

    }

  };

  /* =====================================================
      OPEN EDIT MODAL
  ===================================================== */

  const handleEdit = (user) => {

    setEditingUser(user);

    setEditForm({

      name:
        user.name ||
        user.username ||
        "",

      email:
        user.email ||
        "",

      department:
        user.department ||
        "",

      role:
        user.role ||
        "USER",

      enabled:
        user.enabled !== false,

    });

    setShowEditModal(true);

  };

  /* =====================================================
      HANDLE EDIT INPUT
  ===================================================== */

  const handleEditChange = (e) => {

    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setEditForm((prev) => ({

      ...prev,

      [name]:
        type === "checkbox"
          ? checked
          : value,

    }));

  };

  /* =====================================================
      VALIDATE EDIT FORM
  ===================================================== */

  const validateEditForm = () => {

    if (!editForm.name.trim()) {

      toast.error(
        "Name is required."
      );

      return false;

    }

    if (!editForm.email.trim()) {

      toast.error(
        "Email is required."
      );

      return false;

    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailRegex.test(
        editForm.email.trim()
      )
    ) {

      toast.error(
        "Enter a valid email address."
      );

      return false;

    }

    if (!editForm.department) {

      toast.error(
        "Please select a department."
      );

      return false;

    }

    if (!editForm.role) {

      toast.error(
        "Please select a role."
      );

      return false;

    }

    return true;

  };

  /* =====================================================
      UPDATE USER
  ===================================================== */

  const handleUpdateUser = async (e) => {

    e.preventDefault();

    if (!validateEditForm()) {
      return;
    }

    if (!editingUser?.id) {

      toast.error(
        "User ID is missing."
      );

      return;

    }

    try {

      setSaving(true);

      const payload = {

        name:
          editForm.name.trim(),

        email:
          editForm.email
            .trim()
            .toLowerCase(),

        department:
          editForm.department,

        role:
          editForm.role,

        enabled:
          editForm.enabled,

      };

      console.log(
        "Updating User:",
        editingUser.id,
        payload
      );

      const response =
        await API.put(
          `/users/${editingUser.id}`,
          payload
        );

      console.log(
        "User Updated:",
        response.data
      );

      toast.success(
        "User updated successfully."
      );

      setShowEditModal(false);

      setEditingUser(null);

      setEditForm({

        name: "",

        email: "",

        department: "",

        role: "USER",

        enabled: true,

      });

      await loadUsers();

    } catch (err) {

      console.error(
        "Update User Error:",
        err.response?.data ||
        err.message
      );

      toast.error(
        err.response?.data?.message ||
        "Unable to update user."
      );

    } finally {

      setSaving(false);

    }

  };

  /* =====================================================
      CLOSE EDIT MODAL
  ===================================================== */

  const closeEditModal = () => {

    if (saving) {
      return;
    }

    setShowEditModal(false);

    setEditingUser(null);

    setEditForm({

      name: "",

      email: "",

      department: "",

      role: "USER",

      enabled: true,

    });

  };

  /* =====================================================
      FILTER USERS
  ===================================================== */

  const filteredUsers = useMemo(() => {

    const keyword =
      search.trim().toLowerCase();

    return users.filter((user) => {

      const name =
        String(
          user.name ||
          user.username ||
          ""
        ).toLowerCase();

      const email =
        String(
          user.email ||
          ""
        ).toLowerCase();

      const department =
        String(
          user.department ||
          ""
        ).toUpperCase();

      const role =
        String(
          user.role ||
          ""
        ).toUpperCase();

      const matchesSearch =
        !keyword ||
        name.includes(keyword) ||
        email.includes(keyword);

      const matchesRole =
        roleFilter === "ALL" ||
        role === roleFilter;

      const matchesDepartment =
        departmentFilter === "ALL" ||
        department ===
          departmentFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesDepartment
      );

    });

  }, [
    users,
    search,
    roleFilter,
    departmentFilter,
  ]);

  /* =====================================================
      PAGINATION
  ===================================================== */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredUsers.length /
      pageSize
    )
  );

  const currentUsers =
    filteredUsers.slice(
      (page - 1) * pageSize,
      page * pageSize
    );

  /* =====================================================
      COUNTS
  ===================================================== */

  const admins = users.filter(
    (u) =>
      String(u.role || "")
        .toUpperCase() ===
      "ADMIN"
  ).length;

  const analysts = users.filter(
    (u) =>
      String(u.role || "")
        .toUpperCase() ===
      "ANALYST"
  ).length;

  const operators = users.filter(
    (u) =>
      String(u.role || "")
        .toUpperCase() ===
      "OPERATOR"
  ).length;

  /* =====================================================
      REFRESH
  ===================================================== */

  const refresh = () => {

    loadUsers();

    toast.success(
      "Users refreshed."
    );

  };

  /* =====================================================
      RETURN
  ===================================================== */

  return (

    <div className="dashboard">

      <Sidebar />

      <div className="content">

        <Navbar />

        <motion.div
          className="users-page"
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          transition={{
            duration: 0.5
          }}
        >

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="page-header">

            <div>

              <h1>
                User Management
              </h1>

              <p>
                Manage users, departments,
                permissions and roles.
              </p>

            </div>

            <button
              className="refresh-btn"
              onClick={refresh}
            >

              <FaSyncAlt />

              Refresh

            </button>

          </div>

          {/* =================================================
              SUMMARY
          ================================================= */}

          <div className="summary-grid">

            <motion.div
              whileHover={{
                scale: 1.05
              }}
              className="summary-card total"
            >

              <FaUsers />

              <h2>
                {users.length}
              </h2>

              <span>
                Total Users
              </span>

            </motion.div>

            <motion.div
              whileHover={{
                scale: 1.05
              }}
              className="summary-card admin"
            >

              <FaUserShield />

              <h2>
                {admins}
              </h2>

              <span>
                Administrators
              </span>

            </motion.div>

            <motion.div
              whileHover={{
                scale: 1.05
              }}
              className="summary-card analyst"
            >

              <FaUserTie />

              <h2>
                {analysts}
              </h2>

              <span>
                Analysts
              </span>

            </motion.div>

            <motion.div
              whileHover={{
                scale: 1.05
              }}
              className="summary-card operator"
            >

              <FaUsers />

              <h2>
                {operators}
              </h2>

              <span>
                Operators
              </span>

            </motion.div>

          </div>

          {/* =================================================
              TOOLBAR
          ================================================= */}

          <div className="toolbar">

            <div className="search-box">

              <FaSearch />

              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => {

                  setSearch(
                    e.target.value
                  );

                  setPage(1);

                }}
              />

            </div>

            <select
              value={roleFilter}
              onChange={(e) => {

                setRoleFilter(
                  e.target.value
                );

                setPage(1);

              }}
            >

              <option value="ALL">
                All Roles
              </option>

              <option value="ADMIN">
                Administrator
              </option>

              <option value="ANALYST">
                Analyst
              </option>

              <option value="OPERATOR">
                Operator
              </option>

              <option value="VIEWER">
                Viewer
              </option>

              <option value="USER">
                User
              </option>

              <option value="ITSM">
                ITSM
              </option>

            </select>

            <select
              value={departmentFilter}
              onChange={(e) => {

                setDepartmentFilter(
                  e.target.value
                );

                setPage(1);

              }}
            >

              <option value="ALL">
                All Departments
              </option>

              <option value="SOC">
                SOC
              </option>

              <option value="IT">
                IT
              </option>

              <option value="NETWORK">
                Network
              </option>

              <option value="SECURITY">
                Security
              </option>

              <option value="DEVOPS">
                DevOps
              </option>

              <option value="HR">
                HR
              </option>

              <option value="FINANCE">
                Finance
              </option>

            </select>

          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loading && (

            <div className="loading-container">

              <div className="loader"></div>

              <h3>
                Loading Users...
              </h3>

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

          {/* =================================================
              TABLE
          ================================================= */}

          {!loading &&
            !error && (

              <motion.div
                className="table-container"
                initial={{
                  opacity: 0,
                  y: 20
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
              >

                <table
                  className="users-table"
                >

                  <thead>

                    <tr>

                      <th>
                        Name
                      </th>

                      <th>
                        Email
                      </th>

                      <th>
                        Department
                      </th>

                      <th>
                        Role
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Last Login
                      </th>

                      <th>
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {currentUsers.map(
                      (user) => (

                        <tr
                          key={user.id}
                        >

                          <td>

                            {
                              user.name ||
                              user.username ||
                              "-"
                            }

                          </td>

                          <td>
                            {user.email || "-"}
                          </td>

                          <td>
                            {user.department || "-"}
                          </td>

                          <td>

                            <span
                              className={`role-badge ${
                                String(
                                  user.role ||
                                  ""
                                ).toLowerCase()
                              }`}
                            >

                              {user.role || "-"}

                            </span>

                          </td>

                          <td>

                            <span
                              className={`status-badge ${
                                user.enabled
                                  ? "active"
                                  : "inactive"
                              }`}
                            >

                              {user.enabled
                                ? "Active"
                                : "Disabled"}

                            </span>

                          </td>

                          <td>

                            {
                              user.lastLogin ||
                              "Never"
                            }

                          </td>

                          <td>

                            <div
                              className="table-actions"
                            >

                              {/* EDIT */}

                              {/* <button
                                type="button"
                                className="edit-btn"
                                title="Edit User"
                                onClick={() =>
                                  handleEdit(
                                    user
                                  )
                                }
                              >

                                <FaEdit />

                              </button> */}

                              {/* DELETE */}

                              <button
                                type="button"
                                className="delete-btn"
                                title="Delete User"
                                onClick={() =>
                                  deleteUser(
                                    user.id
                                  )
                                }
                              >

                                <FaTrash />

                              </button>

                            </div>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </motion.div>

            )}

          {/* =================================================
              EMPTY STATE
          ================================================= */}

          {!loading &&
            filteredUsers.length === 0 && (

              <div
                className="empty-state"
              >

                <FaUsers size={70} />

                <h2>
                  No Users Found
                </h2>

                <p>
                  No users matched your
                  search criteria.
                </p>

              </div>

            )}

          {/* =================================================
              PAGINATION
          ================================================= */}

          {!loading &&
            filteredUsers.length >
            pageSize && (

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />

            )}

        </motion.div>

        <Footer />

      </div>

      {/* =====================================================
          EDIT USER MODAL
      ===================================================== */}

      {showEditModal && (

        <div className="user-modal-overlay">

          <motion.div
            className="user-edit-modal"

            initial={{
              opacity: 0,
              scale: 0.95,
              y: 20,
            }}

            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}

            transition={{
              duration: 0.25,
            }}
          >

            {/* ==========================
                MODAL HEADER
            =========================== */}

            <div className="user-modal-header">

              <div>

                <h2>
                  Edit User
                </h2>

                <p>
                  Update user details
                  and permissions.
                </p>

              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={closeEditModal}
                disabled={saving}
              >

                <FaTimes />

              </button>

            </div>

            {/* ==========================
                FORM
            =========================== */}

            <form
              className="user-edit-form"
              onSubmit={handleUpdateUser}
            >

              {/* NAME */}

              <div className="form-group">

                <label>
                  Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  placeholder="Enter name"
                />

              </div>

              {/* EMAIL */}

              <div className="form-group">

                <label>
                  Email *
                </label>

                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  placeholder="Enter email"
                />

              </div>

              {/* DEPARTMENT */}

              <div className="form-group">

                <label>
                  Department *
                </label>

                <select
                  name="department"
                  value={
                    editForm.department
                  }
                  onChange={handleEditChange}
                >

                  <option value="">
                    Select Department
                  </option>

                  <option value="SOC">
                    SOC
                  </option>

                  <option value="IT">
                    IT
                  </option>

                  <option value="NETWORK">
                    Network
                  </option>

                  <option value="SECURITY">
                    Security
                  </option>

                  <option value="DEVOPS">
                    DevOps
                  </option>

                  <option value="HR">
                    HR
                  </option>

                  <option value="FINANCE">
                    Finance
                  </option>

                </select>

              </div>

              {/* ROLE */}

              <div className="form-group">

                <label>
                  Role *
                </label>

                <select
                  name="role"
                  value={editForm.role}
                  onChange={handleEditChange}
                >

                  <option value="ADMIN">
                    Administrator
                  </option>

                  <option value="ANALYST">
                    Analyst
                  </option>

                  <option value="OPERATOR">
                    Operator
                  </option>

                  <option value="VIEWER">
                    Viewer
                  </option>

                  <option value="USER">
                    User
                  </option>

                  <option value="ITSM">
                    ITSM
                  </option>

                </select>

              </div>

              {/* ENABLED */}

              <div className="form-group checkbox-group">

                <label>

                  <input
                    type="checkbox"
                    name="enabled"
                    checked={
                      editForm.enabled
                    }
                    onChange={
                      handleEditChange
                    }
                  />

                  <span>
                    User account enabled
                  </span>

                </label>

              </div>

              {/* BUTTONS */}

              <div className="user-modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeEditModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-btn"
                  disabled={saving}
                >

                  <FaSave />

                  {saving
                    ? "Saving..."
                    : "Save Changes"}

                </button>

              </div>

            </form>

          </motion.div>

        </div>

      )}

    </div>

  );

}