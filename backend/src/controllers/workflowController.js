const mongoose = require("mongoose");

const Application = require("../models/Application");

const { isValidTransition } = require("../services/workflowService");

const { createActivity } = require("../services/activityService");

const { canAccessApplication } = require("../utils/applicationAccess");

const {
  createSyncRecord,
  synchronizeApplication,
} = require("../services/syncService");

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const changeApplicationStage = async (req, res) => {
  try {
    const { id } = req.params;

    const { stage: nextStage, version } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    if (!nextStage) {
      return res.status(400).json({
        success: false,
        message: "Target application stage is required",
      });
    }

    if (version === undefined || version === null) {
      return res.status(400).json({
        success: false,
        message: "Application version is required",
      });
    }

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    /*
     * Authorization
     */
    if (!canAccessApplication(application, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this application",
      });
    }

    /*
     * Validate transition.
     */
    if (!isValidTransition(application.stage, nextStage)) {
      return res.status(400).json({
        success: false,
        message: `Invalid workflow transition: ${application.stage} → ${nextStage}`,
      });
    }

    /*
     * Completed applications are terminal.
     *
     * The transition service already prevents reopening,
     * but this explicit check makes the business rule clear.
     */
    if (application.stage === "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "Completed applications cannot be reopened",
      });
    }

    const previousStage = application.stage;

    const update = {
      stage: nextStage,
    };

    if (nextStage === "COMPLETED") {
      update.completedAt = new Date();
    }

    /*
     * Optimistic concurrency protection.
     *
     * Only update when the version received from
     * the client still matches the database.
     */
    const updatedApplication = await Application.findOneAndUpdate(
      {
        _id: id,
        version: Number(version),
        stage: previousStage,
      },
      {
        $set: update,
        $inc: {
          version: 1,
        },
      },
      {
        new: true,
      },
    )
      .populate("customer", "name email phone")
      .populate("assignedTo", "name email role")
      .populate("assignedTeam", "name");

    if (!updatedApplication) {
      return res.status(409).json({
        success: false,
        message:
          "Application was modified by another user. Please refresh and try again.",
      });
    }

    await createActivity({
      application: id,
      type: "STATUS_CHANGED",
      description: `Application status changed from ${previousStage} to ${nextStage}`,
      performedBy: req.user._id,
      metadata: {
        previousStage,
        newStage: nextStage,
      },
    });

    /*
     * Completion and external synchronization are
     * intentionally independent.
     *
     * If synchronization fails, the application
     * remains COMPLETED.
     */
    if (nextStage === "COMPLETED") {
      try {
        const syncRecord = await createSyncRecord(id);

        /*
         * Start synchronization without making the
         * completion request depend on the external
         * system.
         */
        setImmediate(() => {
          synchronizeApplication(syncRecord._id).catch((error) => {
            console.error("Background synchronization error:", error);
          });
        });
      } catch (syncRecordError) {
        /*
         * The application's completion has already
         * succeeded. Do not turn it into a failure
         * merely because synchronization tracking
         * encountered an error.
         */
        console.error(
          "Failed to create synchronization record:",
          syncRecordError,
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Application stage updated successfully",
      data: {
        application: updatedApplication,
      },
    });
  } catch (error) {
    console.error("Change application stage error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update application stage",
    });
  }
};

module.exports = {
  changeApplicationStage,
};
