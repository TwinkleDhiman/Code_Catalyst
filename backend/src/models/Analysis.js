const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    module: {
      type: String,
      required: true,
      enum: ["technical-debt", "security", "dependency", "architecture"],
    },
    status: {
      type: String,
      default: "completed",
    },
    findings: {
      type: Array,
      default: [],
    },
    score: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Analysis = mongoose.model("Analysis", analysisSchema);

module.exports = Analysis;
