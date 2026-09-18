import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({
  children,
  allowedRoles = [],
}) {
  const { user, loading } = useAuth();

  // Loading
  if (loading) {
    return (
      <div
        style={{
          background: "#0b1120",
          color: "#ffffff",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          fontSize: "22px",
        }}
      >
        <div className="loader"></div>

        <p style={{ marginTop: "20px" }}>
          Loading SecureOps...
        </p>
      </div>
    );
  }

  // User not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role validation
  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role)
  ) {
    return (
      <div
        style={{
          background: "#111827",
          color: "#ffffff",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          textAlign: "center",
          padding: "20px",
        }}
      >
        <h1 style={{ color: "#ef4444", marginBottom: "10px" }}>
          🚫 Access Denied
        </h1>

        <p>
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  return children;
}

