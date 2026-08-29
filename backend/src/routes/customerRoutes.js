const express = require("express");

const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  getCustomerApplications,
} = require("../controllers/customerController");

const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

/*
 * All customer operations require authentication.
 */

router.post(
  "/",
  authenticate,
  createCustomer
);

router.get(
  "/",
  authenticate,
  getCustomers
);

router.get(
  "/:id",
  authenticate,
  getCustomerById
);

router.patch(
  "/:id",
  authenticate,
  updateCustomer
);

router.get(
  "/:id/applications",
  authenticate,
  getCustomerApplications
);

module.exports = router;