const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getDependencyGraph } = require("../controllers/dependencyController");

router.get("/:projectId", protect, getDependencyGraph);

module.exports = router;
