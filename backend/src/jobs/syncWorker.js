const SyncRecord = require(
  "../models/SyncRecord"
);

const {
  synchronizeApplication,
} = require(
  "../services/syncService"
);

let workerRunning = false;

const processPendingSynchronizations =
  async () => {
    if (workerRunning) {
      return;
    }

    workerRunning = true;

    try {
      const now = new Date();

      const records =
        await SyncRecord.find({
          status: {
            $in: [
              "PENDING",
              "FAILED",
            ],
          },

          $or: [
            {
              nextRetryAt: null,
            },

            {
              nextRetryAt: {
                $lte: now,
              },
            },
          ],
        })
          .sort({
            createdAt: 1,
          })
          .limit(10);

      for (const record of records) {
        try {
          await synchronizeApplication(
            record._id
          );
        } catch (error) {
          console.error(
            "Synchronization worker error:",
            error
          );
        }
      }
    } finally {
      workerRunning = false;
    }
  };

const startSyncWorker = () => {
  /*
   * Check once every 30 seconds.
   */
  setInterval(
    processPendingSynchronizations,
    30 * 1000
  );

  /*
   * Recover pending/failed records after
   * application startup.
   */
  processPendingSynchronizations().catch(
    (error) => {
      console.error(
        "Initial synchronization worker error:",
        error
      );
    }
  );

  console.log(
    "Synchronization worker started"
  );
};

module.exports = {
  startSyncWorker,
  processPendingSynchronizations,
};