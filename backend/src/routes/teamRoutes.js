const express = require("express");

const {
  getTeams,
  createTeam,
} = require("../controllers/teamController");

const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize("ADMINISTRATOR", "MANAGER"),
  getTeams
);

router.post(
  "/",
  authenticate,
  authorize("ADMINISTRATOR"),
  createTeam
);

module.exports = router;