const express = require("express");

const {
  changeApplicationStage,
} = require("../controllers/workflowController");

const {
  authenticate,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.patch(
  "/applications/:id/stage",
  authenticate,
  changeApplicationStage
);

module.exports = router;