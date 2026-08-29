const mongoose = require("mongoose");

const SyncRecord = require(
  "../models/SyncRecord"
);

const Application = require(
  "../models/Application"
);

const {
  canAccessApplication,
} = require(
  "../utils/applicationAccess"
);

const {
  synchronizeApplication,
} = require(
  "../services/syncService"
);

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const getApplicationSync =
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid application ID",
        });
      }

      const application =
        await Application.findById(id);

      if (!application) {
        return res.status(404).json({
          success: false,
          message:
            "Application not found",
        });
      }

      if (
        !canAccessApplication(
          application,
          req.user
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to view synchronization details",
        });
      }

      const syncRecord =
        await SyncRecord.findOne({
          application: id,
        });

      return res.status(200).json({
        success: true,
        data: {
          syncRecord,
        },
      });
    } catch (error) {
      console.error(
        "Get synchronization status error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to retrieve synchronization status",
      });
    }
  };

const retryApplicationSync =
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid application ID",
        });
      }

      const application =
        await Application.findById(id);

      if (!application) {
        return res.status(404).json({
          success: false,
          message:
            "Application not found",
        });
      }

      if (
        !canAccessApplication(
          application,
          req.user
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to retry synchronization",
        });
      }

      if (
        application.stage !==
        "COMPLETED"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only completed applications can be synchronized",
        });
      }

      const syncRecord =
        await SyncRecord.findOne({
          application: id,
        });

      if (!syncRecord) {
        return res.status(404).json({
          success: false,
          message:
            "Synchronization record not found",
        });
      }

      if (
        syncRecord.status ===
        "SUCCESS"
      ) {
        return res.status(200).json({
          success: true,
          message:
            "Application is already synchronized",
          data: {
            syncRecord,
          },
        });
      }

      syncRecord.status =
        "PENDING";

      syncRecord.nextRetryAt =
        null;

      syncRecord.lastError =
        null;

      await syncRecord.save();

      /*
       * Execute asynchronously so the user
       * doesn't wait for the external service.
       */
      setImmediate(() => {
        synchronizeApplication(
          syncRecord._id
        ).catch((error) => {
          console.error(
            "Manual synchronization error:",
            error
          );
        });
      });

      return res.status(202).json({
        success: true,
        message:
          "Synchronization retry scheduled",
      });
    } catch (error) {
      console.error(
        "Retry synchronization error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to retry synchronization",
      });
    }
  };

module.exports = {
  getApplicationSync,
  retryApplicationSync,
};