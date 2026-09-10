const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { protect } = require("../middleware/authMiddleware");
const { sendError } = require("../utils/apiResponse");
const {
  getProjects,
  getProjectById,
  uploadZipProject,
  submitGithubProject,
  deleteProject,
} = require("../controllers/projectController");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer storage for ZIP uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

// Middleware wrapper for single file upload with error handling
const handleFileUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return sendError(res, `File upload error: ${err.message}`, 400);
    } else if (err) {
      return sendError(res, `Upload failed: ${err.message}`, 500);
    }
    next();
  });
};

// All project routes require authentication
router.use(protect);

router.get("/", getProjects);
router.get("/:id", getProjectById);
router.post("/upload", handleFileUpload, uploadZipProject);
router.post("/github", submitGithubProject);
router.delete("/:id", deleteProject);

module.exports = router;
