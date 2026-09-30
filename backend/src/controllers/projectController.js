const mongoose = require("mongoose");
const Project = require("../models/Project");
const Analysis = require("../models/Analysis");
const Dependency = require("../models/Dependency");
const AnalysisHistory = require("../models/AnalysisHistory");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { analyzeZip } = require("../utils/analyzeZip");

/**
 * @desc    Get all projects for authenticated user
 * @route   GET /api/projects
 * @access  Private
 */
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user.id }).sort({ createdAt: -1 });

    const formattedProjects = projects.map((p) => ({
      id: p._id,
      _id: p._id,
      name: p.name,
      description: p.description,
      gitUrl: p.gitUrl,
      uploadType: p.uploadType,
      status: p.status,
      file_count: p.fileCount,
      folder_count: p.folderCount,
      languages: p.languages || {},
      analysisStatus: p.analysisStatus,
      createdAt: p.createdAt,
    }));

    return res.json(formattedProjects);
  } catch (error) {
    console.error("[GetProjects Error]:", error);
    return sendError(res, "Failed to retrieve projects", 500);
  }
};

/**
 * @desc    Get single project by ID
 * @route   GET /api/projects/:id
 * @access  Private
 */
const getProjectById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (project.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this project.",
      });
    }

    return sendSuccess(res, {
      id: project._id,
      _id: project._id,
      name: project.name,
      description: project.description,
      gitUrl: project.gitUrl,
      uploadType: project.uploadType,
      status: project.status,
      fileCount: project.fileCount,
      folderCount: project.folderCount,
      languages: project.languages || {},
      analysisStatus: project.analysisStatus,
      createdAt: project.createdAt,
    });
  } catch (error) {
    console.error("[GetProjectById Error]:", error);
    return sendError(res, "Failed to retrieve project", 500);
  }
};

/**
 * @desc    Upload local ZIP file and run rule-based analysis
 * @route   POST /api/projects/upload
 * @access  Private
 */
const uploadZipProject = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return sendError(res, "Project name is required", 400);
    }

    if (!req.file) {
      return sendError(res, "ZIP file is required", 400);
    }

    const filePath = req.file.path;

    // Create project record first
    const project = await Project.create({
      name,
      uploadType: "zip",
      filePath,
      user: req.user.id,
      status: "active",
    });

    // Run ZIP analysis immediately
    let analysisResult = null;
    try {
      analysisResult = analyzeZip(filePath);

      // Clean up any previous analysis or dependency results for this project to prevent duplicates
      await Analysis.deleteMany({ project: project._id });
      await Dependency.deleteMany({ project: project._id });

      // Update project with language and file counts from analysis
      await Project.findByIdAndUpdate(project._id, {
        fileCount: analysisResult.fileCount,
        folderCount: analysisResult.folderCount,
        languages: analysisResult.languageCounts,
        analysisStatus: "completed",
        status: "scanned",
      });

      // Store technical debt analysis
      await Analysis.create({
        project: project._id,
        module: "technical-debt",
        status: "completed",
        findings: analysisResult.technicalDebt.findings,
        score: analysisResult.technicalDebt.debtScore,
        summary: {
          totalFindings: analysisResult.technicalDebt.totalFindings,
          low: analysisResult.technicalDebt.summary.low,
          medium: analysisResult.technicalDebt.summary.medium,
          high: analysisResult.technicalDebt.summary.high,
          debtScore: analysisResult.technicalDebt.debtScore,
          todoCount: analysisResult.technicalDebt.todoCount,
          fixmeCount: analysisResult.technicalDebt.fixmeCount,
          largeFileCount: analysisResult.technicalDebt.largeFileCount,
          deepNestingCount: analysisResult.technicalDebt.deepNestingCount,
        },
      });

      // Store security analysis
      await Analysis.create({
        project: project._id,
        module: "security",
        status: "completed",
        findings: analysisResult.securityAudit.findings,
        score: analysisResult.securityAudit.securityScore,
        summary: {
          securityScore: analysisResult.securityAudit.securityScore,
          totalFindings: analysisResult.securityAudit.totalFindings,
          criticalCount: analysisResult.securityAudit.criticalCount,
          highCount: analysisResult.securityAudit.highCount,
          mediumCount: analysisResult.securityAudit.mediumCount,
        },
      });

      // Store architecture analysis
      await Analysis.create({
        project: project._id,
        module: "architecture",
        status: "completed",
        findings: [],
        summary: {
          components: analysisResult.architecture.components,
          connections: analysisResult.architecture.connections,
        },
      });

      // Store dependency graph and package inventory
      await Dependency.create({
        project: project._id,
        packageDependencies: analysisResult.dependencyGraph.packageDependencies,
        nodes: analysisResult.dependencyGraph.nodes,
        edges: analysisResult.dependencyGraph.edges,
        summary: analysisResult.dependencyGraph.summary,
        dependencies: analysisResult.dependencyGraph.dependencies,
        status: "completed",
      });
    } catch (analysisError) {
      console.error("[ZIP Analysis Error]:", analysisError.message);
      // Mark analysis as failed but still return the created project
      await Project.findByIdAndUpdate(project._id, {
        analysisStatus: "failed",
      });
    }

    // Record audit history
    await AnalysisHistory.create({
      project: project._id,
      user: req.user.id,
      action: `Uploaded and analyzed ZIP archive: ${name}`,
      module: "Repository Upload",
      status: "completed",
    });

    const updatedProject = await Project.findById(project._id);

    return sendSuccess(
      res,
      {
        project: {
          id: updatedProject._id,
          _id: updatedProject._id,
          name: updatedProject.name,
          uploadType: updatedProject.uploadType,
          status: updatedProject.status,
          analysisStatus: updatedProject.analysisStatus,
        },
      },
      "Project uploaded and analyzed successfully",
      201
    );
  } catch (error) {
    console.error("[UploadZip Error]:", error);
    return sendError(res, error.message || "Failed to upload project ZIP", 500);
  }
};

/**
 * @desc    Submit public GitHub Repository URL
 * @route   POST /api/projects/github
 * @access  Private
 */
const submitGithubProject = async (req, res) => {
  try {
    const { name, gitUrl } = req.body;

    if (!name || !gitUrl) {
      return sendError(res, "Project name and GitHub URL are required", 400);
    }

    // Validate GitHub URL format
    const githubUrlPattern = /^https?:\/\/(www\.)?github\.com\/[\w.\-]+\/[\w.\-]+(\.git)?(\/?)?$/i;
    if (!githubUrlPattern.test(gitUrl)) {
      return sendError(res, "Please provide a valid GitHub repository URL (e.g. https://github.com/user/repo)", 400);
    }

    const project = await Project.create({
      name,
      gitUrl,
      uploadType: "git",
      user: req.user.id,
      status: "active",
      analysisStatus: "none",
    });

    // Record audit history
    await AnalysisHistory.create({
      project: project._id,
      user: req.user.id,
      action: `Registered GitHub repository: ${gitUrl}`,
      module: "GitHub Repository",
      status: "completed",
    });

    return sendSuccess(
      res,
      {
        project: {
          id: project._id,
          _id: project._id,
          name: project.name,
          gitUrl: project.gitUrl,
          uploadType: project.uploadType,
          status: project.status,
          analysisStatus: project.analysisStatus,
        },
      },
      "GitHub repository registered successfully. Upload a ZIP for full static analysis.",
      201
    );
  } catch (error) {
    console.error("[SubmitGithub Error]:", error);
    return sendError(res, error.message || "Failed to submit GitHub repository", 500);
  }
};

/**
 * @desc    Delete a project and all its related data
 * @route   DELETE /api/projects/:id
 * @access  Private
 */
const deleteProject = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (project.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this project.",
      });
    }

    await Project.findByIdAndDelete(req.params.id);

    // Clean up all related data
    await Analysis.deleteMany({ project: req.params.id });
    await Dependency.deleteMany({ project: req.params.id });
    await AnalysisHistory.deleteMany({ project: req.params.id });

    return sendSuccess(res, { id: req.params.id }, "Project deleted successfully");
  } catch (error) {
    console.error("[DeleteProject Error]:", error);
    return sendError(res, "Failed to delete project", 500);
  }
};

/**
 * @desc    Get dashboard statistics for the logged-in user
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
const getDashboardStats = async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments({ user: req.user.id });

    // Aggregate language counts across all user projects
    const projects = await Project.find({ user: req.user.id }).select("languages");
    const languageCounts = {};
    projects.forEach((p) => {
      if (p.languages && typeof p.languages === "object") {
        Object.entries(p.languages).forEach(([lang, count]) => {
          languageCounts[lang] = (languageCounts[lang] || 0) + count;
        });
      }
    });

    // Count total security and debt findings across all user projects
    const projectIds = projects.map((p) => p._id);

    const secAnalyses = await Analysis.find({
      project: { $in: projectIds },
      module: "security",
    }).select("summary");

    const debtAnalyses = await Analysis.find({
      project: { $in: projectIds },
      module: "technical-debt",
    }).select("summary");

    let totalSecurityIssues = 0;
    secAnalyses.forEach((a) => {
      if (a.summary) {
        totalSecurityIssues +=
          (a.summary.criticalCount || 0) +
          (a.summary.highCount || 0) +
          (a.summary.mediumCount || 0);
      }
    });

    let totalDebtIssues = 0;
    debtAnalyses.forEach((a) => {
      totalDebtIssues += (a.findings || []).length;
    });

    return res.json({
      total_projects: totalProjects,
      language_counts: languageCounts,
      total_security_issues: totalSecurityIssues,
      total_debt_issues: totalDebtIssues,
    });
  } catch (error) {
    console.error("[GetDashboardStats Error]:", error);
    return sendError(res, "Failed to fetch dashboard stats", 500);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  uploadZipProject,
  submitGithubProject,
  deleteProject,
  getDashboardStats,
};
