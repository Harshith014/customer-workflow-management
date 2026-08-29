const express = require("express");

const {
  synchronizeApplication,
} = require(
  "../controllers/mockExternalController"
);

const router = express.Router();

router.post(
  "/applications/sync",
  synchronizeApplication
);

module.exports = router;