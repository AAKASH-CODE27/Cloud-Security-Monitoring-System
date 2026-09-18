import { useEffect, useState } from "react";
import {
  FaBell,
  FaMoon,
  FaSun,
  FaUserCircle,
  FaSignOutAlt,
  FaCog,
} from "react-icons/fa";

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { useAuth } from "./AuthContext";
import API from "./api/axios";

import SearchBar from "./SearchBar";
import "./Alerts";

import "./Dashboard.css";

function Navbar() {

  const navigate = useNavigate();

  const { user, logout } = useAuth();

  /* =====================================================
     STATES
  ====================================================== */

  const [time, setTime] = useState(new Date());

  const [showProfile, setShowProfile] = useState(false);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [notifications, setNotifications] = useState([]);

  const [loadingNotifications, setLoadingNotifications] =
    useState(false);

  const [darkMode, setDarkMode] = useState(() => {

    return localStorage.getItem("theme") !== "light";

  });

  /* =====================================================
     LIVE CLOCK
  ====================================================== */

  useEffect(() => {

    const timer = setInterval(() => {

      setTime(new Date());

    }, 1000);

    return () => clearInterval(timer);

  }, []);

  /* =====================================================
     DARK / LIGHT MODE
  ====================================================== */

  useEffect(() => {

    if (darkMode) {

      document.body.classList.remove("light-theme");

      localStorage.setItem("theme", "dark");

    } else {

      document.body.classList.add("light-theme");

      localStorage.setItem("theme", "light");

    }

  }, [darkMode]);

  /* =====================================================
     LOAD RECENT NOTIFICATIONS
  ====================================================== */

  const loadNotifications = async () => {

    try {

      setLoadingNotifications(true);

      const response = await API.get("/alerts/recent");

      setNotifications(response.data || []);

    } catch (error) {

      console.error(
        "Unable to load notifications",
        error
      );

      setNotifications([]);

    } finally {

      setLoadingNotifications(false);

    }

  };

  /* =====================================================
     AUTO REFRESH EVERY 15 SECONDS
  ====================================================== */

  useEffect(() => {

    loadNotifications();

    const interval = setInterval(() => {

      loadNotifications();

    }, 15000);

    return () => clearInterval(interval);

  }, []);

  /* =====================================================
     ACTIVE NOTIFICATION COUNT
  ====================================================== */

  const notificationCount = notifications.filter(

    (notification) =>

      notification.status !== "RESOLVED"

  ).length;

  /* =====================================================
     LOGOUT
  ====================================================== */

  const handleLogout = () => {

    logout();

    navigate("/login");

  };

  /* =====================================================
     TOGGLE NOTIFICATION
  ====================================================== */

  const toggleNotifications = () => {

    setShowNotifications(!showNotifications);

    setShowProfile(false);

  };

  /* =====================================================
     TOGGLE PROFILE
  ====================================================== */

  const toggleProfile = () => {

    setShowProfile(!showProfile);

    setShowNotifications(false);

  };
  return (
  <>
    {/* =====================================================
        NAVBAR
    ====================================================== */}

    <header className="navbar">

      {/* ==============================================
          LEFT SECTION
      =============================================== */}

      <div className="navbar-left">

        <h2>
          🛡 SentinelCore SecureOps
        </h2>

        <p>
          Enterprise Security Operations Center
        </p>

      </div>

      {/* ==============================================
          CENTER SECTION
      =============================================== */}

      <div className="navbar-center">

        <div className="search-box">

          <SearchBar />

        </div>

      </div>

      {/* ==============================================
          RIGHT SECTION
      =============================================== */}

      <div className="navbar-right">

        {/* ==========================
            LIVE CLOCK
        =========================== */}

        <motion.div

          className="clock"

          whileHover={{
            scale: 1.05,
          }}

        >

          <div className="clock-time">

            {time.toLocaleTimeString()}

          </div>

          <div className="clock-date">

            {time.toLocaleDateString()}

          </div>

        </motion.div>

        {/* ==========================
            DARK MODE
        =========================== */}

        <motion.div

          className="theme-toggle"

          whileHover={{
            scale: 1.15,
          }}

          whileTap={{
            scale: 0.9,
          }}

          onClick={() =>
            setDarkMode(!darkMode)
          }

        >

          {darkMode ? (

            <FaMoon />

          ) : (

            <FaSun />

          )}

        </motion.div>

       {/* ==============================
    Notifications
================================= */}
<div
  className="notification"
  onClick={() => navigate("/alerts")}
>
  <FaBell className="bell-icon" />

  {notificationCount > 0 && (
    <span className="notification-badge">
      {notificationCount > 99 ? "99+" : notificationCount}
    </span>
  )}
</div>

        {/* ==========================
            USER PROFILE
        =========================== */}

        <motion.div

          className="profile"

          whileHover={{
            scale: 1.03,
          }}

          onClick={toggleProfile}

        >

          <img

            src={`https://ui-avatars.com/api/?name=${
              user?.username || "Admin"
            }&background=2563eb&color=ffffff&bold=true&size=128`}

            alt="Profile"

          />

          <div className="profile-info">

            <h4>

              {user?.username ||

                "Administrator"}

            </h4>

            <p>

              {user?.role ||

                "ADMIN"}

            </p>

          </div>

        </motion.div>

      </div>

    </header>
          {/* =====================================================
          NOTIFICATION DROPDOWN
      ====================================================== */}

      {showNotifications && (

        <motion.div

          className="notification-menu"

          initial={{
            opacity: 0,
            y: -15,
            scale: 0.98,
          }}

          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}

          exit={{
            opacity: 0,
            y: -15,
          }}

          transition={{
            duration: 0.25,
          }}

        >

          <div className="notification-header">

            <h3>

              Recent Alerts

            </h3>

            <span className="notification-count">

              {notificationCount}

            </span>

          </div>

          {loadingNotifications ? (

            <div className="empty-notification">

              Loading notifications...

            </div>

          ) : notifications.length === 0 ? (

            <div className="empty-notification">

              No Alerts Available

            </div>

          ) : (

            notifications

              .slice(0, 5)

              .map((alert) => (

                <motion.div

                  key={alert.id}

                  whileHover={{
                    x: 5,
                  }}

                  className={`notification-item ${alert.severity?.toLowerCase()}`}

                  onClick={() => {

                    navigate("/alerts");

                    setShowNotifications(false);

                  }}

                >

                  <div className="notification-top">

                    <h4>

                      {alert.assetName ||

                        alert.asset ||

                        "Unknown Asset"}

                    </h4>

                    <span

                      className={`severity-badge ${alert.severity?.toLowerCase()}`}

                    >

                      {alert.severity}

                    </span>

                  </div>

                  <p>

                    {alert.description}

                  </p>

                  <div className="notification-bottom">

                    <span className="status">

                      {alert.status}

                    </span>

                    <small>

                      {alert.createdAt

                        ? new Date(

                            alert.createdAt

                          ).toLocaleString()

                        : "Just now"}

                    </small>

                  </div>

                </motion.div>

              ))

          )}

          <button

            className="view-all-btn"

            onClick={() => {

              navigate("/alerts");

              setShowNotifications(false);

            }}

          >

            View All Alerts

          </button>

        </motion.div>

      )}

      {/* =====================================================
          PROFILE DROPDOWN
      ====================================================== */}

      {showProfile && (

        <motion.div

          className="profile-menu"

          initial={{
            opacity: 0,
            y: -15,
            scale: 0.98,
          }}

          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}

          exit={{
            opacity: 0,
            y: -15,
          }}

          transition={{
            duration: 0.25,
          }}

        >

          <div className="profile-header">

            <FaUserCircle size={50} />

            <div>

              <h3>

                {user?.username ||

                  "Administrator"}

              </h3>

              <p>

                {user?.email ||

                  "admin@sentinelcore.com"}

              </p>

              <span className="profile-role">

                {user?.role ||

                  "ADMIN"}

              </span>

            </div>

          </div>

          <hr />

          {/* <button

            onClick={() => {

              navigate("/profile");

              setShowProfile(false);

            }}

          >

            <FaUserCircle />

            My Profile */}
{/* 
          </button>

          <button

            onClick={() => {

              navigate("/settings");

              setShowProfile(false);

            }}

          >

            <FaCog />

            Settings

          </button> */}

          <button

            className="logout"

            onClick={handleLogout}

          >

            <FaSignOutAlt />

            Logout

          </button>

        </motion.div>

      )}

    </>

  );

}

export default Navbar;