// ============================================================
// GET/PUT /api/settings
//
// Another endpoint the frontend expected but the Spring backend
// never implemented. Stored per-user on User.settings, in the
// exact shape Settings.jsx's defaultSettings uses.
// ============================================================

async function getSettings(req, res) {
  return res.status(200).json(req.user.settings);
}

async function updateSettings(req, res) {
  const user = req.user;

  user.settings = {
    ...user.settings.toObject(),
    ...req.body,
  };

  await user.save();

  return res.status(200).json(user.settings);
}

module.exports = { getSettings, updateSettings };
