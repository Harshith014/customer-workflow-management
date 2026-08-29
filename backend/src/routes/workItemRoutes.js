const express = require("express");

const {
  createWorkItem,
  getWorkItems,
  getWorkItemById,
  updateWorkItem,
  assignWorkItem,
  changeWorkItemStatus,
} = require("../controllers/workItemController");

const {
  authenticate,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  authenticate,
  createWorkItem
);

router.get(
  "/",
  authenticate,
  getWorkItems
);

router.get(
  "/:id",
  authenticate,
  getWorkItemById
);

router.patch(
  "/:id",
  authenticate,
  updateWorkItem
);

router.patch(
  "/:id/assignment",
  authenticate,
  assignWorkItem
);

router.patch(
  "/:id/status",
  authenticate,
  changeWorkItemStatus
);

module.exports = router;