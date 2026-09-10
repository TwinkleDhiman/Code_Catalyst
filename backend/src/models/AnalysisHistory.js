const mongoose = require("mongoose");

const analysisHistorySchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    module: {
      type: String,
      default: "general",
    },
    status: {
      type: String,
      default: "completed",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const AnalysisHistory = mongoose.model("AnalysisHistory", analysisHistorySchema);

module.exports = AnalysisHistory;
