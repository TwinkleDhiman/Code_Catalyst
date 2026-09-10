const AnalysisHistory = require("../models/AnalysisHistory");
const { sendSuccess, sendError } = require("../utils/apiResponse");

/**
 * @desc    Get Analysis History for project or user
 * @route   GET /api/history/:projectId?
 * @access  Private
 */
const getHistory = async (req, res) => {
  try {
    const { projectId } = req.params;
    const filter = { user: req.user.id };
    if (projectId) {
      filter.project = projectId;
    }

    const history = await AnalysisHistory.find(filter)
      .populate("project", "name")
      .sort({ timestamp: -1 });

    return sendSuccess(res, { history }, "Analysis history retrieved successfully");
  } catch (error) {
    console.error("[History Error]:", error);
    return sendError(res, "Failed to retrieve analysis history", 500);
  }
};

module.exports = { getHistory };
