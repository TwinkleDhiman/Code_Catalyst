const mongoose = require("mongoose");
const Project = require("../models/Project");
const Dependency = require("../models/Dependency");
const { sendError } = require("../utils/apiResponse");

/**
 * @desc    Get Dependency analysis and source import graph for a project
 * @route   GET /api/dependencies/:projectId
 * @access  Private
 */
const getDependencyGraph = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId || projectId === "undefined" || projectId === "null" || projectId === "") {
      const userProjects = await Project.find({ user: req.user.id }).sort({ createdAt: -1 });

      const emptySummary = { sourceFiles: 0, sourceNodes: 0, packageNodes: 0, sourceEdges: 0, productionDependencies: 0, developmentDependencies: 0 };
      const emptyPackageDeps = { production: [], development: [] };

      if (userProjects.length === 0) {
        return res.json({
          success: true,
          hasProject: false,
          packageDependencies: emptyPackageDeps,
          nodes: [],
          edges: [],
          summary: emptySummary,
          dependencies: [],
          data: {
            hasProject: false,
            message: "No repository uploaded yet",
            packageDependencies: emptyPackageDeps,
            nodes: [],
            edges: [],
            summary: emptySummary,
            dependencies: [],
            total: 0,
          },
        });
      }

      return res.json({
        success: true,
        hasProject: true,
        packageDependencies: emptyPackageDeps,
        nodes: [],
        edges: [],
        summary: emptySummary,
        dependencies: [],
        data: {
          hasProject: true,
          message: "Select a repository to view dependencies",
          packageDependencies: emptyPackageDeps,
          nodes: [],
          edges: [],
          summary: emptySummary,
          dependencies: [],
          total: 0,
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

    // Fetch stored dependency data from MongoDB
    const depRecord = await Dependency.findOne({ project: projectId }).sort({ createdAt: -1 });

    const packageDependencies = depRecord?.packageDependencies || {
      production: [],
      development: [],
    };

    // If packageDependencies is empty but legacy dependencies array exists, partition it
    if (
      (!packageDependencies.production || packageDependencies.production.length === 0) &&
      (!packageDependencies.development || packageDependencies.development.length === 0) &&
      depRecord?.dependencies?.length > 0
    ) {
      packageDependencies.production = depRecord.dependencies.filter(
        (d) => d.type === "production" || !d.type
      );
      packageDependencies.development = depRecord.dependencies.filter(
        (d) => d.type === "development"
      );
    }

    const nodes = depRecord?.nodes || [];
    const edges = depRecord?.edges || [];
    const dependencies =
      depRecord?.dependencies ||
      [...(packageDependencies.production || []), ...(packageDependencies.development || [])];

    const summary = depRecord?.summary || {
      sourceFiles: nodes.filter((n) => n.type === "file").length,
      sourceNodes: nodes.filter((n) => n.type === "file").length,
      packageNodes: nodes.filter((n) => n.type === "package").length,
      sourceEdges: edges.length,
      productionDependencies: packageDependencies.production?.length || 0,
      developmentDependencies: packageDependencies.development?.length || 0,
    };

    const hasData =
      (packageDependencies.production && packageDependencies.production.length > 0) ||
      (packageDependencies.development && packageDependencies.development.length > 0) ||
      nodes.length > 0;

    return res.json({
      success: true,
      packageDependencies,
      nodes,
      edges,
      summary,
      dependencies,
      data: {
        projectId: project._id,
        projectName: project.name,
        packageDependencies,
        nodes,
        edges,
        summary,
        dependencies,
        total: dependencies.length,
        message: !hasData
          ? project.uploadType === "git"
            ? "Upload a ZIP file to extract dependencies and generate the source import graph."
            : "No package.json or JavaScript/TypeScript source files were detected."
          : null,
      },
    });
  } catch (error) {
    console.error("[DependencyGraph Error]:", error);
    return sendError(res, "Failed to retrieve dependency data", 500);
  }
};

module.exports = { getDependencyGraph };
