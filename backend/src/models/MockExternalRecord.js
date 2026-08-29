const mongoose = require("mongoose");

const mockExternalRecordSchema =
  new mongoose.Schema(
    {
      idempotencyKey: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },

      applicationNumber: {
        type: String,
        required: true,
        index: true,
      },

      customer: {
        name: String,
        email: String,
        phone: String,
      },

      title: {
        type: String,
        required: true,
      },

      priority: {
        type: String,
        required: true,
      },

      completedAt: {
        type: Date,
        required: true,
      },

      receivedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "MockExternalRecord",
  mockExternalRecordSchema
);