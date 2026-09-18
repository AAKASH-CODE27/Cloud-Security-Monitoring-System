// ============================================================
// GET/PUT /api/settings
//
// Stored per-user on User.settings.
// Administrative settings (maintenanceMode, allowUserRegistration, itsmIntegration)
// may ONLY be modified by ADMIN users.
// ============================================================

async function getSettings(req, res) {
  return res.status(200).json(req.user.settings);
}

async function updateSettings(req, res) {
  const user = req.user;
  const body = req.body || {};

  const adminOnlyKeys = ["maintenanceMode", "allowUserRegistration", "itsmIntegration"];

  // Filter keys based on role
  const safeUpdates = {};
  for (const [key, value] of Object.entries(body)) {
    if (adminOnlyKeys.includes(key)) {
      if (user.role === "ADMIN") {
        safeUpdates[key] = Boolean(value);
      } else {
        // Silently ignore or reject attempt to manipulate administrative flags
        console.warn(`[settingsController] Non-admin user ${user.email} attempted to alter ${key}`);
      }
    } else {
      // User preference settings
      safeUpdates[key] = value;
    }
  }

  user.settings = {
    ...user.settings.toObject(),
    ...safeUpdates,
  };

  await user.save();

  return res.status(200).json(user.settings);
}

module.exports = { getSettings, updateSettings };
