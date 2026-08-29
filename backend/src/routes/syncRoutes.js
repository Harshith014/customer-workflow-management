const express = require("express");

const {
  getApplicationSync,
  retryApplicationSync,
} = require(
  "../controllers/syncController"
);

const {
  authenticate,
} = require(
  "../middleware/authMiddleware"
);

const router = express.Router();

router.get(
  "/applications/:id/sync",
  authenticate,
  getApplicationSync
);

router.post(
  "/applications/:id/sync/retry",
  authenticate,
  retryApplicationSync
);

module.exports = router;