const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { generateToken } = require("../utils/jwt");

async function registerPublicUser({ username, email, password, department }) {
  if (!username || !email || !password) {
    const err = new Error("Username, email, and password are required.");
    err.statusCode = 400;
    throw err;
  }

  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    const err = new Error("Email already exists.");
    err.statusCode = 409;
    throw err;
  }

  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    const err = new Error("Username already exists.");
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Mandatory Security Fix: Public registration ALWAYS assigns role = "USER"
  const user = await User.create({
    username: username.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    department: department ? department.trim() : "",
    role: "USER",
  });

  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    department: user.department,
  };
}

async function loginUser({ email, password }) {
  if (!email || !password) {
    const err = new Error("Email and password are required.");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    const err = new Error("Invalid email or password.");
    err.statusCode = 401;
    throw err;
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    const err = new Error("Invalid email or password.");
    err.statusCode = 401;
    throw err;
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user.email);

  return {
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      department: user.department || "",
      role: user.role,
      status: user.status,
    },
  };
}

async function adminCreateUser({ username, email, password, department, role }, creatorRole) {
  if (creatorRole !== "ADMIN") {
    const err = new Error("Only ADMIN can assign ITSM or ADMIN roles.");
    err.statusCode = 403;
    throw err;
  }

  if (!username || !email || !password) {
    const err = new Error("Username, email, and password are required.");
    err.statusCode = 400;
    throw err;
  }

  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    const err = new Error("Email already exists.");
    err.statusCode = 409;
    throw err;
  }

  const validRoles = ["ADMIN", "ITSM", "USER"];
  const finalRole = validRoles.includes(role) ? role : "USER";

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    username: username.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    department: department ? department.trim() : "",
    role: finalRole,
  });

  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    department: user.department,
  };
}

module.exports = {
  registerPublicUser,
  loginUser,
  adminCreateUser,
};
