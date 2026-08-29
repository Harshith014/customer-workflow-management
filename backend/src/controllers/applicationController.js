const mongoose = require("mongoose");

const Application = require("../models/Application");
const Customer = require("../models/Customer");
const User = require("../models/User");
const Activity = require("../models/Activity");

const { generateApplicationNumber } = require("../services/applicationService");

const { createActivity } = require("../services/activityService");

const {
  buildApplicationAccessFilter,
  canAccessApplication,
} = require("../utils/applicationAccess");

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const createApplication = async (req, res) => {
  try {
    const { customer, title, description, priority, assignedTo, assignedTeam } =
      req.body;

    if (!customer || !title) {
      return res.status(400).json({
        success: false,
        message: "Customer and title are required",
      });
    }

    if (!isValidObjectId(customer)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const existingCustomer = await Customer.findById(customer);

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority",
      });
    }

    /*
     * Assignment rules:
     *
     * Administrator:
     * Can assign team/user.
     *
     * Manager:
     * Can assign only within their own team.
     *
     * Executive:
     * Cannot assign to somebody else.
     * Their newly created application is assigned to them.
     */

    let finalAssignedTo = assignedTo || null;
    let finalAssignedTeam = assignedTeam || null;

    if (req.user.role === "EXECUTIVE") {
      finalAssignedTo = req.user._id;
      finalAssignedTeam = req.user.team?._id || req.user.team || null;
    }

    if (req.user.role === "MANAGER") {
      if (!req.user.team) {
        return res.status(400).json({
          success: false,
          message: "Manager is not assigned to a team",
        });
      }

      const managerTeamId = req.user.team?._id || req.user.team;

      finalAssignedTeam = managerTeamId;

      if (finalAssignedTo) {
        const assignedUser = await User.findById(finalAssignedTo);

        if (!assignedUser) {
          return res.status(400).json({
            success: false,
            message: "Assigned user not found",
          });
        }

        if (assignedUser.team?.toString() !== managerTeamId.toString()) {
          return res.status(403).json({
            success: false,
            message:
              "Manager can only assign applications to users in their team",
          });
        }
      }
    }

    if (req.user.role === "ADMINISTRATOR") {
      if (finalAssignedTo) {
        const assignedUser = await User.findById(finalAssignedTo);

        if (!assignedUser) {
          return res.status(400).json({
            success: false,
            message: "Assigned user not found",
          });
        }

        if (!assignedUser.isActive) {
          return res.status(400).json({
            success: false,
            message: "Application cannot be assigned to an inactive user",
          });
        }

        if (!finalAssignedTeam && assignedUser.team) {
          finalAssignedTeam = assignedUser.team;
        }
      }
    }

    if (finalAssignedTeam) {
      if (!isValidObjectId(finalAssignedTeam)) {
        return res.status(400).json({
          success: false,
          message: "Invalid assigned team",
        });
      }
    }

    const applicationNumber = await generateApplicationNumber();

    const application = await Application.create({
      applicationNumber,
      customer,
      title: title.trim(),
      description: description?.trim() || "",
      priority: priority || "MEDIUM",
      assignedTo: finalAssignedTo,
      assignedTeam: finalAssignedTeam,
      createdBy: req.user._id,
    });

    await createActivity({
      application: application._id,
      type: "APPLICATION_CREATED",
      description: `Application ${application.applicationNumber} was created`,
      performedBy: req.user._id,
    });

    if (finalAssignedTo) {
      const assignedUser = await User.findById(finalAssignedTo);

      await createActivity({
        application: application._id,
        type: "APPLICATION_ASSIGNED",
        description: `Application assigned to ${assignedUser.name}`,
        performedBy: req.user._id,
        metadata: {
          assignedTo: finalAssignedTo,
        },
      });
    }

    const populatedApplication = await Application.findById(application._id)
      .populate("customer", "name email phone")
      .populate("assignedTo", "name email role")
      .populate("assignedTeam", "name")
      .populate("createdBy", "name email");

    return res.status(201).json({
      success: true,
      message: "Application created successfully",
      data: {
        application: populatedApplication,
      },
    });
  } catch (error) {
    console.error("Create application error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create application",
    });
  }
};

const getApplications = async (req, res) => {
  try {
    const {
      search,
      stage,
      priority,
      assignedTo,
      assignedTeam,
      customer,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);

    const requestedLimit = parseInt(limit, 10) || 10;

    const pageLimit = Math.min(Math.max(requestedLimit, 1), 100);

    const filter = {
      ...buildApplicationAccessFilter(req.user),
    };

    if (customer) {
      if (!isValidObjectId(customer)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer ID",
        });
      }

      filter.customer = customer;
    }

    if (stage) {
      const validStages = [
        "NEW",
        "WAITING_FOR_INFORMATION",
        "IN_PROGRESS",
        "UNDER_REVIEW",
        "COMPLETED",
      ];

      if (!validStages.includes(stage)) {
        return res.status(400).json({
          success: false,
          message: "Invalid application stage",
        });
      }

      filter.stage = stage;
    }

    if (priority) {
      const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: "Invalid application priority",
        });
      }

      filter.priority = priority;
    }

    if (assignedTo) {
      if (!isValidObjectId(assignedTo)) {
        return res.status(400).json({
          success: false,
          message: "Invalid assigned user ID",
        });
      }

      filter.assignedTo = assignedTo;
    }

    if (assignedTeam) {
      if (!isValidObjectId(assignedTeam)) {
        return res.status(400).json({
          success: false,
          message: "Invalid assigned team ID",
        });
      }

      filter.assignedTeam = assignedTeam;
    }

    if (search && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");

      filter.$or = [
        {
          applicationNumber: regex,
        },
        {
          title: regex,
        },
        {
          description: regex,
        },
      ];
    }

    const skip = (pageNumber - 1) * pageLimit;

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate("customer", "name email phone")
        .populate("assignedTo", "name email role")
        .populate("assignedTeam", "name")
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(pageLimit),

      Application.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        applications,
        pagination: {
          page: pageNumber,
          limit: pageLimit,
          total,
          totalPages: Math.ceil(total / pageLimit),
        },
      },
    });
  } catch (error) {
    console.error("Get applications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve applications",
    });
  }
};

const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    const application = await Application.findById(id)
      .populate("customer", "name email phone dateOfBirth address")
      .populate("assignedTo", "name email role team")
      .populate("assignedTeam", "name description")
      .populate("createdBy", "name email");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (!canAccessApplication(application, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this application",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        application,
      },
    });
  } catch (error) {
    console.error("Get application error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve application",
    });
  }
};

const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { version } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    if (version === undefined || version === null) {
      return res.status(400).json({
        success: false,
        message: "Application version is required for updates",
      });
    }

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (!canAccessApplication(application, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this application",
      });
    }

    /*
     * Executives can update relevant information on
     * applications assigned to them.
     *
     * Managers and administrators have broader access.
     */

    const { title, description, priority } = req.body;

    const update = {};

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Title cannot be empty",
        });
      }

      update.title = title.trim();
    }

    if (description !== undefined) {
      update.description = description.trim();
    }

    if (priority !== undefined) {
      const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: "Invalid priority",
        });
      }

      update.priority = priority;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    /*
     * Optimistic concurrency control.
     *
     * Only update if the version supplied by the
     * client still matches the database version.
     */

    const updatedApplication = await Application.findOneAndUpdate(
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
      type: "APPLICATION_UPDATED",
      description: "Application information was updated",
      performedBy: req.user._id,
      metadata: {
        fields: Object.keys(update),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Application updated successfully",
      data: {
        application: updatedApplication,
      },
    });
  } catch (error) {
    console.error("Update application error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update application",
    });
  }
};

const assignApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const { assignedTo, assignedTeam, version } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
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

    if (req.user.role === "EXECUTIVE") {
      return res.status(403).json({
        success: false,
        message: "Executives cannot assign or reassign applications",
      });
    }

    if (!canAccessApplication(application, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to reassign this application",
      });
    }

    let finalAssignedTo = assignedTo || null;

    let finalAssignedTeam = assignedTeam || null;

    if (req.user.role === "MANAGER") {
      if (!req.user.team) {
        return res.status(400).json({
          success: false,
          message: "Manager is not assigned to a team",
        });
      }

      const managerTeamId = req.user.team?._id || req.user.team;

      /*
       * Manager can only assign within own team.
       */
      finalAssignedTeam = managerTeamId;

      if (finalAssignedTo) {
        const targetUser = await User.findById(finalAssignedTo);

        if (!targetUser) {
          return res.status(404).json({
            success: false,
            message: "Assigned user not found",
          });
        }

        if (!targetUser.isActive) {
          return res.status(400).json({
            success: false,
            message: "Cannot assign to an inactive user",
          });
        }

        if (
          !targetUser.team ||
          targetUser.team.toString() !== managerTeamId.toString()
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Manager can only assign applications to users in their own team",
          });
        }
      }
    }

    if (req.user.role === "ADMINISTRATOR") {
      if (finalAssignedTo) {
        const targetUser = await User.findById(finalAssignedTo);

        if (!targetUser) {
          return res.status(404).json({
            success: false,
            message: "Assigned user not found",
          });
        }

        if (!targetUser.isActive) {
          return res.status(400).json({
            success: false,
            message: "Cannot assign to an inactive user",
          });
        }

        if (!finalAssignedTeam) {
          finalAssignedTeam = targetUser.team || null;
        }
      }
    }

    const wasPreviouslyAssigned = application.assignedTo;

    const updatedApplication = await Application.findOneAndUpdate(
      {
        _id: id,
        version: Number(version),
      },
      {
        $set: {
          assignedTo: finalAssignedTo,
          assignedTeam: finalAssignedTeam,
        },
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

    const targetUser = finalAssignedTo
      ? await User.findById(finalAssignedTo)
      : null;

    const activityType = wasPreviouslyAssigned
      ? "APPLICATION_REASSIGNED"
      : "APPLICATION_ASSIGNED";

    let description;

    if (targetUser) {
      description = wasPreviouslyAssigned
        ? `Application reassigned to ${targetUser.name}`
        : `Application assigned to ${targetUser.name}`;
    } else {
      description = "Application assignment removed";
    }

    await createActivity({
      application: id,
      type: activityType,
      description,
      performedBy: req.user._id,
      metadata: {
        previousAssignedTo: wasPreviouslyAssigned || null,
        newAssignedTo: finalAssignedTo || null,
        newAssignedTeam: finalAssignedTeam || null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Application assignment updated successfully",
      data: {
        application: updatedApplication,
      },
    });
  } catch (error) {
    console.error("Assign application error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to assign application",
    });
  }
};

const getApplicationActivities = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (!canAccessApplication(application, req.user)) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to view this application's history",
      });
    }

    const activities = await Activity.find({
      application: id,
    })
      .populate("performedBy", "name email role")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: activities.length,
      data: {
        activities,
      },
    });
  } catch (error) {
    console.error("Get application activities error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve application history",
    });
  }
};

module.exports = {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  assignApplication,
  getApplicationActivities,
};
