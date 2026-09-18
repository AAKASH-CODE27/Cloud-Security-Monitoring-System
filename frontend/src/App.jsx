import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./Login";
import Register from "./Register";

import Dashboard from "./Dashboard";
import Assets from "./Assets";
import Alerts from "./Alerts";
import Users from "./Users";
import Reports from "./Reports";
import Vulnerabilities from "./Vulnerabilities";
import Incidents from "./Incidents";
import Cloud from "./Cloud";
import Profile from "./Profile";
import Settings from "./Settings";

import ProtectedRoute from "./ProtectedRoute";
import NotFound from "./NotFound";

function App() {
  return (
    <Routes>
      {/* ================= Authentication ================= */}

      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      {/* ================= Dashboard ================= */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "ITSM", "USER"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* ================= Assets ================= */}

      <Route
        path="/assets"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "ITSM"]}>
            <Assets />
          </ProtectedRoute>
        }
      />

      {/* ================= Alerts ================= */}

      <Route
        path="/alerts"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "ITSM", "USER"]}>
            <Alerts />
          </ProtectedRoute>
        }
      />

      {/* ================= Vulnerabilities ================= */}

      <Route
        path="/vulnerabilities"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "ITSM"]}>
            <Vulnerabilities />
          </ProtectedRoute>
        }
      />

      {/* ================= Incidents ================= */}

      <Route
        path="/incidents"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "ITSM"]}>
            <Incidents />
          </ProtectedRoute>
        }
      />

      {/* ================= Cloud ================= */}

      <Route
        path="/cloud"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "ITSM"]}>
            <Cloud />
          </ProtectedRoute>
        }
      />

      {/* ================= Reports ================= */}

      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "ITSM", "USER"]}>
            <Reports />
          </ProtectedRoute>
        }
      />

      {/* ================= Users ================= */}

      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <Users />
          </ProtectedRoute>
        }
      />

      {/* ================= Profile ================= */}

      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "ITSM", "USER"]}>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* ================= Settings ================= */}

      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* ================= 404 ================= */}

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;