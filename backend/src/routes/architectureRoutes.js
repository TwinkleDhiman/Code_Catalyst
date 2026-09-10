const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getArchitecture } = require("../controllers/architectureController");

router.get("/:projectId", protect, getArchitecture);

module.exports = router;
