const express = require("express");

const {
  getUsers,
  createUser,
  updateUser,
} = require("../controllers/userController");

const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorize("ADMINISTRATOR", "MANAGER"),
  getUsers
);

router.post(
  "/",
  authenticate,
  authorize("ADMINISTRATOR"),
  createUser
);

router.patch(
  "/:id",
  authenticate,
  authorize("ADMINISTRATOR"),
  updateUser
);

module.exports = router;