const Project = require("../models/Project");
const { sendError } = require("../utils/apiResponse");

/**
 * @desc    Get Architecture Visualization data for project
 * @route   GET /api/architecture/:projectId
 * @access  Private
 */
const getArchitecture = async (req, res) => {
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
        components: [],
        connections: [],
      },
    });
  } catch (error) {
    console.error("[Architecture Error]:", error);
    return sendError(res, "Failed to retrieve architecture visualization module data", 500);
  }
};

module.exports = { getArchitecture };
