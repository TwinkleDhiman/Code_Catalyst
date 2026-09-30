const mongoose = require("mongoose");
const Project = require("../models/Project");
const Analysis = require("../models/Analysis");
const { sendError } = require("../utils/apiResponse");

/**
 * @desc    Get Security Audit analysis for a project
 * @route   GET /api/security/:projectId
 * @access  Private
 */
const getSecurityAudit = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId || projectId === "undefined" || projectId === "null" || projectId === "") {
      const userProjects = await Project.find({ user: req.user.id }).sort({ createdAt: -1 });

      const emptyAudit = { securityScore: 100, criticalCount: 0, highCount: 0, mediumCount: 0, findings: [] };

      if (userProjects.length === 0) {
        return res.json({
          success: true,
          hasProject: false,
          securityAudit: emptyAudit,
          data: {
            hasProject: false,
            message: "No repository uploaded yet",
            securityAudit: emptyAudit,
          },
        });
      }

      return res.json({
        success: true,
        hasProject: true,
        securityAudit: emptyAudit,
        data: {
          hasProject: true,
          message: "Select a repository to view security audit",
          securityAudit: emptyAudit,
        },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(404).json({ success: false, message: "Repository not found." });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Repository not found." });
    }

    if (project.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this repository.",
      });
    }

    // Fetch stored security analysis from MongoDB
    const analysis = await Analysis.findOne({
      project: projectId,
      module: "security",
    }).sort({ createdAt: -1 });

    if (!analysis) {
      return res.json({
        success: true,
        data: {
          projectId: project._id,
          projectName: project.name,
          securityAudit: {
            securityScore: 100,
            criticalCount: 0,
            highCount: 0,
            mediumCount: 0,
            findings: [],
          },
          message:
            project.uploadType === "git"
              ? "Upload a ZIP file to run security scanning on this repository."
              : "Security analysis not available for this project.",
        },
        securityAudit: {
          securityScore: 100,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          findings: [],
        },
      });
    }

    const summary = analysis.summary || {};

    return res.json({
      success: true,
      data: {
        projectId: project._id,
        projectName: project.name,
        securityAudit: {
          securityScore: summary.securityScore ?? analysis.score ?? 100,
          criticalCount: summary.criticalCount ?? 0,
          highCount: summary.highCount ?? 0,
          mediumCount: summary.mediumCount ?? 0,
          findings: analysis.findings || [],
        },
      },
      securityAudit: {
        securityScore: summary.securityScore ?? analysis.score ?? 100,
        criticalCount: summary.criticalCount ?? 0,
        highCount: summary.highCount ?? 0,
        mediumCount: summary.mediumCount ?? 0,
        findings: analysis.findings || [],
      },
    });
  } catch (error) {
    console.error("[SecurityAudit Error]:", error);
    return sendError(res, "Failed to retrieve security audit analysis", 500);
  }
};

module.exports = { getSecurityAudit };
