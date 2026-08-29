const Application = require("../models/Application");

const generateApplicationNumber = async () => {
  const year = new Date().getFullYear();

  const prefix = `APP-${year}-`;

  const latestApplication = await Application.findOne({
    applicationNumber: {
      $regex: `^${prefix}`,
    },
  })
    .sort({ applicationNumber: -1 })
    .select("applicationNumber");

  let nextNumber = 1;

  if (latestApplication) {
    const currentNumber = parseInt(
      latestApplication.applicationNumber.split("-")[2],
      10
    );

    if (!Number.isNaN(currentNumber)) {
      nextNumber = currentNumber + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(6, "0")}`;
};

module.exports = {
  generateApplicationNumber,
};