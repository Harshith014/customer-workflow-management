const WORKFLOW_TRANSITIONS = {
  NEW: [
    "WAITING_FOR_INFORMATION",
    "IN_PROGRESS",
  ],

  WAITING_FOR_INFORMATION: [
    "IN_PROGRESS",
  ],

  IN_PROGRESS: [
    "UNDER_REVIEW",
  ],

  UNDER_REVIEW: [
    "COMPLETED",
  ],

  COMPLETED: [],
};

const isValidTransition = (
  currentStage,
  nextStage
) => {
  const allowedStages =
    WORKFLOW_TRANSITIONS[currentStage] || [];

  return allowedStages.includes(nextStage);
};

const getAllowedTransitions = (currentStage) => {
  return WORKFLOW_TRANSITIONS[currentStage] || [];
};

module.exports = {
  WORKFLOW_TRANSITIONS,
  isValidTransition,
  getAllowedTransitions,
};