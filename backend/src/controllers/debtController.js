const mongoose = require("mongoose");
const Project = require("../models/Project");
const Analysis = require("../models/Analysis");
const { sendError } = require("../utils/apiResponse");

/**
 * @desc    Get Technical Debt analysis for a project
 * @route   GET /api/debt/:projectId
 * @access  Private
 */
const getTechnicalDebt = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId || projectId === "undefined" || projectId === "null" || projectId === "") {
      const userProjects = await Project.find({ user: req.user.id }).sort({ createdAt: -1 });
      
      const emptySummary = { low: 0, medium: 0, high: 0, debtScore: 100, todoCount: 0, fixmeCount: 0, largeFileCount: 0, deepNestingCount: 0 };
      
      if (userProjects.length === 0) {
        return res.json({
          success: true,
          hasProject: false,
          totalFindings: 0,
          summary: emptySummary,
          findings: [],
          data: {
            hasProject: false,
            message: "No repository uploaded yet",
            totalFindings: 0,
            summary: emptySummary,
            findings: [],
            technicalDebt: { debtScore: 100, todoCount: 0, fixmeCount: 0, largeFileCount: 0, deepNestingCount: 0, issues: [] },
          },
        });
      }
      
      return res.json({
        success: true,
        hasProject: true,
        totalFindings: 0,
        summary: emptySummary,
        findings: [],
        data: {
          hasProject: true,
          message: "Select a repository to view technical debt",
          totalFindings: 0,
          summary: emptySummary,
          findings: [],
          technicalDebt: { debtScore: 100, todoCount: 0, fixmeCount: 0, largeFileCount: 0, deepNestingCount: 0, issues: [] },
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

    // Fetch stored analysis result from MongoDB
    const analysis = await Analysis.findOne({
      project: projectId,
      module: "technical-debt",
    }).sort({ createdAt: -1 });

    if (!analysis) {
      // Empty / initial state
      const emptySummary = {
        low: 0,
        medium: 0,
        high: 0,
        debtScore: 100,
        todoCount: 0,
        fixmeCount: 0,
        largeFileCount: 0,
        deepNestingCount: 0,
      };

      return res.json({
        success: true,
        totalFindings: 0,
        summary: emptySummary,
        findings: [],
        data: {
          projectId: project._id,
          projectName: project.name,
          totalFindings: 0,
          summary: emptySummary,
          findings: [],
          technicalDebt: {
            debtScore: 100,
            todoCount: 0,
            fixmeCount: 0,
            largeFileCount: 0,
            deepNestingCount: 0,
            issues: [],
          },
          message:
            project.uploadType === "git"
              ? "Upload a ZIP file to run static code analysis on this repository."
              : "Analysis not available for this project.",
        },
        technicalDebt: {
          debtScore: 100,
          todoCount: 0,
          fixmeCount: 0,
          largeFileCount: 0,
          deepNestingCount: 0,
          issues: [],
        },
      });
    }

    const summary = analysis.summary || {};
    const findings = (analysis.findings || []).map((f) => ({
      ruleId: f.ruleId,
      severity: f.severity || "LOW",
      filePath: f.filePath || f.file || "",
      file: f.filePath || f.file || "",
      lineNumber: f.lineNumber ?? null,
      description: f.description || "",
      suggestion: f.suggestion || f.recommendation || "Review and refactor this code section.",
      recommendation: f.suggestion || f.recommendation || "Review and refactor this code section.",
      issueType: f.issueType || f.title || "Code Quality Issue",
      type: f.issueType || f.title || "Code Quality Issue",
    }));

    const responseSummary = {
      low: summary.low ?? findings.filter((f) => f.severity === "LOW").length,
      medium: summary.medium ?? findings.filter((f) => f.severity === "MEDIUM").length,
      high: summary.high ?? findings.filter((f) => f.severity === "HIGH").length,
      debtScore: summary.debtScore ?? analysis.score ?? 100,
      todoCount: summary.todoCount ?? findings.filter((f) => f.ruleId === "TD-TODO-001").length,
      fixmeCount: summary.fixmeCount ?? findings.filter((f) => f.ruleId === "TD-FIXME-001").length,
      largeFileCount: summary.largeFileCount ?? findings.filter((f) => f.ruleId === "TD-SIZE-001").length,
      deepNestingCount: summary.deepNestingCount ?? findings.filter((f) => f.ruleId === "TD-NESTING-001").length,
    };

    return res.json({
      success: true,
      totalFindings: findings.length,
      summary: responseSummary,
      findings,
      data: {
        projectId: project._id,
        projectName: project.name,
        totalFindings: findings.length,
        summary: responseSummary,
        findings,
        technicalDebt: {
          debtScore: responseSummary.debtScore,
          todoCount: responseSummary.todoCount,
          fixmeCount: responseSummary.fixmeCount,
          largeFileCount: responseSummary.largeFileCount,
          deepNestingCount: responseSummary.deepNestingCount,
          issues: findings,
        },
      },
      technicalDebt: {
        debtScore: responseSummary.debtScore,
        todoCount: responseSummary.todoCount,
        fixmeCount: responseSummary.fixmeCount,
        largeFileCount: responseSummary.largeFileCount,
        deepNestingCount: responseSummary.deepNestingCount,
        issues: findings,
      },
    });
  } catch (error) {
    console.error("[TechnicalDebt Error]:", error);
    return sendError(res, "Failed to retrieve technical debt analysis", 500);
  }
};

module.exports = { getTechnicalDebt };
