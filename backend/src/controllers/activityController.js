const mongoose = require("mongoose");

const Activity = require(
  "../models/Activity"
);

const Application = require(
  "../models/Application"
);

const {
  canAccessApplication,
} = require(
  "../utils/applicationAccess"
);

const getApplicationActivities =
  async (req, res) => {
    try {
      const { id } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
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
            "You do not have permission to view this application",
        });
      }

      const activities =
        await Activity.find({
          application: id,
        })
          .populate(
            "performedBy",
            "name email role"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        data: {
          activities,
        },
      });
    } catch (error) {
      console.error(
        "Get application activities error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load activity history",
      });
    }
  };

module.exports = {
  getApplicationActivities,
};