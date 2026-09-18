const express = require("express");
const router = express.Router();

const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/auth");
const {
  getSettings,
  updateSettings,
} = require("../controllers/settingsController");

router.use(authenticate);

router.get("/", asyncHandler(getSettings));
router.put("/", asyncHandler(updateSettings));

module.exports = router;
