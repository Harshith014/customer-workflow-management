const express = require("express");

const {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  assignApplication,
  getApplicationActivities,
} = require("../controllers/applicationController");

const {
  authenticate,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  authenticate,
  createApplication
);

router.get(
  "/",
  authenticate,
  getApplications
);

router.get(
  "/:id",
  authenticate,
  getApplicationById
);

router.patch(
  "/:id",
  authenticate,
  updateApplication
);

router.patch(
  "/:id/assignment",
  authenticate,
  assignApplication
);

router.get(
  "/:id/activities",
  authenticate,
  getApplicationActivities
);

module.exports = router;