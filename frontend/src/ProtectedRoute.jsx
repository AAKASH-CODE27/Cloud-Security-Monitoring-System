import { Navigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({
  children,
  allowedRoles = [],
}) {
  const { user, loading } = useAuth();

  // Loading
  if (loading) {
    return createPortal(
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "var(--bg, #1E242A)",
          zIndex: 99999
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            color: "var(--text-2, #B7C0C8)"
          }}
        >
          <div className="loader"></div>
          <p style={{ marginTop: "0", fontSize: "14px", fontWeight: 500 }}>
            Loading SecureOps...
          </p>
        </div>
      </div>,
      document.body
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

