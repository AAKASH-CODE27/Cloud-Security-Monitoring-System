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
    delete updateData.role;
    delete updateData.status;
  }

  // Whitelist safe profile fields (never silently overwrite password in generic update)
  if (updateData.username) user.username = updateData.username.trim();
  if (updateData.email) user.email = updateData.email.toLowerCase().trim();
  if (updateData.department != null) user.department = updateData.department.trim();
  if (updateData.phone != null) user.phone = updateData.phone;
  if (updateData.designation != null) user.designation = updateData.designation;
  if (updateData.address != null) user.address = updateData.address;
  if (updateData.bio != null) user.bio = updateData.bio;
  if (updateData.employeeId != null) user.employeeId = updateData.employeeId;

  // Administrative modifications
  if (requestingUser.role === "ADMIN") {
    if (updateData.role) {
      const validRoles = ["ADMIN", "ITSM", "USER"];
      if (validRoles.includes(updateData.role)) {
        user.role = updateData.role;
      }
    }
    if (updateData.status) {
      user.status = updateData.status;
    }
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

  // Prevent admin from deleting their own account
  if (String(requestingUser._id) === String(user._id)) {
    const err = new Error("Bad Request: Cannot delete your own administrative account.");
    err.statusCode = 400;
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
