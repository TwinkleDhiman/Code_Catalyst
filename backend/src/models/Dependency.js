const mongoose = require("mongoose");

const dependencySchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    // Separated package dependency inventory
    packageDependencies: {
      production: {
        type: Array,
        default: [],
      },
      development: {
        type: Array,
        default: [],
      },
    },
    // Source-code import graph nodes and edges
    nodes: {
      type: Array,
      default: [],
    },
    edges: {
      type: Array,
      default: [],
    },
    // Metrics summary
    summary: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Flat list of dependencies kept for backwards compatibility
    dependencies: {
      type: Array,
      default: [],
    },
    status: {
      type: String,
      default: "completed",
    },
  },
  {
    timestamps: true,
  }
);

const Dependency = mongoose.model("Dependency", dependencySchema);

module.exports = Dependency;
