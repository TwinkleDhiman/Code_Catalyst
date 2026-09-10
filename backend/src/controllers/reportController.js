const Project = require("../models/Project");
const Report = require("../models/Report");
const { sendError } = require("../utils/apiResponse");

/**
 * @desc    Get Report configuration / status for project
 * @route   GET /api/reports/:projectId
 * @access  Private
 */
const getReports = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findOne({ _id: projectId, user: req.user.id });

    if (!project) {
      return sendError(res, "Project not found or access denied", 404);
    }

    const reports = await Report.find({ project: projectId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: {
        project: {
          id: project._id,
          name: project.name,
        },
        reports,
      },
      project: {
        id: project._id,
        name: project.name,
      },
    });
  } catch (error) {
    console.error("[Reports Error]:", error);
    return sendError(res, "Failed to retrieve reports module data", 500);
  }
};

/**
 * @desc    Generate report export request
 * @route   POST /api/reports/:projectId/generate
 * @access  Private
 */
const generateReport = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { format } = req.body;

    const project = await Project.findOne({ _id: projectId, user: req.user.id });
    if (!project) {
      return sendError(res, "Project not found or access denied", 404);
    }

    const report = await Report.create({
      project: projectId,
      title: `${project.name} Static Code Analysis Report`,
      format: format || "pdf",
      status: "ready",
    });

    return res.json({
      success: true,
      data: {
        report,
      },
    });
  } catch (error) {
    console.error("[GenerateReport Error]:", error);
    return sendError(res, "Failed to generate report", 500);
  }
};

module.exports = {
  getReports,
  generateReport,
};
