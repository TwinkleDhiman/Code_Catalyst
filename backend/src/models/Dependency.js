const mongoose = require("mongoose");

const dependencySchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
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
