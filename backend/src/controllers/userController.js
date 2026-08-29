const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Team = require("../models/Team");

const getUsers = async (req, res) => {
  try {
    const { role, team, search, isActive } = req.query;

    const filter = {};

    if (role) {
      filter.role = role;
    }

    if (team) {
      filter.team = team;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");

      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
      ];
    }

    const users = await User.find(filter)
      .select("-password")
      .populate("team", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve users",
    });
  }
};

const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      team,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, password and role are required",
      });
    }

    const validRoles = [
      "ADMINISTRATOR",
      "MANAGER",
      "EXECUTIVE",
    ];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    if (team) {
      const existingTeam = await Team.findById(team);

      if (!existingTeam) {
        return res.status(400).json({
          success: false,
          message: "Specified team does not exist",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      team: team || null,
    });

    const userResponse = await User.findById(user._id)
      .select("-password")
      .populate("team", "name");

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      role,
      team,
      isActive,
    } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (name !== undefined) {
      user.name = name.trim();
    }

    if (role !== undefined) {
      const validRoles = [
        "ADMINISTRATOR",
        "MANAGER",
        "EXECUTIVE",
      ];

      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user role",
        });
      }

      user.role = role;
    }

    if (team !== undefined) {
      if (team === null) {
        user.team = null;
      } else {
        const existingTeam = await Team.findById(team);

        if (!existingTeam) {
          return res.status(400).json({
            success: false,
            message: "Specified team does not exist",
          });
        }

        user.team = team;
      }
    }

    if (isActive !== undefined) {
      user.isActive = isActive;
    }

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select("-password")
      .populate("team", "name");

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
};