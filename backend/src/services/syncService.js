const crypto = require("crypto");

const Application = require("../models/Application");

const SyncRecord = require("../models/SyncRecord");

const { createActivity } = require("./activityService");

const generateIdempotencyKey = (applicationId) => {
  return crypto
    .createHash("sha256")
    .update(`application-completion:${applicationId}`)
    .digest("hex");
};

const createSyncRecord = async (applicationId) => {
  const idempotencyKey = generateIdempotencyKey(applicationId);

  const syncRecord = await SyncRecord.findOneAndUpdate(
    {
      application: applicationId,
    },
    {
      $setOnInsert: {
        application: applicationId,
        idempotencyKey,
        status: "PENDING",
        attempts: 0,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  return syncRecord;
};

const synchronizeApplication = async (syncRecordId) => {
  const syncRecord = await SyncRecord.findById(syncRecordId);

  if (!syncRecord) {
    throw new Error("Synchronization record not found");
  }

  /*
   * Do not synchronize something that has
   * already succeeded.
   */
  if (syncRecord.status === "SUCCESS") {
    return syncRecord;
  }

  /*
   * Claim the record.
   *
   * This prevents multiple workers from
   * processing the same record simultaneously.
   */
  const claimedRecord = await SyncRecord.findOneAndUpdate(
    {
      _id: syncRecordId,

      status: {
        $in: ["PENDING", "FAILED"],
      },

      $or: [
        {
          nextRetryAt: null,
        },
        {
          nextRetryAt: {
            $lte: new Date(),
          },
        },
      ],
    },
    {
      $set: {
        status: "PROCESSING",
        lastAttemptAt: new Date(),
      },

      $inc: {
        attempts: 1,
      },
    },
    {
      new: true,
    },
  );

  /*
   * Another worker may already be processing it.
   */
  if (!claimedRecord) {
    return null;
  }

  try {
    const application = await Application.findById(
      claimedRecord.application,
    ).populate("customer", "name email phone");

    if (!application) {
      throw new Error("Application no longer exists");
    }

    /*
     * Only completed applications should
     * reach the external system.
     */
    if (application.stage !== "COMPLETED") {
      throw new Error("Only completed applications can be synchronized");
    }

    const externalUrl = `${process.env.EXTERNAL_SYSTEM_URL}/applications/sync`;

    const response = await fetch(externalUrl, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        "Idempotency-Key": claimedRecord.idempotencyKey,
      },

      body: JSON.stringify({
        applicationNumber: application.applicationNumber,

        customer: {
          name: application.customer.name,

          email: application.customer.email,

          phone: application.customer.phone,
        },

        title: application.title,

        priority: application.priority,

        completedAt: application.completedAt,
      }),
    });

    const responseBody = await response.json();

    if (!response.ok) {
      throw new Error(
        responseBody.message || `External system returned ${response.status}`,
      );
    }

    const externalReference = responseBody.data?.externalReference || null;

    const completedRecord = await SyncRecord.findOneAndUpdate(
      {
        _id: claimedRecord._id,

        status: "PROCESSING",
      },
      {
        $set: {
          status: "SUCCESS",

          syncedAt: new Date(),

          nextRetryAt: null,

          lastError: null,

          externalReference,
        },
      },
      {
        new: true,
      },
    );

    await createActivity({
      application: application._id,

      type: "SYNC_SUCCEEDED",

      description:
        "Application successfully synchronized with the external system",

      performedBy: null,

      actorType: "SYSTEM",

      metadata: {
        syncRecordId: claimedRecord._id,

        externalReference,
      },
    });

    return completedRecord;
  } catch (error) {
    console.error("External synchronization failed:", error.message);

    const attempts = claimedRecord.attempts;

    /*
     * Exponential backoff:
     *
     * Attempt 1 → 1 minute
     * Attempt 2 → 2 minutes
     * Attempt 3 → 4 minutes
     * Attempt 4 → 8 minutes
     * ...
     *
     * Maximum delay = 1 hour
     */
    const retryDelay = Math.min(
      60 * 60 * 1000,
      Math.pow(2, Math.max(attempts - 1, 0)) * 60 * 1000,
    );

    const nextRetryAt = new Date(Date.now() + retryDelay);

    const failedRecord = await SyncRecord.findOneAndUpdate(
      {
        _id: claimedRecord._id,

        status: "PROCESSING",
      },
      {
        $set: {
          status: "FAILED",

          lastError: error.message,

          nextRetryAt,
        },
      },
      {
        new: true,
      },
    );

    await createActivity({
      application: claimedRecord.application,

      type: "SYNC_FAILED",

      description: `External synchronization failed: ${error.message}`,

      performedBy: null,

      actorType: "SYSTEM",

      metadata: {
        syncRecordId: claimedRecord._id,

        attempts,

        nextRetryAt,
      },
    }).catch(() => {});

    return failedRecord;
  }
};

module.exports = {
  generateIdempotencyKey,
  createSyncRecord,
  synchronizeApplication,
};
