const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Import Routes
const authRoutes = require("./src/routes/authRoutes");
const projectRoutes = require("./src/routes/projectRoutes");
const debtRoutes = require("./src/routes/debtRoutes");
const securityRoutes = require("./src/routes/securityRoutes");
const dependencyRoutes = require("./src/routes/dependencyRoutes");
const architectureRoutes = require("./src/routes/architectureRoutes");
const reportRoutes = require("./src/routes/reportRoutes");
const historyRoutes = require("./src/routes/historyRoutes");
const { getDashboardStats } = require("./src/controllers/projectController");
const { protect } = require("./src/middleware/authMiddleware");
const { notFound, errorHandler } = require("./src/middleware/errorMiddleware");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Root API Health Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "CodeCatalyst Backend API is active and running",
    timestamp: new Date(),
  });
});

// Mounting API Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.get("/api/dashboard/stats", protect, getDashboardStats);
app.use("/api/debt", debtRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/dependencies", dependencyRoutes);
app.use("/api/architecture", architectureRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/history", historyRoutes);

// Compatibility route for /api/analysis/:id
app.get("/api/analysis/:projectId", protect, (req, res, next) => {
  // Delegate to debt controller for backwards compatibility if needed
  const { getTechnicalDebt } = require("./src/controllers/debtController");
  return getTechnicalDebt(req, res, next);
});

// Error handling middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
