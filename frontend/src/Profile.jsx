// src/Profile.jsx

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import {
  FaUserCircle,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaUserShield,
  FaCalendarAlt,
  FaSave,
  FaKey,
  FaCamera,
  FaTrash,
  FaShieldAlt,
  FaCheckCircle,
  FaClock,
  FaIdBadge,
  FaUserTie,
  FaMapMarkerAlt,
} from "react-icons/fa";

import { toast } from "react-toastify";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";

import API from "./api/axios";

import "./Profile.css";

/* =====================================================
   INITIAL PROFILE
===================================================== */

const initialProfile = {
  id: "",
  userId: "",
  employeeId: "",
  name: "",
  username: "",
  email: "",
  phone: "",
  department: "",
  designation: "",
  role: "",
  joinedDate: "",
  lastLogin: "",
  address: "",
  bio: "",
  avatar: "",
  status: "Active",
};

/* =====================================================
   PROFILE COMPONENT
===================================================== */

function Profile() {
  /* ===================================================
      PROFILE STATE
  =================================================== */

  const [profile, setProfile] =
    useState(initialProfile);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* ===================================================
      PASSWORD STATE
  =================================================== */

  const [showPasswordModal, setShowPasswordModal] =
    useState(false);

  const [passwordLoading, setPasswordLoading] =
    useState(false);

  const [passwords, setPasswords] =
    useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

  /* ===================================================
      PROFILE VALIDATION
  =================================================== */

  const [profileErrors, setProfileErrors] =
    useState({
      name: "",
      email: "",
      phone: "",
      department: "",
      designation: "",
      address: "",
      bio: "",
    });

  /* ===================================================
      PASSWORD VALIDATION
  =================================================== */

  const [passwordErrors, setPasswordErrors] =
    useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

  /* ===================================================
      FILE INPUT
  =================================================== */

  const fileInputRef =
    useRef(null);

  /* ===================================================
      LOAD PROFILE
      GET /api/profile-data
  =================================================== */

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      console.log(
        "Loading profile from /api/profile-data..."
      );

      const response =
        await API.get(
          "/profile-data"
        );

      const data =
        response?.data || {};

      console.log(
        "PROFILE DATA:",
        data
      );

      setProfile((previous) => ({
        ...previous,
        ...data,

        id:
          data.id ||
          "",

        userId:
          data.userId ||
          "",

        employeeId:
          data.employeeId ||
          "",

        name:
          data.name ||
          data.username ||
          "",

        username:
          data.username ||
          "",

        email:
          data.email ||
          "",

        phone:
          data.phone ||
          "",

        department:
          data.department ||
          "",

        designation:
          data.designation ||
          "",

        role:
          data.role ||
          "",

        joinedDate:
          data.joinedDate ||
          "",

        lastLogin:
          data.lastLogin ||
          "",

        address:
          data.address ||
          "",

        bio:
          data.bio ||
          "",

        avatar:
          data.avatar ||
          "",

        status:
          data.status ||
          "Active",
      }));

      /*
       * Cache profile locally so it can still be displayed
       * temporarily if the backend is unavailable later.
       */

      localStorage.setItem(
        "currentUser",
        JSON.stringify(data)
      );

    } catch (err) {

      console.error(
        "Profile load error:",
        err.response?.data ||
          err.message
      );

      /*
       * Try cached profile
       */

      try {

        const cached =
          JSON.parse(
            localStorage.getItem(
              "currentUser"
            ) || "null"
          );

        if (cached) {

          setProfile(
            (previous) => ({
              ...previous,
              ...cached,

              name:
                cached.name ||
                cached.username ||
                "",

              username:
                cached.username ||
                "",

              email:
                cached.email ||
                "",

              phone:
                cached.phone ||
                "",

              department:
                cached.department ||
                "",

              designation:
                cached.designation ||
                "",

              status:
                cached.status ||
                "Active",
            })
          );

        } else {

          setError(
            err.response?.data?.message ||
              "Unable to load profile."
          );

          toast.error(
            "Unable to load profile."
          );
        }

      } catch (storageError) {

        console.error(
          "Storage error:",
          storageError
        );

        setError(
          "Unable to load profile."
        );

        toast.error(
          "Unable to load profile."
        );
      }

    } finally {

      setLoading(false);

    }
  };

  /* ===================================================
      INITIAL LOAD
  =================================================== */

  useEffect(() => {

    loadProfile();

  }, []);

  /* ===================================================
      HANDLE PROFILE INPUT
  =================================================== */

  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;

    setProfile(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

    setProfileErrors(
      (previous) => ({
        ...previous,
        [name]: "",
      })
    );

    setError("");
    setSuccess("");

  };

  /* ===================================================
      HANDLE PASSWORD INPUT
  =================================================== */

  const handlePasswordChange =
    (event) => {

      const {
        name,
        value,
      } = event.target;

      setPasswords(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );

      setPasswordErrors(
        (previous) => ({
          ...previous,
          [name]: "",
        })
      );

    };

  /* ===================================================
      VALIDATE PROFILE
  =================================================== */

  const validateProfile = () => {

    const nextErrors = {

      name: "",
      email: "",
      phone: "",
      department: "",
      designation: "",
      address: "",
      bio: "",

    };

    /* =========================
       NAME
    ========================= */

    if (
      !profile.name.trim()
    ) {

      nextErrors.name =
        "Full name is required.";

    } else if (
      profile.name.trim().length < 2
    ) {

      nextErrors.name =
        "Name must contain at least 2 characters.";

    } else if (
      profile.name.trim().length > 100
    ) {

      nextErrors.name =
        "Name cannot exceed 100 characters.";

    }

    /* =========================
       EMAIL
    ========================= */

    if (
      !profile.email.trim()
    ) {

      nextErrors.email =
        "Email address is required.";

    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        profile.email.trim()
      )
    ) {

      nextErrors.email =
        "Enter a valid email address.";

    }

    /* =========================
       PHONE
    ========================= */

    if (
      profile.phone.trim() &&
      !/^[0-9+\-\s()]{7,20}$/.test(
        profile.phone.trim()
      )
    ) {

      nextErrors.phone =
        "Enter a valid phone number.";

    }

    /* =========================
       DEPARTMENT
    ========================= */

    if (
      profile.department.length > 100
    ) {

      nextErrors.department =
        "Department cannot exceed 100 characters.";

    }

    /* =========================
       DESIGNATION
    ========================= */

    if (
      profile.designation.length > 100
    ) {

      nextErrors.designation =
        "Designation cannot exceed 100 characters.";

    }

    /* =========================
       ADDRESS
    ========================= */

    if (
      profile.address.length > 500
    ) {

      nextErrors.address =
        "Address cannot exceed 500 characters.";

    }

    /* =========================
       BIO
    ========================= */

    if (
      profile.bio.length > 2000
    ) {

      nextErrors.bio =
        "Biography cannot exceed 2000 characters.";

    }

    setProfileErrors(
      nextErrors
    );

    return !Object.values(
      nextErrors
    ).some(Boolean);

  };

  /* ===================================================
      IMAGE UPLOAD
  =================================================== */

  const handleImageUpload =
    (event) => {

      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      /* =========================
         FILE TYPE
      ========================= */

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        toast.error(
          "Please select an image file."
        );

        return;
      }

      /* =========================
         FILE SIZE
      ========================= */

      if (
        file.size >
        5 * 1024 * 1024
      ) {

        toast.error(
          "Image size must be less than 5 MB."
        );

        return;
      }

      const reader =
        new FileReader();

      reader.onload = () => {

        setProfile(
          (previous) => ({
            ...previous,
            avatar:
              reader.result,
          })
        );

        toast.success(
          "Profile image selected."
        );

      };

      reader.onerror = () => {

        toast.error(
          "Unable to read the image."
        );

      };

      reader.readAsDataURL(
        file
      );

    };

  /* ===================================================
      REMOVE AVATAR
  =================================================== */

  const removeAvatar = () => {

    setProfile(
      (previous) => ({
        ...previous,
        avatar: "",
      })
    );

    if (
      fileInputRef.current
    ) {

      fileInputRef.current.value =
        "";

    }

  };

  /* ===================================================
      SAVE PROFILE
      PUT /api/profile-data
  =================================================== */

  const saveProfile =
    async () => {

      if (
        !validateProfile()
      ) {

        toast.error(
          "Please correct the highlighted fields."
        );

        return;
      }

      try {

        setSaving(true);

        setError("");
        setSuccess("");

        /* =========================
           REQUEST PAYLOAD
        ========================= */

        const payload = {

          name:
            profile.name.trim(),

          email:
            profile.email
              .trim()
              .toLowerCase(),

          phone:
            profile.phone.trim(),

          department:
            profile.department.trim(),

          designation:
            profile.designation.trim(),

          address:
            profile.address.trim(),

          bio:
            profile.bio.trim(),

          avatar:
            profile.avatar || "",

        };

        console.log(
          "PROFILE SAVE PAYLOAD:",
          payload
        );

        /* =========================
           API REQUEST
        ========================= */

        const response =
          await API.put(
            "/profile-data",
            payload
          );

        console.log(
          "PROFILE SAVE RESPONSE:",
          response?.data
        );

        const updatedProfile =
          response?.data || {
            ...profile,
            ...payload,
          };

        /* =========================
           UPDATE STATE
        ========================= */

        setProfile(
          (previous) => ({
            ...previous,
            ...updatedProfile,

            name:
              updatedProfile.name ||
              payload.name,

            email:
              updatedProfile.email ||
              payload.email,

            phone:
              updatedProfile.phone ||
              payload.phone,

            department:
              updatedProfile.department ||
              payload.department,

            designation:
              updatedProfile.designation ||
              payload.designation,

            address:
              updatedProfile.address ||
              payload.address,

            bio:
              updatedProfile.bio ||
              payload.bio,

            avatar:
              updatedProfile.avatar ??
              payload.avatar,

          })
        );

        /* =========================
           CACHE
        ========================= */

        localStorage.setItem(
          "currentUser",
          JSON.stringify(
            updatedProfile
          )
        );

        setSuccess(
          "Profile updated successfully."
        );

        toast.success(
          "Profile updated successfully."
        );

      } catch (err) {

        console.error(
          "Profile update error:",
          err.response?.data ||
            err.message
        );

        const message =
          err.response?.data?.message ||
          "Unable to update profile.";

        setError(message);

        toast.error(
          message
        );

      } finally {

        setSaving(false);

      }

    };

  /* ===================================================
      PASSWORD VALIDATION
  =================================================== */

  const validatePassword = () => {

    const nextErrors = {

      currentPassword: "",
      newPassword: "",
      confirmPassword: "",

    };

    /* =========================
       CURRENT
    ========================= */

    if (
      !passwords.currentPassword
    ) {

      nextErrors.currentPassword =
        "Current password is required.";

    }

    /* =========================
       NEW
    ========================= */

    if (
      !passwords.newPassword
    ) {

      nextErrors.newPassword =
        "New password is required.";

    } else if (
      passwords.newPassword.length < 6
    ) {

      nextErrors.newPassword =
        "Password must contain at least 6 characters.";

    }

    /* =========================
       CONFIRM
    ========================= */

    if (
      !passwords.confirmPassword
    ) {

      nextErrors.confirmPassword =
        "Please confirm your password.";

    } else if (
      passwords.newPassword !==
      passwords.confirmPassword
    ) {

      nextErrors.confirmPassword =
        "Passwords do not match.";

    }

    setPasswordErrors(
      nextErrors
    );

    return !Object.values(
      nextErrors
    ).some(Boolean);

  };

  /* ===================================================
      CHANGE PASSWORD
      PUT /api/profile-data/password
  =================================================== */

  const changePassword =
    async () => {

      if (
        !validatePassword()
      ) {

        toast.error(
          "Please correct the password fields."
        );

        return;
      }

      try {

        setPasswordLoading(
          true
        );

        console.log(
          "Changing password..."
        );

        const payload = {

          currentPassword:
            passwords.currentPassword,

          newPassword:
            passwords.newPassword,

          confirmPassword:
            passwords.confirmPassword,

        };

        await API.put(
          "/profile-data/password",
          payload
        );

        toast.success(
          "Password changed successfully."
        );

        setPasswords({

          currentPassword:
            "",

          newPassword:
            "",

          confirmPassword:
            "",

        });

        setPasswordErrors({

          currentPassword:
            "",

          newPassword:
            "",

          confirmPassword:
            "",

        });

        setShowPasswordModal(
          false
        );

      } catch (err) {

        console.error(
          "Password change error:",
          err.response?.data ||
            err.message
        );

        toast.error(
          err.response?.data?.message ||
            "Unable to change password."
        );

      } finally {

        setPasswordLoading(
          false
        );

      }

    };

  /* ===================================================
      CLOSE PASSWORD MODAL
  =================================================== */

  const closePasswordModal =
    () => {

      if (
        passwordLoading
      ) {

        return;

      }

      setShowPasswordModal(
        false
      );

      setPasswords({

        currentPassword: "",
        newPassword: "",
        confirmPassword: "",

      });

      setPasswordErrors({

        currentPassword: "",
        newPassword: "",
        confirmPassword: "",

      });

    };

  /* ===================================================
      PROFILE STATS
  =================================================== */

  const stats = [

    {

      title:
        "Role",

      value:
        profile.role ||
        "USER",

      icon:
        <FaUserShield />,

      color:
        "#3b82f6",

    },

    {

      title:
        "Department",

      value:
        profile.department ||
        "-",

      icon:
        <FaBuilding />,

      color:
        "#22c55e",

    },

    {

      title:
        "Status",

      value:
        profile.status ||
        "Active",

      icon:
        <FaCheckCircle />,

      color:
        "#f59e0b",

    },

    {

      title:
        "Last Login",

      value:
        profile.lastLogin ||
        "-",

      icon:
        <FaClock />,

      color:
        "#8b5cf6",

    },

  ];

  /* ===================================================
      RENDER
  =================================================== */

  return (

    <div className="dashboard">

      <Sidebar />

      <div className="content">

        <Navbar />

        <motion.div

          className="profile-page"

          initial={{
            opacity: 0,
          }}

          animate={{
            opacity: 1,
          }}

          transition={{
            duration: 0.5,
          }}

        >

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="profile-header">

            <div>

              <h1>
                My Profile
              </h1>

              <p>
                Manage your account
                information, security
                settings, and personal
                details.
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
                Loading Profile...
              </h3>

            </div>

          ) : (

            <>

              {/* =================================================
                  PROFILE STATS
              ================================================= */}

              <div className="profile-stats">

                {stats.map(
                  (item) => (

                    <motion.div

                      key={
                        item.title
                      }

                      className="stat-card"

                      whileHover={{
                        scale: 1.04,
                        y: -5,
                      }}

                    >

                      <div

                        className="stat-icon"

                        style={{
                          background:
                            item.color,
                        }}

                      >

                        {item.icon}

                      </div>

                      <div>

                        <h4>
                          {item.title}
                        </h4>

                        <h2>
                          {item.value}
                        </h2>

                      </div>

                    </motion.div>

                  )
                )}

              </div>

              {/* =================================================
                  PROFILE CONTAINER
              ================================================= */}

              <div className="profile-container">

                {/* =================================================
                    LEFT PROFILE CARD
                ================================================= */}

                <motion.div

                  className="profile-card"

                  initial={{
                    x: -30,
                    opacity: 0,
                  }}

                  animate={{
                    x: 0,
                    opacity: 1,
                  }}

                >

                  {/* =========================
                      AVATAR
                  ========================= */}

                  <div className="avatar-section">

                    {profile.avatar ? (

                      <img

                        src={
                          profile.avatar
                        }

                        alt="Profile"

                        className="avatar"

                      />

                    ) : (

                      <FaUserCircle

                        className=
                          "avatar-icon"

                      />

                    )}

                    <input

                      ref={
                        fileInputRef
                      }

                      type="file"

                      accept="
                        image/png,
                        image/jpeg,
                        image/jpg,
                        image/webp
                      "

                      hidden

                      onChange={
                        handleImageUpload
                      }

                    />

                    <div className="avatar-buttons">

                      <button

                        type="button"

                        className="upload-btn"

                        onClick={() =>
                          fileInputRef.current?.click()
                        }

                      >

                        <FaCamera />

                        Upload Photo

                      </button>

                      {profile.avatar && (

                        <button

                          type="button"

                          className="remove-btn"

                          onClick={
                            removeAvatar
                          }

                        >

                          <FaTrash />

                          Remove

                        </button>

                      )}

                    </div>

                  </div>

                  {/* =========================
                      SUMMARY
                  ========================= */}

                  <div className="profile-summary">

                    <h2>

                      {profile.name ||
                        profile.username ||
                        "User"}

                    </h2>

                    <p>

                      {profile.designation ||
                        "Security Engineer"}

                    </p>

                    <span className="role-badge">

                      <FaUserShield />

                      {profile.role ||
                        "USER"}

                    </span>

                  </div>

                  {/* =========================
                      INFORMATION
                  ========================= */}

                  <div className="info-list">

                    <div className="info-item">

                      <FaIdBadge />

                      <div>

                        <label>
                          Employee ID
                        </label>

                        <span>

                          {profile.employeeId ||
                            "N/A"}

                        </span>

                      </div>

                    </div>

                    <div className="info-item">

                      <FaEnvelope />

                      <div>

                        <label>
                          Email
                        </label>

                        <span>

                          {profile.email ||
                            "-"}

                        </span>

                      </div>

                    </div>

                    <div className="info-item">

                      <FaBuilding />

                      <div>

                        <label>
                          Department
                        </label>

                        <span>

                          {profile.department ||
                            "-"}

                        </span>

                      </div>

                    </div>

                    <div className="info-item">

                      <FaUserTie />

                      <div>

                        <label>
                          Designation
                        </label>

                        <span>

                          {profile.designation ||
                            "-"}

                        </span>

                      </div>

                    </div>

                    <div className="info-item">

                      <FaCalendarAlt />

                      <div>

                        <label>
                          Joined
                        </label>

                        <span>

                          {profile.joinedDate ||
                            "-"}

                        </span>

                      </div>

                    </div>

                    <div className="info-item">

                      <FaClock />

                      <div>

                        <label>
                          Last Login
                        </label>

                        <span>

                          {profile.lastLogin ||
                            "-"}

                        </span>

                      </div>

                    </div>

                    <div className="info-item">

                      <FaShieldAlt />

                      <div>

                        <label>
                          Account Status
                        </label>

                        <span className="status-active">

                          {profile.status ||
                            "Active"}

                        </span>

                      </div>

                    </div>

                  </div>

                </motion.div>

                {/* =================================================
                    RIGHT FORM
                ================================================= */}

                <motion.div

                  className="profile-form"

                  initial={{
                    x: 30,
                    opacity: 0,
                  }}

                  animate={{
                    x: 0,
                    opacity: 1,
                  }}

                >

                  <div className="form-grid">

                    {/* =========================
                        NAME
                    ========================= */}

                    <div className="form-group">

                      <label>

                        <FaUserCircle />

                        Full Name

                      </label>

                      <input

                        type="text"

                        name="name"

                        value={
                          profile.name
                        }

                        onChange={
                          handleChange
                        }

                        placeholder=
                          "Enter full name"

                        className={
                          profileErrors.name
                            ? "input-error"
                            : ""
                        }

                      />

                      {profileErrors.name && (

                        <small className="validation-error">

                          {
                            profileErrors.name
                          }

                        </small>

                      )}

                    </div>

                    {/* =========================
                        EMAIL
                    ========================= */}

                    <div className="form-group">

                      <label>

                        <FaEnvelope />

                        Email Address

                      </label>

                      <input

                        type="email"

                        name="email"

                        value={
                          profile.email
                        }

                        onChange={
                          handleChange
                        }

                        placeholder=
                          "Enter email"

                        className={
                          profileErrors.email
                            ? "input-error"
                            : ""
                        }

                      />

                      {profileErrors.email && (

                        <small className="validation-error">

                          {
                            profileErrors.email
                          }

                        </small>

                      )}

                    </div>

                    {/* =========================
                        PHONE
                    ========================= */}

                    <div className="form-group">

                      <label>

                        <FaPhone />

                        Phone Number

                      </label>

                      <input

                        type="text"

                        name="phone"

                        value={
                          profile.phone
                        }

                        onChange={
                          handleChange
                        }

                        placeholder=
                          "Enter phone number"

                        className={
                          profileErrors.phone
                            ? "input-error"
                            : ""
                        }

                      />

                      {profileErrors.phone && (

                        <small className="validation-error">

                          {
                            profileErrors.phone
                          }

                        </small>

                      )}

                    </div>

                    {/* =========================
                        DEPARTMENT
                    ========================= */}

                    <div className="form-group">

                      <label>

                        <FaBuilding />

                        Department

                      </label>

                      <input

                        type="text"

                        name="department"

                        value={
                          profile.department
                        }

                        onChange={
                          handleChange
                        }

                        placeholder=
                          "Department"

                        className={
                          profileErrors.department
                            ? "input-error"
                            : ""
                        }

                      />

                      {profileErrors.department && (

                        <small className="validation-error">

                          {
                            profileErrors.department
                          }

                        </small>

                      )}

                    </div>

                    {/* =========================
                        DESIGNATION
                    ========================= */}

                    <div className="form-group">

                      <label>

                        <FaUserTie />

                        Designation

                      </label>

                      <input

                        type="text"

                        name="designation"

                        value={
                          profile.designation
                        }

                        onChange={
                          handleChange
                        }

                        placeholder=
                          "Designation"

                        className={
                          profileErrors.designation
                            ? "input-error"
                            : ""
                        }

                      />

                      {profileErrors.designation && (

                        <small className="validation-error">

                          {
                            profileErrors.designation
                          }

                        </small>

                      )}

                    </div>

                    {/* =========================
                        ROLE
                    ========================= */}

                    <div className="form-group">

                      <label>

                        <FaUserShield />

                        Role

                      </label>

                      <input

                        type="text"

                        value={
                          profile.role || ""
                        }

                        disabled

                      />

                    </div>

                    {/* =========================
                        EMPLOYEE ID
                    ========================= */}

                    <div className="form-group">

                      <label>

                        <FaIdBadge />

                        Employee ID

                      </label>

                      <input

                        type="text"

                        value={
                          profile.employeeId || ""
                        }

                        readOnly

                      />

                    </div>

                    {/* =========================
                        JOINED DATE
                    ========================= */}

                    <div className="form-group">

                      <label>

                        <FaCalendarAlt />

                        Joined Date

                      </label>

                      <input

                        type="text"

                        value={
                          profile.joinedDate || ""
                        }

                        readOnly

                      />

                    </div>

                    {/* =========================
                        ADDRESS
                    ========================= */}

                    <div className="form-group full-width">

                      <label>

                        <FaMapMarkerAlt />

                        Address

                      </label>

                      <input

                        type="text"

                        name="address"

                        value={
                          profile.address
                        }

                        onChange={
                          handleChange
                        }

                        placeholder=
                          "Street, City, State"

                        className={
                          profileErrors.address
                            ? "input-error"
                            : ""
                        }

                      />

                      {profileErrors.address && (

                        <small className="validation-error">

                          {
                            profileErrors.address
                          }

                        </small>

                      )}

                    </div>

                    {/* =========================
                        BIO
                    ========================= */}

                    <div className="form-group full-width">

                      <label>
                        Biography
                      </label>

                      <textarea

                        rows="6"

                        name="bio"

                        value={
                          profile.bio
                        }

                        onChange={
                          handleChange
                        }

                        placeholder=
                          "Tell something about yourself..."

                        className={
                          profileErrors.bio
                            ? "input-error"
                            : ""
                        }

                      />

                      {profileErrors.bio && (

                        <small className="validation-error">

                          {
                            profileErrors.bio
                          }

                        </small>

                      )}

                    </div>

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
                      BUTTONS
                  ================================================= */}

                  <div className="button-group">

                    <button

                      type="button"

                      className="save-btn"

                      disabled={
                        saving
                      }

                      onClick={
                        saveProfile
                      }

                    >

                      <FaSave />

                      {saving
                        ? "Saving..."
                        : "Save Profile"}

                    </button>

                    <button

                      type="button"

                      className="password-btn"

                      onClick={() =>
                        setShowPasswordModal(
                          true
                        )
                      }

                    >

                      <FaKey />

                      Change Password

                    </button>

                  </div>

                </motion.div>

              </div>

            </>

          )}

        </motion.div>

        {/* =================================================
            PASSWORD MODAL
        ================================================= */}

        {showPasswordModal && (

          <div className="password-modal-overlay">

            <motion.div

              className="password-modal"

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

              {/* =========================
                  MODAL HEADER
              ========================= */}

              <div className="password-modal-header">

                <div>

                  <h2>
                    Change Password
                  </h2>

                  <p>
                    Update your account password.
                  </p>

                </div>

                <button

                  type="button"

                  className=
                    "password-close-btn"

                  onClick={
                    closePasswordModal
                  }

                  disabled={
                    passwordLoading
                  }

                >

                  ×

                </button>

              </div>

              {/* =========================
                  PASSWORD FORM
              ========================= */}

              <div className="password-form">

                {/* CURRENT */}

                <div className="form-group">

                  <label>
                    Current Password
                  </label>

                  <input

                    type="password"

                    name="currentPassword"

                    value={
                      passwords.currentPassword
                    }

                    onChange={
                      handlePasswordChange
                    }

                    placeholder=
                      "Enter current password"

                    className={
                      passwordErrors.currentPassword
                        ? "input-error"
                        : ""
                    }

                  />

                  {passwordErrors.currentPassword && (

                    <small className="validation-error">

                      {
                        passwordErrors.currentPassword
                      }

                    </small>

                  )}

                </div>

                {/* NEW */}

                <div className="form-group">

                  <label>
                    New Password
                  </label>

                  <input

                    type="password"

                    name="newPassword"

                    value={
                      passwords.newPassword
                    }

                    onChange={
                      handlePasswordChange
                    }

                    placeholder=
                      "Minimum 6 characters"

                    className={
                      passwordErrors.newPassword
                        ? "input-error"
                        : ""
                    }

                  />

                  {passwordErrors.newPassword && (

                    <small className="validation-error">

                      {
                        passwordErrors.newPassword
                      }

                    </small>

                  )}

                </div>

                {/* CONFIRM */}

                <div className="form-group">

                  <label>
                    Confirm Password
                  </label>

                  <input

                    type="password"

                    name="confirmPassword"

                    value={
                      passwords.confirmPassword
                    }

                    onChange={
                      handlePasswordChange
                    }

                    placeholder=
                      "Confirm new password"

                    className={
                      passwordErrors.confirmPassword
                        ? "input-error"
                        : ""
                    }

                  />

                  {passwordErrors.confirmPassword && (

                    <small className="validation-error">

                      {
                        passwordErrors.confirmPassword
                      }

                    </small>

                  )}

                </div>

              </div>

              {/* =========================
                  MODAL ACTIONS
              ========================= */}

              <div className="password-modal-actions">

                <button

                  type="button"

                  className=
                    "cancel-password-btn"

                  onClick={
                    closePasswordModal
                  }

                  disabled={
                    passwordLoading
                  }

                >

                  Cancel

                </button>

                <button

                  type="button"

                  className=
                    "change-password-btn"

                  onClick={
                    changePassword
                  }

                  disabled={
                    passwordLoading
                  }

                >

                  <FaKey />

                  {passwordLoading
                    ? "Changing..."
                    : "Change Password"}

                </button>

              </div>

            </motion.div>

          </div>

        )}

        <Footer />

      </div>

    </div>

  );
}

export default Profile;