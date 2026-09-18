const authService = require("../services/authService");

async function register(req, res) {
  const result = await authService.registerPublicUser(req.body);
  return res.status(201).json({
    success: true,
    message: "User registered successfully.",
    user: result,
  });
}

async function login(req, res) {
  const result = await authService.loginUser(req.body);
  return res.status(200).json(result);
}

async function adminCreateUser(req, res) {
  const result = await authService.adminCreateUser(req.body, req.user.role);
  return res.status(201).json({
    success: true,
    message: "User created by administrator.",
    user: result,
  });
}

module.exports = { register, login, adminCreateUser };
