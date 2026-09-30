const mongoose = require("mongoose");
const Project = require("../models/Project");
const Report = require("../models/Report");
const Analysis = require("../models/Analysis");
const Dependency = require("../models/Dependency");
const { sendError } = require("../utils/apiResponse");

/**
 * @desc    Get reports for a project
 * @route   GET /api/reports/:projectId
 * @access  Private
 */
const getReports = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId || projectId === "undefined" || projectId === "null" || projectId === "") {
      const userProjects = await Project.find({ user: req.user.id }).sort({ createdAt: -1 });

      if (userProjects.length === 0) {
        return res.json({
          success: true,
          hasProject: false,
          data: {
            hasProject: false,
            message: "No repository uploaded yet",
            project: null,
            reports: [],
          },
        });
      }

      return res.json({
        success: true,
        hasProject: true,
        data: {
          hasProject: true,
          message: "Select a repository to view reports",
          project: null,
          reports: [],
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

    const reports = await Report.find({ project: projectId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: {
        project: { id: project._id, name: project.name },
        reports,
      },
      project: { id: project._id, name: project.name },
    });
  } catch (error) {
    console.error("[Reports Error]:", error);
    return sendError(res, "Failed to retrieve reports", 500);
  }
};

/**
 * @desc    Generate and return a report with real analysis data
 * @route   POST /api/reports/:projectId/generate
 * @access  Private
 */
const generateReport = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { format } = req.body;

    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
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

    // Gather all analysis data for the report
    const debtAnalysis = await Analysis.findOne({
      project: projectId,
      module: "technical-debt",
    }).sort({ createdAt: -1 });

    const secAnalysis = await Analysis.findOne({
      project: projectId,
      module: "security",
    }).sort({ createdAt: -1 });

    const depRecord = await Dependency.findOne({ project: projectId }).sort({ createdAt: -1 });

    const archAnalysis = await Analysis.findOne({
      project: projectId,
      module: "architecture",
    }).sort({ createdAt: -1 });

    // Build a structured report data object
    const reportData = {
      reportTitle: `${project.name} – Static Code Analysis Report`,
      generatedAt: new Date().toISOString(),
      project: {
        name: project.name,
        uploadType: project.uploadType,
        gitUrl: project.gitUrl || "N/A",
        fileCount: project.fileCount || 0,
        folderCount: project.folderCount || 0,
        languages: project.languages || {},
        status: project.status,
      },
      technicalDebt: debtAnalysis
        ? {
            debtScore: debtAnalysis.summary?.debtScore ?? 100,
            todoCount: debtAnalysis.summary?.todoCount ?? 0,
            fixmeCount: debtAnalysis.summary?.fixmeCount ?? 0,
            largeFileCount: debtAnalysis.summary?.largeFileCount ?? 0,
            deepNestingCount: debtAnalysis.summary?.deepNestingCount ?? 0,
            totalIssues: (debtAnalysis.findings || []).length,
            issues: debtAnalysis.findings || [],
          }
        : { message: "No technical debt analysis available." },
      securityAudit: secAnalysis
        ? {
            securityScore: secAnalysis.summary?.securityScore ?? 100,
            criticalCount: secAnalysis.summary?.criticalCount ?? 0,
            highCount: secAnalysis.summary?.highCount ?? 0,
            mediumCount: secAnalysis.summary?.mediumCount ?? 0,
            totalFindings: (secAnalysis.findings || []).length,
            findings: secAnalysis.findings || [],
          }
        : { message: "No security analysis available." },
      dependencies: {
        total: depRecord ? (depRecord.dependencies || []).length : 0,
        list: depRecord ? depRecord.dependencies || [] : [],
      },
      architecture: {
        components:
          archAnalysis?.summary?.components || [],
        connections:
          archAnalysis?.summary?.connections || [],
      },
    };

    // Save report record to MongoDB
    const report = await Report.create({
      project: projectId,
      title: reportData.reportTitle,
      format: format || "json",
      status: "ready",
    });

    // Return both the record and the actual content for download
    return res.json({
      success: true,
      data: {
        report,
        content: reportData,
      },
    });
  } catch (error) {
    console.error("[GenerateReport Error]:", error);
    return sendError(res, "Failed to generate report", 500);
  }
};

module.exports = { getReports, generateReport };
