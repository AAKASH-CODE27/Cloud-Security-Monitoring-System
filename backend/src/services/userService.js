const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function getAllUsers() {
  return await User.find().select("-password").sort({ joinedDate: -1 });
}

async function getUserById(id) {
  const user = await User.findById(id).select("-password");
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  return user;
}

async function updateUser(id, updateData, requestingUser) {
  const user = await User.findById(id);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  // Non-ADMIN users can only update their own profile and cannot change their role
  if (requestingUser.role !== "ADMIN") {
    if (String(requestingUser._id) !== String(user._id)) {
      const err = new Error("Forbidden: Cannot modify another user's profile.");
      err.statusCode = 403;
      throw err;
    }
    delete updateData.role; // Prevent self-role elevation
  }

  if (updateData.username) user.username = updateData.username;
  if (updateData.email) user.email = updateData.email.toLowerCase();
  if (updateData.department) user.department = updateData.department;
  if (updateData.phone) user.phone = updateData.phone;
  if (updateData.designation) user.designation = updateData.designation;
  if (updateData.address) user.address = updateData.address;
  if (updateData.bio) user.bio = updateData.bio;
  if (updateData.employeeId) user.employeeId = updateData.employeeId;

  if (requestingUser.role === "ADMIN" && updateData.role) {
    const validRoles = ["ADMIN", "ITSM", "USER"];
    if (validRoles.includes(updateData.role)) {
      user.role = updateData.role;
    }
  }

  if (updateData.password && updateData.password.trim() !== "") {
    user.password = await bcrypt.hash(updateData.password, 10);
  }

  const updated = await user.save();
  const userObj = updated.toObject();
  delete userObj.password;
  return userObj;
}

async function deleteUser(id, requestingUser) {
  if (requestingUser.role !== "ADMIN") {
    const err = new Error("Only ADMIN can delete users.");
    err.statusCode = 403;
    throw err;
  }

  const user = await User.findById(id);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  await user.deleteOne();
  return { message: "User deleted successfully" };
}

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
