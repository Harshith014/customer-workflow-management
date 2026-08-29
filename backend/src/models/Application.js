const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    applicationNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    stage: {
      type: String,
      enum: [
        "NEW",
        "WAITING_FOR_INFORMATION",
        "IN_PROGRESS",
        "UNDER_REVIEW",
        "COMPLETED",
      ],
      default: "NEW",
      index: true,
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    assignedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
      index: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    version: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

applicationSchema.index({
  applicationNumber: "text",
  title: "text",
  description: "text",
});

module.exports = mongoose.model("Application", applicationSchema);