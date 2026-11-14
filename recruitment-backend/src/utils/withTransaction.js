const mongoose = require("mongoose");
const AppError = require("./AppError");

const withTransaction = async (operation) => {
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      result = await operation(session);
    });
    return result;
  } catch (error) {
    if (
      error?.code === 20 &&
      typeof error?.message === "string" &&
      /Transaction numbers are only allowed on a replica set member or mongos/i.test(error.message)
    ) {
      throw new AppError(
        "This workflow requires MongoDB transactions. Configure MongoDB as a replica set, then retry.",
        503
      );
    }
    throw error;
  } finally {
    await session.endSession();
  }
};

module.exports = withTransaction;
