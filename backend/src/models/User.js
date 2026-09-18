const mongoose = require("mongoose");

// ============================================================
// Role Enum
// Equivalent to model/Role.java
// ============================================================

const ROLES = ["ADMIN", "ITSM", "USER"];

// ============================================================
// User Schema
// Equivalent to model/User.java
// ============================================================

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    department: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ROLES,
      default: "USER",
    },

    // =========================================================
    // Extra profile fields
    // The Spring "profile" package (ProfileEntity) existed but was
    // never wired to a controller. The frontend's Profile.jsx /
    // Settings.jsx pages expect these fields, so they live directly
    // on the User document here instead of a separate collection.
    // =========================================================

    employeeId: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    designation: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
    },

    avatar: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      default: "Active",
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    settings: {
      theme: { type: String, default: "dark" },
      notifications: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
      twoFactor: { type: Boolean, default: false },
      autoLogout: { type: Number, default: 30 },
      language: { type: String, default: "English" },
      timezone: { type: String, default: "Asia/Kolkata" },
      maintenanceMode: { type: Boolean, default: false },
      allowUserRegistration: { type: Boolean, default: true },
      itsmIntegration: { type: Boolean, default: true },
    },
  },
  {
    timestamps: { createdAt: "joinedDate", updatedAt: "updatedAt" },
  }
);

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
module.exports.ROLES = ROLES;
