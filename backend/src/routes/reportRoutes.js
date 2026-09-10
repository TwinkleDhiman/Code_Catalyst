const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getReports, generateReport } = require("../controllers/reportController");

router.get("/:projectId", protect, getReports);
router.post("/:projectId/generate", protect, generateReport);

module.exports = router;
