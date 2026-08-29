const crypto = require("crypto");

const MockExternalRecord = require(
  "../models/MockExternalRecord"
);

const synchronizeApplication =
  async (req, res) => {
    try {
      const idempotencyKey =
        req.headers["idempotency-key"];

      if (!idempotencyKey) {
        return res.status(400).json({
          success: false,
          message:
            "Idempotency-Key header is required",
        });
      }

      const {
        applicationNumber,
        customer,
        title,
        priority,
        completedAt,
      } = req.body;

      if (
        !applicationNumber ||
        !customer ||
        !title ||
        !completedAt
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Required synchronization data is missing",
        });
      }

      /*
       * Simulate external-system latency.
       */
      const delay =
        Number(
          process.env.MOCK_EXTERNAL_DELAY_MS
        ) || 500;

      if (delay > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, delay)
        );
      }

      /*
       * Simulate occasional external failures.
       *
       * Example:
       * MOCK_EXTERNAL_FAILURE_RATE=0.3
       *
       * means approximately 30% of requests fail.
       */
      const failureRate =
        Number(
          process.env
            .MOCK_EXTERNAL_FAILURE_RATE
        ) || 0;

      if (
        Math.random() <
        failureRate
      ) {
        return res.status(503).json({
          success: false,
          message:
            "Mock external system is temporarily unavailable",
        });
      }

      /*
       * Idempotency check.
       *
       * If the same request arrives again,
       * return the original external record
       * instead of creating a duplicate.
       */
      const existingRecord =
        await MockExternalRecord.findOne({
          idempotencyKey,
        });

      if (existingRecord) {
        return res.status(200).json({
          success: true,
          message:
            "Application was already synchronized",
          data: {
            externalReference:
              existingRecord._id.toString(),
            duplicate: true,
          },
        });
      }

      const externalRecord =
        await MockExternalRecord.create({
          idempotencyKey,
          applicationNumber,
          customer: {
            name:
              customer.name,
            email:
              customer.email,
            phone:
              customer.phone,
          },
          title,
          priority,
          completedAt,
        });

      return res.status(200).json({
        success: true,
        message:
          "Application synchronized successfully",
        data: {
          externalReference:
            externalRecord._id.toString(),
          duplicate: false,
        },
      });
    } catch (error) {
      /*
       * Duplicate-key protection.
       *
       * This can occur if two identical requests
       * arrive concurrently.
       */
      if (error.code === 11000) {
        const existingRecord =
          await MockExternalRecord.findOne({
            idempotencyKey:
              req.headers["idempotency-key"],
          });

        if (existingRecord) {
          return res.status(200).json({
            success: true,
            message:
              "Application was already synchronized",
            data: {
              externalReference:
                existingRecord._id.toString(),
              duplicate: true,
            },
          });
        }
      }

      console.error(
        "Mock external synchronization error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Mock external system failed",
      });
    }
  };

module.exports = {
  synchronizeApplication,
};