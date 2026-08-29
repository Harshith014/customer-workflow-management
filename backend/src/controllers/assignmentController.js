const mongoose = require("mongoose");

const Application = require(
  "../models/Application"
);

const User = require(
  "../models/User"
);

const {
  createActivity,
} = require(
  "../services/activityService"
);

const {
  canAssignApplication,
} = require(
  "../utils/applicationAccess"
);

const assignApplication =
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        assignedTo,
      } = req.body;

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
        !canAssignApplication(
          application,
          req.user
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to assign this application",
        });
      }

      let newUser = null;

      if (assignedTo) {
        newUser =
          await User.findById(
            assignedTo
          );

        if (!newUser) {
          return res.status(404).json({
            success: false,
            message:
              "Assigned user not found",
          });
        }

        if (
          newUser.role !==
          "EXECUTIVE"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Applications can only be assigned to executives",
          });
        }
      }

      const previousAssignee =
        application.assignedTo;

      application.assignedTo =
        newUser?._id || null;

      await application.save();

      const wasAssigned =
        Boolean(
          previousAssignee
        );

      const isAssigned =
        Boolean(
          newUser
        );

      let activityType =
        "APPLICATION_ASSIGNED";

      if (
        wasAssigned &&
        isAssigned
      ) {
        activityType =
          "APPLICATION_REASSIGNED";
      }

      const name =
        newUser
          ? `${newUser.name}`
          : "Unassigned";

      await createActivity({
        application:
          application._id,

        type:
          activityType,

        description:
          `Application assigned to ${name}`,

        performedBy:
          req.user._id,

        metadata: {
          previousAssignee,
          newAssignee:
            newUser?._id ||
            null,
        },
      });

      const populatedApplication =
        await Application.findById(
          application._id
        )
          .populate(
            "customer"
          )
          .populate(
            "assignedTo",
            "name email role"
          );

      return res.status(200).json({
        success: true,
        message:
          "Application assignment updated",
        data: {
          application:
            populatedApplication,
        },
      });
    } catch (error) {
      console.error(
        "Assignment error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update application assignment",
      });
    }
  };

module.exports = {
  assignApplication,
};