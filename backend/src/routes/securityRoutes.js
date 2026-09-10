const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getSecurityAudit } = require("../controllers/securityController");

router.get("/:projectId", protect, getSecurityAudit);

module.exports = router;
