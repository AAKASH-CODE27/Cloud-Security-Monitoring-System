import {
  FaTachometerAlt,
  FaServer,
  FaUsers,
  FaShieldAlt,
  FaBug,
  FaCloud,
  FaChartBar,
  FaBell,
  FaUserCircle,
  FaCog,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "./AuthContext";
import "./Dashboard.css";

function Sidebar() {
  const { user, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(false);

  const menu = [
    {
      title: "Dashboard",
      icon: <FaTachometerAlt />,
      path: "/dashboard",
      roles: ["ADMIN", "ITSM", "USER"],
    },
    {
      title: "Assets",
      icon: <FaServer />,
      path: "/assets",
      roles: ["ADMIN", "ITSM"],
    },
    {
      title: "Alerts",
      icon: <FaBell />,
      path: "/alerts",
      roles: ["ADMIN", "ITSM", "USER"],
    },
    {
      title: "Incidents",
      icon: <FaShieldAlt />,
      path: "/incidents",
      roles: ["ADMIN", "ITSM"],
    },
    {
      title: "Vulnerabilities",
      icon: <FaBug />,
      path: "/vulnerabilities",
      roles: ["ADMIN", "ITSM"],
    },
    {
      title: "Cloud",
      icon: <FaCloud />,
      path: "/cloud",
      roles: ["ADMIN", "ITSM"],
    },
    {
      title: "Reports",
      icon: <FaChartBar />,
      path: "/reports",
      roles: ["ADMIN", "ITSM", "USER"],
    },
    {
      title: "Users",
      icon: <FaUsers />,
      path: "/users",
      roles: ["ADMIN"],
    },
    // {
    //   title: "Profile",
    //   icon: <FaUserCircle />,
    //   path: "/profile",
    //   roles: ["ADMIN", "ITSM", "USER"],
    // },
    // {
    //   title: "Settings",
    //   icon: <FaCog />,
    //   path: "/settings",
    //   roles: ["ADMIN"],
    // },
  ];

  return (
    <motion.div
      animate={{
        width: collapsed ? 90 : 270,
      }}
      transition={{
        duration: 0.3,
      }}
      className="sidebar"
    >
      {/* Logo */}

      <div className="sidebar-logo">

        <div className="logo-circle">
          🛡
        </div>

        {!collapsed && (
          <div>

            <h2>SentinelCore</h2>

            <span>SecureOps</span>

          </div>
        )}

      </div>

      {/* Collapse */}

      <button
        className="collapse-btn"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <FaChevronRight />
        ) : (
          <FaChevronLeft />
        )}
      </button>

      {/* User */}

      <div className="sidebar-user">

        <img
          src={`https://ui-avatars.com/api/?name=${
            user?.username || "Admin"
          }&background=2563eb&color=fff`}
          alt="profile"
        />

        {!collapsed && (
          <>

            <h4>{user?.username}</h4>

            <p>{user?.role}</p>

          </>
        )}

      </div>

      {/* Navigation */}

      <ul className="sidebar-menu">

        {menu
          .filter((m) =>
            m.roles.includes(user?.role)
          )
          .map((item) => (
            <li key={item.title}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  isActive
                    ? "active-link"
                    : ""
                }
              >
                <span>{item.icon}</span>

                {!collapsed && (
                  <p>{item.title}</p>
                )}
              </NavLink>
            </li>
          ))}

      </ul>

      {/* Bottom */}

      <div className="sidebar-footer">

        <button
          className="logout-btn"
          onClick={logout}
        >
          <FaSignOutAlt />

          {!collapsed && (
            <span>Logout</span>
          )}

        </button>

      </div>
    </motion.div>
  );
}

export default Sidebar;