require("dotenv").config();

const bcrypt = require("bcryptjs");

const connectDatabase = require("../config/db");

const User = require("../models/User");
const Team = require("../models/Team");

const seedUsers = async () => {
  try {
    await connectDatabase();

    console.log("Creating teams...");

    let processingTeam = await Team.findOne({
      name: "Application Processing",
    });

    if (!processingTeam) {
      processingTeam = await Team.create({
        name: "Application Processing",
        description: "Team responsible for processing customer applications",
      });
    }

    let reviewTeam = await Team.findOne({
      name: "Application Review",
    });

    if (!reviewTeam) {
      reviewTeam = await Team.create({
        name: "Application Review",
        description: "Team responsible for reviewing applications",
      });
    }

    const users = [
      {
        name: "System Administrator",
        email: "admin@example.com",
        password: "Admin@123",
        role: "ADMINISTRATOR",
        team: null,
      },
      {
        name: "John Manager",
        email: "manager@example.com",
        password: "Manager@123",
        role: "MANAGER",
        team: processingTeam._id,
      },
      {
        name: "Sarah Executive",
        email: "executive@example.com",
        password: "Executive@123",
        role: "EXECUTIVE",
        team: processingTeam._id,
      },
      {
        name: "Mike Executive",
        email: "executive2@example.com",
        password: "Executive@123",
        role: "EXECUTIVE",
        team: reviewTeam._id,
      },
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({
        email: userData.email,
      });

      if (existingUser) {
        console.log(`User already exists: ${userData.email}`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(
        userData.password,
        12
      );

      const user = await User.create({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        team: userData.team,
      });

      console.log(`Created user: ${user.email}`);

      if (
        user.role === "MANAGER" &&
        user.team
      ) {
        await Team.findByIdAndUpdate(user.team, {
          manager: user._id,
        });
      }
    }

    console.log("User seeding completed.");

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedUsers();