const Project = require("../models/Project");
const { sendError } = require("../utils/apiResponse");

/**
 * @desc    Get Technical Debt analysis for project
 * @route   GET /api/debt/:projectId
 * @access  Private
 */
const getTechnicalDebt = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findOne({ _id: projectId, user: req.user.id });

    if (!project) {
      return sendError(res, "Project not found or access denied", 404);
    }

    return res.json({
      success: true,
      data: {
        projectId: project._id,
        projectName: project.name,
        technicalDebt: {
          debtScore: 100,
          todoCount: 0,
          fixmeCount: 0,
          largeFileCount: 0,
          deepNestingCount: 0,
          issues: [],
        },
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
  } catch (error) {
    console.error("[TechnicalDebt Error]:", error);
    return sendError(res, "Failed to retrieve technical debt module data", 500);
  }
};

module.exports = { getTechnicalDebt };
