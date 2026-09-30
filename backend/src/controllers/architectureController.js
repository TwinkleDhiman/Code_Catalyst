const fs = require("fs");
const mongoose = require("mongoose");
const AdmZip = require("adm-zip");
const Project = require("../models/Project");
const Analysis = require("../models/Analysis");
const { sendError } = require("../utils/apiResponse");
const { buildRepositoryTree } = require("../utils/analyzeZip");

/**
 * @desc    Get Architecture visualization and recursive tree for a project
 * @route   GET /api/architecture/:projectId?
 * @access  Private
 */
const getArchitecture = async (req, res) => {
  try {
    const { projectId } = req.params;

    // 1. Handle missing, undefined, or empty project ID
    if (!projectId || projectId === "undefined" || projectId === "null" || projectId === "") {
      const userProjects = await Project.find({ user: req.user.id }).sort({ createdAt: -1 });

      if (userProjects.length === 0) {
        // Normal clean empty state: user has not uploaded any repository yet
        return res.json({
          success: true,
          hasProject: false,
          hasAnalysis: false,
          message: "No repository uploaded yet",
          root: { name: "Repository", type: "folder", path: "" },
          tree: [],
          components: [],
          connections: [],
          summary: {
            files: 0,
            folders: 0,
            components: 0,
            categories: 0,
          },
          data: {
            hasProject: false,
            hasAnalysis: false,
            message: "No repository uploaded yet",
            root: { name: "Repository", type: "folder", path: "" },
            tree: [],
            components: [],
            connections: [],
            summary: { files: 0, folders: 0, components: 0, categories: 0 },
          },
        });
      }

      // User has projects, but none was selected in the URL
      return res.json({
        success: true,
        hasProject: true,
        hasAnalysis: false,
        message: "Select a repository to view its architecture",
        root: { name: userProjects[0].name, type: "folder", path: "" },
        tree: [],
        components: [],
        connections: [],
        summary: {
          files: 0,
          folders: 0,
          components: 0,
          categories: 0,
        },
        data: {
          hasProject: true,
          hasAnalysis: false,
          message: "Select a repository to view its architecture",
          root: { name: userProjects[0].name, type: "folder", path: "" },
          tree: [],
          components: [],
          connections: [],
          summary: { files: 0, folders: 0, components: 0, categories: 0 },
        },
      });
    }

    // 2. Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(404).json({
        success: false,
        message: "Repository not found.",
      });
    }

    // 3. Find project and enforce strict ownership checks
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Repository not found.",
      });
    }

    if (project.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this repository.",
      });
    }

    // 4. Retrieve architecture analysis from MongoDB
    const analysis = await Analysis.findOne({
      project: projectId,
      module: "architecture",
    }).sort({ createdAt: -1 });

    if (!analysis) {
      return res.json({
        success: true,
        hasProject: true,
        hasAnalysis: false,
        message:
          project.uploadType === "git"
            ? "Upload a ZIP file to generate architecture information from this repository."
            : "Architecture data is not available yet. Run repository analysis to generate the architecture structure.",
        root: { name: project.name, type: "folder", path: "" },
        tree: [],
        components: [],
        connections: [],
        summary: {
          files: project.fileCount || 0,
          folders: project.folderCount || 0,
          components: 0,
          categories: 0,
        },
        data: {
          projectId: project._id,
          projectName: project.name,
          hasProject: true,
          hasAnalysis: false,
          root: { name: project.name, type: "folder", path: "" },
          tree: [],
          components: [],
          connections: [],
          summary: { files: project.fileCount || 0, folders: project.folderCount || 0, components: 0, categories: 0 },
        },
      });
    }

    const summaryObj = analysis.summary || {};
    let root = summaryObj.root || { name: project.name, type: "folder", path: "" };
    let tree = summaryObj.tree || [];
    let components = summaryObj.components || [];
    let connections = summaryObj.connections || [];
    let summary = summaryObj.summary || {
      files: project.fileCount || 0,
      folders: project.folderCount || 0,
      components: components.length,
      categories: new Set(components.map((c) => c.category)).size,
    };

    // If tree is missing from stored record but ZIP file is available, generate dynamically
    if ((!tree || tree.length === 0) && project.filePath && fs.existsSync(project.filePath)) {
      try {
        const zip = new AdmZip(project.filePath);
        const built = buildRepositoryTree(zip.getEntries(), project.name);
        root = built.root;
        tree = built.tree;
        if (!components || components.length === 0) components = built.components;
        if (!connections || connections.length === 0) connections = built.connections;
        summary = built.summary;

        // Persist the generated tree so subsequent calls are instant
        analysis.summary = {
          ...analysis.summary,
          root,
          tree,
          components,
          connections,
          summary,
        };
        await Analysis.findByIdAndUpdate(analysis._id, { summary: analysis.summary });
      } catch (err) {
        console.error("[Architecture Tree Generation Error]:", err.message);
      }
    }

    return res.json({
      success: true,
      hasProject: true,
      hasAnalysis: true,
      root,
      tree,
      components,
      connections,
      summary,
      data: {
        projectId: project._id,
        projectName: project.name,
        root,
        tree,
        components,
        connections,
        summary,
      },
    });
  } catch (error) {
    console.error("[Architecture Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load architecture data. Something went wrong while loading this repository.",
    });
  }
};

module.exports = { getArchitecture };
