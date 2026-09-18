const userService = require("../services/userService");

async function profile(req, res) {
  return res.status(200).json(req.user);
}

async function getAllUsers(req, res) {
  const users = await userService.getAllUsers();
  return res.status(200).json(users);
}

async function getUserById(req, res) {
  const user = await userService.getUserById(req.params.id);
  return res.status(200).json(user);
}

async function updateUser(req, res) {
  const updated = await userService.updateUser(req.params.id, req.body, req.user);
  return res.status(200).json(updated);
}

async function deleteUser(req, res) {
  const result = await userService.deleteUser(req.params.id, req.user);
  return res.status(200).json(result);
}

module.exports = { profile, getAllUsers, getUserById, updateUser, deleteUser };
