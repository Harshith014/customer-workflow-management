const mongoose = require("mongoose");

const WorkItem = require("../models/WorkItem");
const Application = require("../models/Application");
const User = require("../models/User");

const {
  createActivity,
} = require("../services/activityService");

const {
  canAccessApplication,
} = require("../utils/applicationAccess");

const {
  canAccessWorkItem,
} = require("../utils/workItemAccess");

const {
  isValidWorkItemTransition,
} = require("../services/workItemService");

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const createWorkItem = async (req, res) => {
  try {
    const {
      application,
      title,
      description,
      assignedTo,
      dueDate,
    } = req.body;

    if (!application || !title) {
      return res.status(400).json({
        success: false,
        message:
          "Application and title are required",
      });
    }

    if (!isValidObjectId(application)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    const existingApplication =
      await Application.findById(
        application
      );

    if (!existingApplication) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (
      !canAccessApplication(
        existingApplication,
        req.user
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to create work for this application",
      });
    }

    /*
     * Completed applications cannot receive new work.
     */
    if (
      existingApplication.stage ===
      "COMPLETED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot create work for a completed application",
      });
    }

    let finalAssignedTo =
      assignedTo || null;

    let finalAssignedTeam =
      existingApplication.assignedTeam ||
      null;

    /*
     * Executive-created work is automatically
     * assigned to the executive.
     */
    if (
      req.user.role === "EXECUTIVE"
    ) {
      finalAssignedTo = req.user._id;

      finalAssignedTeam =
        req.user.team?._id ||
        req.user.team ||
        existingApplication.assignedTeam ||
        null;
    }

    /*
     * Manager can only assign work within
     * their own team.
     */
    if (
      req.user.role === "MANAGER"
    ) {
      if (!req.user.team) {
        return res.status(400).json({
          success: false,
          message:
            "Manager is not assigned to a team",
        });
      }

      const managerTeamId =
        req.user.team?._id ||
        req.user.team;

      finalAssignedTeam =
        managerTeamId;

      if (finalAssignedTo) {
        const targetUser =
          await User.findById(
            finalAssignedTo
          );

        if (!targetUser) {
          return res.status(404).json({
            success: false,
            message:
              "Assigned user not found",
          });
        }

        if (!targetUser.isActive) {
          return res.status(400).json({
            success: false,
            message:
              "Cannot assign work to an inactive user",
          });
        }

        if (
          !targetUser.team ||
          targetUser.team.toString() !==
            managerTeamId.toString()
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Manager can only assign work to users in their own team",
          });
        }
      }
    }

    /*
     * Administrator can assign to any
     * active user.
     */
    if (
      req.user.role ===
      "ADMINISTRATOR"
    ) {
      if (finalAssignedTo) {
        const targetUser =
          await User.findById(
            finalAssignedTo
          );

        if (!targetUser) {
          return res.status(404).json({
            success: false,
            message:
              "Assigned user not found",
          });
        }

        if (!targetUser.isActive) {
          return res.status(400).json({
            success: false,
            message:
              "Cannot assign work to an inactive user",
          });
        }

        if (!finalAssignedTeam) {
          finalAssignedTeam =
            targetUser.team || null;
        }
      }
    }

    const workItem =
      await WorkItem.create({
        application,
        title: title.trim(),
        description:
          description?.trim() || "",
        assignedTo: finalAssignedTo,
        assignedTeam: finalAssignedTeam,
        dueDate: dueDate || null,
        createdBy: req.user._id,
      });

    await createActivity({
      application,
      type: "WORK_ITEM_CREATED",
      description:
        `Work item "${workItem.title}" was created`,
      performedBy: req.user._id,
      metadata: {
        workItemId: workItem._id,
      },
    });

    if (finalAssignedTo) {
      const targetUser =
        await User.findById(
          finalAssignedTo
        );

      await createActivity({
        application,
        type: "WORK_ITEM_ASSIGNED",
        description:
          `Work item "${workItem.title}" assigned to ${targetUser.name}`,
        performedBy: req.user._id,
        metadata: {
          workItemId: workItem._id,
          assignedTo: finalAssignedTo,
        },
      });
    }

    const populatedWorkItem =
      await WorkItem.findById(
        workItem._id
      )
        .populate(
          "application",
          "applicationNumber title stage priority"
        )
        .populate(
          "assignedTo",
          "name email role"
        )
        .populate(
          "assignedTeam",
          "name"
        )
        .populate(
          "createdBy",
          "name email"
        );

    return res.status(201).json({
      success: true,
      message:
        "Work item created successfully",
      data: {
        workItem: populatedWorkItem,
      },
    });
  } catch (error) {
    console.error(
      "Create work item error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create work item",
    });
  }
};

const getWorkItems = async (req, res) => {
  try {
    const {
      application,
      status,
      assignedTo,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = Math.max(
      parseInt(page, 10) || 1,
      1
    );

    const requestedLimit =
      parseInt(limit, 10) || 10;

    const pageLimit = Math.min(
      Math.max(requestedLimit, 1),
      100
    );

    const filter = {};

    /*
     * Authorization filter.
     */
    if (
      req.user.role === "EXECUTIVE"
    ) {
      filter.assignedTo =
        req.user._id;
    }

    if (
      req.user.role === "MANAGER"
    ) {
      if (!req.user.team) {
        return res.status(200).json({
          success: true,
          data: {
            workItems: [],
            pagination: {
              page: pageNumber,
              limit: pageLimit,
              total: 0,
              totalPages: 0,
            },
          },
        });
      }

      filter.assignedTeam =
        req.user.team?._id ||
        req.user.team;
    }

    if (application) {
      if (!isValidObjectId(application)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid application ID",
        });
      }

      filter.application =
        application;
    }

    if (status) {
      const validStatuses = [
        "TODO",
        "IN_PROGRESS",
        "COMPLETED",
      ];

      if (
        !validStatuses.includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid work item status",
        });
      }

      filter.status = status;
    }

    if (assignedTo) {
      if (!isValidObjectId(assignedTo)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid assigned user ID",
        });
      }

      /*
       * Executives cannot override their
       * own access filter.
       */
      if (
        req.user.role === "EXECUTIVE" &&
        assignedTo.toString() !==
          req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only view your assigned work",
        });
      }

      filter.assignedTo =
        assignedTo;
    }

    const skip =
      (pageNumber - 1) *
      pageLimit;

    const [
      workItems,
      total,
    ] = await Promise.all([
      WorkItem.find(filter)
        .populate(
          "application",
          "applicationNumber title stage priority"
        )
        .populate(
          "assignedTo",
          "name email role"
        )
        .populate(
          "assignedTeam",
          "name"
        )
        .populate(
          "createdBy",
          "name"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(pageLimit),

      WorkItem.countDocuments(
        filter
      ),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        workItems,
        pagination: {
          page: pageNumber,
          limit: pageLimit,
          total,
          totalPages: Math.ceil(
            total / pageLimit
          ),
        },
      },
    });
  } catch (error) {
    console.error(
      "Get work items error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve work items",
    });
  }
};

const getWorkItemById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid work item ID",
      });
    }

    const workItem =
      await WorkItem.findById(id)
        .populate(
          "application",
          "applicationNumber title stage priority"
        )
        .populate(
          "assignedTo",
          "name email role"
        )
        .populate(
          "assignedTeam",
          "name"
        )
        .populate(
          "createdBy",
          "name email"
        );

    if (!workItem) {
      return res.status(404).json({
        success: false,
        message:
          "Work item not found",
      });
    }

    if (
      !canAccessWorkItem(
        workItem,
        req.user
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to view this work item",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        workItem,
      },
    });
  } catch (error) {
    console.error(
      "Get work item error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve work item",
    });
  }
};

const updateWorkItem = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      version,
      title,
      description,
      dueDate,
    } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid work item ID",
      });
    }

    if (
      version === undefined ||
      version === null
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Work item version is required",
      });
    }

    const workItem =
      await WorkItem.findById(id);

    if (!workItem) {
      return res.status(404).json({
        success: false,
        message:
          "Work item not found",
      });
    }

    if (
      !canAccessWorkItem(
        workItem,
        req.user
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to update this work item",
      });
    }

    const update = {};

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Work item title cannot be empty",
        });
      }

      update.title =
        title.trim();
    }

    if (description !== undefined) {
      update.description =
        description.trim();
    }

    if (dueDate !== undefined) {
      update.dueDate =
        dueDate || null;
    }

    if (
      Object.keys(update).length ===
      0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No valid fields provided for update",
      });
    }

    const updatedWorkItem =
      await WorkItem.findOneAndUpdate(
        {
          _id: id,
          version: Number(version),
        },
        {
          $set: update,
          $inc: {
            version: 1,
          },
        },
        {
          new: true,
        }
      )
        .populate(
          "application",
          "applicationNumber title stage priority"
        )
        .populate(
          "assignedTo",
          "name email role"
        )
        .populate(
          "assignedTeam",
          "name"
        );

    if (!updatedWorkItem) {
      return res.status(409).json({
        success: false,
        message:
          "Work item was modified by another user. Please refresh and try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Work item updated successfully",
      data: {
        workItem:
          updatedWorkItem,
      },
    });
  } catch (error) {
    console.error(
      "Update work item error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update work item",
    });
  }
};

const assignWorkItem = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      assignedTo,
      version,
    } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid work item ID",
      });
    }

    if (
      version === undefined ||
      version === null
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Work item version is required",
      });
    }

    const workItem =
      await WorkItem.findById(id);

    if (!workItem) {
      return res.status(404).json({
        success: false,
        message:
          "Work item not found",
      });
    }

    if (
      req.user.role ===
      "EXECUTIVE"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Executives cannot assign work items",
      });
    }

    if (
      !canAccessWorkItem(
        workItem,
        req.user
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to assign this work item",
      });
    }

    let targetUser = null;

    if (assignedTo) {
      if (
        !isValidObjectId(
          assignedTo
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid assigned user ID",
        });
      }

      targetUser =
        await User.findById(
          assignedTo
        );

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message:
            "Assigned user not found",
        });
      }

      if (!targetUser.isActive) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot assign work to an inactive user",
        });
      }
    }

    if (
      req.user.role ===
      "MANAGER"
    ) {
      const managerTeamId =
        req.user.team?._id ||
        req.user.team;

      if (!managerTeamId) {
        return res.status(400).json({
          success: false,
          message:
            "Manager is not assigned to a team",
        });
      }

      if (
        targetUser &&
        (
          !targetUser.team ||
          targetUser.team.toString() !==
            managerTeamId.toString()
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Manager can only assign work within their own team",
        });
      }
    }

    const previousAssignedTo =
      workItem.assignedTo;

    const newAssignedTo =
      targetUser
        ? targetUser._id
        : null;

    const updatedWorkItem =
      await WorkItem.findOneAndUpdate(
        {
          _id: id,
          version: Number(version),
        },
        {
          $set: {
            assignedTo:
              newAssignedTo,
            assignedTeam:
              targetUser?.team ||
              workItem.assignedTeam ||
              null,
          },
          $inc: {
            version: 1,
          },
        },
        {
          new: true,
        }
      )
        .populate(
          "application",
          "applicationNumber title stage"
        )
        .populate(
          "assignedTo",
          "name email role"
        )
        .populate(
          "assignedTeam",
          "name"
        );

    if (!updatedWorkItem) {
      return res.status(409).json({
        success: false,
        message:
          "Work item was modified by another user. Please refresh and try again.",
      });
    }

    const activityDescription =
      targetUser
        ? `Work item "${workItem.title}" assigned to ${targetUser.name}`
        : `Work item "${workItem.title}" assignment removed`;

    await createActivity({
      application:
        workItem.application,
      type: "WORK_ITEM_ASSIGNED",
      description:
        activityDescription,
      performedBy: req.user._id,
      metadata: {
        workItemId:
          workItem._id,
        previousAssignedTo:
          previousAssignedTo ||
          null,
        newAssignedTo:
          newAssignedTo ||
          null,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Work item assignment updated successfully",
      data: {
        workItem:
          updatedWorkItem,
      },
    });
  } catch (error) {
    console.error(
      "Assign work item error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to assign work item",
    });
  }
};

const changeWorkItemStatus =
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        status: nextStatus,
        version,
      } = req.body;

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid work item ID",
        });
      }

      if (!nextStatus) {
        return res.status(400).json({
          success: false,
          message:
            "Target work item status is required",
        });
      }

      if (
        version === undefined ||
        version === null
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Work item version is required",
        });
      }

      const workItem =
        await WorkItem.findById(id);

      if (!workItem) {
        return res.status(404).json({
          success: false,
          message:
            "Work item not found",
        });
      }

      if (
        !canAccessWorkItem(
          workItem,
          req.user
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to update this work item",
        });
      }

      if (
        !isValidWorkItemTransition(
          workItem.status,
          nextStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid work item transition: ${workItem.status} → ${nextStatus}`,
        });
      }

      const previousStatus =
        workItem.status;

      const update = {
        status: nextStatus,
      };

      if (
        nextStatus ===
        "COMPLETED"
      ) {
        update.completedAt =
          new Date();
      }

      const updatedWorkItem =
        await WorkItem.findOneAndUpdate(
          {
            _id: id,
            version: Number(version),
            status: previousStatus,
          },
          {
            $set: update,
            $inc: {
              version: 1,
            },
          },
          {
            new: true,
          }
        )
          .populate(
            "application",
            "applicationNumber title stage"
          )
          .populate(
            "assignedTo",
            "name email role"
          )
          .populate(
            "assignedTeam",
            "name"
          );

      if (!updatedWorkItem) {
        return res.status(409).json({
          success: false,
          message:
            "Work item was modified by another user. Please refresh and try again.",
        });
      }

      const activityType =
        nextStatus === "COMPLETED"
          ? "WORK_ITEM_COMPLETED"
          : "APPLICATION_UPDATED";

      await createActivity({
        application:
          workItem.application,
        type: activityType,
        description:
          `Work item "${workItem.title}" status changed from ${previousStatus} to ${nextStatus}`,
        performedBy:
          req.user._id,
        metadata: {
          workItemId:
            workItem._id,
          previousStatus,
          newStatus:
            nextStatus,
        },
      });

      return res.status(200).json({
        success: true,
        message:
          "Work item status updated successfully",
        data: {
          workItem:
            updatedWorkItem,
        },
      });
    } catch (error) {
      console.error(
        "Change work item status error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update work item status",
      });
    }
  };

  module.exports = {
  createWorkItem,
  getWorkItems,
  getWorkItemById,
  updateWorkItem,
  assignWorkItem,
  changeWorkItemStatus,
};