const Team = require("../models/Team");
const User = require("../models/User");

const getTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("manager", "name email")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: teams.length,
      data: teams,
    });
  } catch (error) {
    console.error("Get teams error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve teams",
    });
  }
};

const createTeam = async (req, res) => {
  try {
    const { name, description, manager } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Team name is required",
      });
    }

    const existingTeam = await Team.findOne({
      name: name.trim(),
    });

    if (existingTeam) {
      return res.status(409).json({
        success: false,
        message: "A team with this name already exists",
      });
    }

    if (manager) {
      const managerUser = await User.findOne({
        _id: manager,
        role: "MANAGER",
      });

      if (!managerUser) {
        return res.status(400).json({
          success: false,
          message: "Specified manager is invalid",
        });
      }
    }

    const team = await Team.create({
      name: name.trim(),
      description: description?.trim() || "",
      manager: manager || null,
    });

    if (manager) {
      await User.findByIdAndUpdate(manager, {
        team: team._id,
      });
    }

    const populatedTeam = await Team.findById(team._id).populate(
      "manager",
      "name email"
    );

    return res.status(201).json({
      success: true,
      message: "Team created successfully",
      data: {
        team: populatedTeam,
      },
    });
  } catch (error) {
    console.error("Create team error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create team",
    });
  }
};

module.exports = {
  getTeams,
  createTeam,
};