import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
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
    return (
      <div className="auth-loading" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#0b0f19", color: "#38bdf8" }}>
        <h2>Loading SentinelCore SecureOps...</h2>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;