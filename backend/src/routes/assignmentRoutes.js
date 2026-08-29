const express = require("express");

const {
  authenticate,
} = require(
  "../middleware/authMiddleware"
);

const {
  assignApplication,
} = require(
  "../controllers/assignmentController"
);

const router = express.Router();

router.patch(
  "/applications/:id/assignment",
  authenticate,
  assignApplication
);

module.exports = router;