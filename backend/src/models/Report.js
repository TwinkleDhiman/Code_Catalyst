const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    format: {
      type: String,
      enum: ["pdf", "json", "csv"],
      default: "pdf",
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

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;
