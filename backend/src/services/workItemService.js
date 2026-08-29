const WORK_ITEM_TRANSITIONS = {
  TODO: [
    "IN_PROGRESS",
  ],

  IN_PROGRESS: [
    "COMPLETED",
  ],

  COMPLETED: [],
};

const isValidWorkItemTransition = (
  currentStatus,
  nextStatus
) => {
  const allowedStatuses =
    WORK_ITEM_TRANSITIONS[currentStatus] || [];

  return allowedStatuses.includes(
    nextStatus
  );
};

const getAllowedWorkItemTransitions = (
  currentStatus
) => {
  return (
    WORK_ITEM_TRANSITIONS[currentStatus] || []
  );
};

module.exports = {
  WORK_ITEM_TRANSITIONS,
  isValidWorkItemTransition,
  getAllowedWorkItemTransitions,
};