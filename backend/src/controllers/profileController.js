const bcrypt = require("bcryptjs");
const User = require("../models/User");

// ============================================================
// GET /api/profile-data
//
// The Spring Boot ProfileController/ProfileManager existed in
// source but was entirely commented out, so this endpoint 404'd
// against the original backend. Implemented here for real,
// backed by the User document, in the exact shape Profile.jsx
// expects (see initialProfile in the frontend source).
// ============================================================

function toProfileDto(user) {
  return {
    id: user._id,
    userId: user._id,
    employeeId: user.employeeId || "",
    name: user.username,
    username: user.username,
    email: user.email,
    phone: user.phone || "",
    department: user.department || "",
    designation: user.designation || "",
    role: user.role,
    joinedDate: user.joinedDate,
    lastLogin: user.lastLogin,
    address: user.address || "",
    bio: user.bio || "",
    avatar: user.avatar || "",
    status: user.status || "Active",
  };
}

async function getProfile(req, res) {
  return res.status(200).json(toProfileDto(req.user));
}

// ============================================================
// PUT /api/profile-data
// ============================================================

async function updateProfile(req, res) {
  const { name, email, phone, department, designation, address, bio, avatar } =
    req.body;

  const user = req.user;

  if (name) user.username = name;
  if (email) user.email = email.toLowerCase();
  user.phone = phone ?? user.phone;
  user.department = department ?? user.department;
  user.designation = designation ?? user.designation;
  user.address = address ?? user.address;
  user.bio = bio ?? user.bio;
  user.avatar = avatar ?? user.avatar;

  const saved = await user.save();

  return res.status(200).json(toProfileDto(saved));
}

// ============================================================
// PUT /api/profile-data/password
// ============================================================

async function changePassword(req, res) {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "All password fields are required." });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "New passwords do not match." });
  }

  const user = req.user;

  const matches = await bcrypt.compare(currentPassword, user.password);

  if (!matches) {
    return res.status(400).json({ message: "Current password is incorrect." });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return res.status(200).json({ message: "Password changed successfully" });
}

module.exports = { getProfile, updateProfile, changePassword };
