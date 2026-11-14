jest.mock("../src/repositories/requisitionRepository", () => ({
  create: jest.fn(),
  findById: jest.fn(),
  updateIfStatus: jest.fn(),
}));
jest.mock("../src/repositories/applicationRepository", () => ({
  findAll: jest.fn(),
}));
jest.mock("../src/utils/businessIds", () => ({
  currentYear: () => 2030,
  nextBusinessId: jest.fn().mockResolvedValue("REQ-2030-000001"),
}));

const requisitionRepository = require("../src/repositories/requisitionRepository");
const applicationRepository = require("../src/repositories/applicationRepository");
const requisitionService = require("../src/services/requisitionService");

describe("requisition lifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("blocks closure while active applications remain", async () => {
    requisitionRepository.findById.mockResolvedValue({
      _id: "requisition-1",
      status: "OPEN",
    });
    applicationRepository.findAll.mockResolvedValue([{ _id: "app-1" }]);

    await expect(
      requisitionService.closeRequisition("requisition-1", "owner-1")
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(requisitionRepository.updateIfStatus).not.toHaveBeenCalled();
  });

  test("persists the authenticated creator on a new requisition", async () => {
    requisitionRepository.create.mockImplementation(async (data) => data);

    const requisition = await requisitionService.createRequisition(
      { title: "Platform Engineer" },
      "authenticated-user-1"
    );

    expect(requisitionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Platform Engineer",
        createdBy: "authenticated-user-1",
        status: "DRAFT",
      })
    );
    expect(requisition.createdBy).toBe("authenticated-user-1");
  });

  test("prevents a requester approving their own requisition", async () => {
    requisitionRepository.findById.mockResolvedValue({
      _id: "requisition-2",
      status: "PENDING_APPROVAL",
      createdBy: "requester-1",
    });

    await expect(
      requisitionService.approveRequisition(
        "requisition-2",
        "requester-1"
      )
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(requisitionRepository.updateIfStatus).not.toHaveBeenCalled();
  });
});
