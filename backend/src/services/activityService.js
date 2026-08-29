const Activity = require(
  "../models/Activity"
);

const createActivity = async ({
  application,
  type,
  description,
  performedBy = null,
  actorType = "USER",
  metadata = {},
}) => {
  return Activity.create({
    application,
    type,
    description,
    performedBy,
    actorType,
    metadata,
  });
};

module.exports = {
  createActivity,
};