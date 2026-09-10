const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getTechnicalDebt } = require("../controllers/debtController");

router.get("/:projectId", protect, getTechnicalDebt);

module.exports = router;
