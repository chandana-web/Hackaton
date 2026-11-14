jest.mock("mongoose", () => ({
  startSession: jest.fn(),
}));

const mongoose = require("mongoose");
const withTransaction = require("../src/utils/withTransaction");

describe("withTransaction", () => {
  test("explains when MongoDB is not configured as a replica set", async () => {
    const transactionError = Object.assign(
      new Error("Transaction numbers are only allowed on a replica set member or mongos"),
      { code: 20 }
    );
    const session = {
      withTransaction: jest.fn().mockRejectedValue(transactionError),
      endSession: jest.fn().mockResolvedValue(undefined),
    };
    mongoose.startSession.mockResolvedValue(session);

    await expect(withTransaction(async () => "unused")).rejects.toMatchObject({
      statusCode: 503,
      message: expect.stringContaining("Configure MongoDB as a replica set"),
    });
    expect(session.endSession).toHaveBeenCalled();
  });
});
