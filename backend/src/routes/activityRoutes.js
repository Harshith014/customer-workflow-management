const express = require("express");

const {
  authenticate,
} = require(
  "../middleware/authMiddleware"
);

const {
  getApplicationActivities,
} = require(
  "../controllers/activityController"
);

const router = express.Router();

router.get(
  "/applications/:id/activities",
  authenticate,
  getApplicationActivities
);

module.exports = router;