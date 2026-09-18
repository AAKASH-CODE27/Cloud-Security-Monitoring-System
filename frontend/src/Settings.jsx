// src/Settings.jsx

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

import {
  FaSave,
  FaBell,
  FaMoon,
  FaShieldAlt,
  FaLock,
  FaUserCog,
  FaTools,
  FaGlobe,
} from "react-icons/fa";

import { toast } from "react-toastify";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import API from "./api/axios";

import "./Settings.css";

const defaultSettings = {
  theme: "dark",

  notifications: true,

  emailNotifications: true,

  smsNotifications: false,

  twoFactor: false,

  autoLogout: 30,

  language: "English",

  timezone: "Asia/Kolkata",

  maintenanceMode: false,

  allowUserRegistration: true,

  itsmIntegration: true,
};

function Settings() {
  const [settings, setSettings] =
    useState(defaultSettings);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* =====================================================
      LOAD SETTINGS
  ===================================================== */

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await API.get("/settings");

      if (response?.data) {
        setSettings({
          ...defaultSettings,
          ...response.data,
        });
      }
    } catch (err) {
      console.error(
        "Settings load error:",
        err.response?.data ||
          err.message
      );

      setError(
        err.response?.data?.message ||
          "Unable to load settings."
      );

      toast.error(
        "Unable to load settings."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
      INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadSettings();
  }, []);

  /* =====================================================
      HANDLE CHANGE
  ===================================================== */

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setSettings((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? Number(value)
          : value,
    }));

    setError("");
    setSuccess("");
  };

  /* =====================================================
      VALIDATE
  ===================================================== */

  const validateSettings = () => {
    if (
      !Number.isFinite(
        Number(settings.autoLogout)
      )
    ) {
      toast.error(
        "Auto logout must be a valid number."
      );

      return false;
    }

    if (
      Number(settings.autoLogout) < 1
    ) {
      toast.error(
        "Auto logout must be at least 1 minute."
      );

      return false;
    }

    if (
      Number(settings.autoLogout) > 1440
    ) {
      toast.error(
        "Auto logout cannot exceed 1440 minutes."
      );

      return false;
    }

    if (!settings.language) {
      toast.error(
        "Please select a language."
      );

      return false;
    }

    if (!settings.timezone) {
      toast.error(
        "Please select a timezone."
      );

      return false;
    }

    return true;
  };

  /* =====================================================
      SAVE SETTINGS
  ===================================================== */

  const saveSettings = async () => {
    if (!validateSettings()) {
      return;
    }

    try {
      setSaving(true);

      setSuccess("");
      setError("");

      const payload = {
        theme: settings.theme,

        notifications:
          settings.notifications,

        emailNotifications:
          settings.emailNotifications,

        smsNotifications:
          settings.smsNotifications,

        twoFactor:
          settings.twoFactor,

        autoLogout:
          Number(settings.autoLogout),

        language:
          settings.language,

        timezone:
          settings.timezone,

        maintenanceMode:
          settings.maintenanceMode,

        allowUserRegistration:
          settings.allowUserRegistration,

        itsmIntegration:
          settings.itsmIntegration,
      };

      const response =
        await API.put(
          "/settings",
          payload
        );

      const savedSettings =
        response?.data || payload;

      setSettings({
        ...defaultSettings,
        ...savedSettings,
      });

      setSuccess(
        "Settings saved successfully."
      );

      toast.success(
        "Settings saved successfully."
      );

    } catch (err) {
      console.error(
        "Settings save error:",
        err.response?.data ||
          err.message
      );

      const message =
        err.response?.data?.message ||
        "Unable to save settings.";

      setError(message);

      toast.error(message);

    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
      RESET SETTINGS
  ===================================================== */

  const resetSettings = () => {
    if (
      !window.confirm(
        "Reset settings to default values?"
      )
    ) {
      return;
    }

    setSettings(defaultSettings);

    setSuccess("");

    setError("");

    toast.info(
      "Settings reset locally. Click Save Settings to store them."
    );
  };

  /* =====================================================
      APPLY THEME
  ===================================================== */

  useEffect(() => {
    if (settings.theme === "light") {
      document.body.classList.add(
        "light-theme"
      );
    } else {
      document.body.classList.remove(
        "light-theme"
      );
    }

    localStorage.setItem(
      "theme",
      settings.theme
    );
  }, [settings.theme]);

  /* =====================================================
      RENDER
  ===================================================== */

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="content">
        <Navbar />

        <motion.div
          className="settings-page"
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
          }}
        >
          {/* =================================================
              HEADER
          ================================================= */}

          <div className="settings-header">
            <div>
              <h1>
                Application Settings
              </h1>

              <p>
                Configure SecureOps
                preferences, security
                and administration.
              </p>
            </div>
          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (
            <div className="loading">
              <div className="loader"></div>

              <h3>
                Loading Settings...
              </h3>
            </div>
          ) : (
            <>
              <div className="settings-grid">

                {/* =================================================
                    APPEARANCE
                ================================================= */}

                <motion.div
                  className="settings-card"
                  whileHover={{
                    y: -4,
                  }}
                >
                  <h2>
                    <FaMoon />
                    Appearance
                  </h2>

                  <div className="setting-item">
                    <label>
                      Theme
                    </label>

                    <select
                      name="theme"
                      value={
                        settings.theme
                      }
                      onChange={
                        handleChange
                      }
                    >
                      <option value="dark">
                        🌙 Dark
                      </option>

                      <option value="light">
                        ☀ Light
                      </option>
                    </select>
                  </div>
                </motion.div>

                {/* =================================================
                    NOTIFICATIONS
                ================================================= */}

                <motion.div
                  className="settings-card"
                  whileHover={{
                    y: -4,
                  }}
                >
                  <h2>
                    <FaBell />
                    Notifications
                  </h2>

                  <div className="toggle">
                    <label>
                      Enable Notifications
                    </label>

                    <input
                      type="checkbox"
                      name="notifications"
                      checked={
                        settings.notifications
                      }
                      onChange={
                        handleChange
                      }
                    />
                  </div>

                  <div className="toggle">
                    <label>
                      Email Notifications
                    </label>

                    <input
                      type="checkbox"
                      name="emailNotifications"
                      checked={
                        settings.emailNotifications
                      }
                      onChange={
                        handleChange
                      }
                    />
                  </div>

                  <div className="toggle">
                    <label>
                      SMS Notifications
                    </label>

                    <input
                      type="checkbox"
                      name="smsNotifications"
                      checked={
                        settings.smsNotifications
                      }
                      onChange={
                        handleChange
                      }
                    />
                  </div>
                </motion.div>

                {/* =================================================
                    SECURITY
                ================================================= */}

                <motion.div
                  className="settings-card"
                  whileHover={{
                    y: -4,
                  }}
                >
                  <h2>
                    <FaShieldAlt />
                    Security
                  </h2>

                  <div className="toggle">
                    <label>
                      Enable Two-Factor Authentication
                    </label>

                    <input
                      type="checkbox"
                      name="twoFactor"
                      checked={
                        settings.twoFactor
                      }
                      onChange={
                        handleChange
                      }
                    />
                  </div>

                  <div className="setting-item">
                    <label>
                      Auto Logout
                      (Minutes)
                    </label>

                    <input
                      type="number"
                      name="autoLogout"
                      min="1"
                      max="1440"
                      value={
                        settings.autoLogout
                      }
                      onChange={
                        handleChange
                      }
                    />
                  </div>

                  <button
                    type="button"
                    className="password-btn"
                    onClick={() => {
                      window.location.href =
                        "/profile";
                    }}
                  >
                    <FaLock />
                    Change Password
                  </button>
                </motion.div>

                {/* =================================================
                    LOCALIZATION
                ================================================= */}

                <motion.div
                  className="settings-card"
                  whileHover={{
                    y: -4,
                  }}
                >
                  <h2>
                    <FaGlobe />
                    Localization
                  </h2>

                  <div className="setting-item">
                    <label>
                      Language
                    </label>

                    <select
                      name="language"
                      value={
                        settings.language
                      }
                      onChange={
                        handleChange
                      }
                    >
                      <option value="English">
                        English
                      </option>

                      <option value="Hindi">
                        Hindi
                      </option>

                      <option value="Telugu">
                        Telugu
                      </option>
                    </select>
                  </div>

                  <div className="setting-item">
                    <label>
                      Timezone
                    </label>

                    <select
                      name="timezone"
                      value={
                        settings.timezone
                      }
                      onChange={
                        handleChange
                      }
                    >
                      <option value="Asia/Kolkata">
                        Asia/Kolkata
                      </option>

                      <option value="UTC">
                        UTC
                      </option>

                      <option value="America/New_York">
                        America/New_York
                      </option>

                      <option value="Europe/London">
                        Europe/London
                      </option>

                      <option value="Asia/Dubai">
                        Asia/Dubai
                      </option>
                    </select>
                  </div>
                </motion.div>

                {/* =================================================
                    ADMIN CONTROLS
                ================================================= */}

                <motion.div
                  className="settings-card"
                  whileHover={{
                    y: -4,
                  }}
                >
                  <h2>
                    <FaUserCog />
                    Admin Controls
                  </h2>

                  <div className="toggle">
                    <label>
                      Maintenance Mode
                    </label>

                    <input
                      type="checkbox"
                      name="maintenanceMode"
                      checked={
                        settings.maintenanceMode
                      }
                      onChange={
                        handleChange
                      }
                    />
                  </div>

                  <div className="toggle">
                    <label>
                      Allow User Registration
                    </label>

                    <input
                      type="checkbox"
                      name="allowUserRegistration"
                      checked={
                        settings.allowUserRegistration
                      }
                      onChange={
                        handleChange
                      }
                    />
                  </div>
                </motion.div>

                {/* =================================================
                    ITSM
                ================================================= */}

                <motion.div
                  className="settings-card"
                  whileHover={{
                    y: -4,
                  }}
                >
                  <h2>
                    <FaTools />
                    ITSM Integration
                  </h2>

                  <div className="toggle">
                    <label>
                      Enable ITSM Integration
                    </label>

                    <input
                      type="checkbox"
                      name="itsmIntegration"
                      checked={
                        settings.itsmIntegration
                      }
                      onChange={
                        handleChange
                      }
                    />
                  </div>
                </motion.div>

              </div>

              {/* =================================================
                  ERROR
              ================================================= */}

              {error && (
                <motion.div
                  className="error-box"
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                >
                  {error}
                </motion.div>
              )}

              {/* =================================================
                  SUCCESS
              ================================================= */}

              {success && (
                <motion.div
                  className="success-box"
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                >
                  {success}
                </motion.div>
              )}

              {/* =================================================
                  ACTIONS
              ================================================= */}

              <div className="settings-actions">

                <button
                  type="button"
                  className="reset-btn"
                  onClick={
                    resetSettings
                  }
                  disabled={saving}
                >
                  Reset
                </button>

                <button
                  type="button"
                  className="save-btn"
                  onClick={
                    saveSettings
                  }
                  disabled={saving}
                >
                  <FaSave />

                  {saving
                    ? "Saving..."
                    : "Save Settings"}
                </button>

              </div>
            </>
          )}
        </motion.div>

        <Footer />
      </div>
    </div>
  );
}

export default Settings;