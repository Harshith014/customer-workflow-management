const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "APPLICATION_CREATED",
        "APPLICATION_ASSIGNED",
        "APPLICATION_REASSIGNED",
        "STATUS_CHANGED",
        "WORK_ITEM_CREATED",
        "WORK_ITEM_COMPLETED",
        "WORK_ITEM_ASSIGNED",
        "APPLICATION_UPDATED",
        "SYNC_STARTED",
        "SYNC_SUCCEEDED",
        "SYNC_FAILED",
      ],
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    actorType: {
      type: String,
      enum: ["USER", "SYSTEM"],
      default: "USER",
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Activity",
  activitySchema
);