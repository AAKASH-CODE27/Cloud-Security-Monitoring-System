import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "./api/axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("currentUser");
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const loadProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await API.get("/users/profile");
      setUser(response.data);
      localStorage.setItem("currentUser", JSON.stringify(response.data));
    } catch (error) {
      console.error("Profile load error:", error);
      logout(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await API.post("/auth/login", {
        email: email.trim(),
        password,
      });

      const { token, user: userData } = response.data;

      if (token) {
        localStorage.setItem("token", token);
        API.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      if (userData) {
        localStorage.setItem("currentUser", JSON.stringify(userData));
        setUser(userData);
        toast.success(`Welcome back, ${userData.username}!`);
      }

      navigate("/dashboard");
      return true;
    } catch (error) {
      console.error("Login Error:", error);
      const msg = error.response?.data?.message || "Invalid credentials.";
      toast.error(msg);
      return false;
    }
  };

  const register = async (form) => {
    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        department: form.department?.trim() || "",
      };

      const response = await API.post("/auth/register", payload);
      toast.success(response.data?.message || "Account registered successfully! Please log in.");
      navigate("/login");
      return true;
    } catch (error) {
      console.error("Registration Error:", error);
      const msg = error.response?.data?.message || "Registration failed.";
      toast.error(msg);
      return false;
    }
  };

  const logout = (redirect = true) => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    delete API.defaults.headers.common.Authorization;
    setUser(null);

    if (redirect) {
      toast.info("Logged out.");
      navigate("/login");
    }
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isAdmin = () => user?.role === "ADMIN";
  const isITSM = () => user?.role === "ITSM";
  const isUser = () => user?.role === "USER";

  const canManageUsers = () => hasRole("ADMIN");
  const canEditAssets = () => hasRole("ADMIN", "ITSM");
  const canDeleteAssets = () => hasRole("ADMIN");
  const canManageIncidents = () => hasRole("ADMIN", "ITSM");
  const canManageVulnerabilities = () => hasRole("ADMIN", "ITSM");

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    loadProfile,
    hasRole,
    isAdmin,
    isITSM,
    isUser,
    canManageUsers,
    canEditAssets,
    canDeleteAssets,
    canManageIncidents,
    canManageVulnerabilities,
  };

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
          <div className="loader" />
          <h2 style={{ fontSize: "14px", fontWeight: 500, margin: 0 }}>Loading SentinelCore SecureOps...</h2>
        </div>
      </div>,
      document.body
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;