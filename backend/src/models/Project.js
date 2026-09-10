const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    gitUrl: {
      type: String,
      default: "",
    },
    uploadType: {
      type: String,
      enum: ["zip", "git"],
      default: "zip",
    },
    filePath: {
      type: String,
      default: "",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "scanned"],
      default: "active",
    },
    fileCount: {
      type: Number,
      default: 0,
    },
    folderCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
