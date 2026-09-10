const Project = require("../models/Project");
const { sendError } = require("../utils/apiResponse");

/**
 * @desc    Get Dependency Graph for project
 * @route   GET /api/dependencies/:projectId
 * @access  Private
 */
const getDependencyGraph = async (req, res) => {
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
        nodes: [],
        edges: [],
        dependencies: [],
      },
    });
  } catch (error) {
    console.error("[DependencyGraph Error]:", error);
    return sendError(res, "Failed to retrieve dependency graph module data", 500);
  }
};

module.exports = { getDependencyGraph };
