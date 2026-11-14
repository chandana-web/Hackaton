jest.mock("../src/repositories/offerRepository", () => ({
  create: jest.fn(),
  findByApplication: jest.fn(),
  findById: jest.fn(),
  updateIfStatus: jest.fn(),
}));
jest.mock("../src/repositories/applicationRepository", () => ({
  findById: jest.fn(),
}));
jest.mock("../src/repositories/requisitionRepository", () => ({
  findById: jest.fn(),
}));
jest.mock("../src/repositories/interviewRepository", () => ({
  findByApplication: jest.fn(),
}));
jest.mock("../src/repositories/feedbackRepository", () => ({
  findByInterview: jest.fn(),
}));
jest.mock("../src/services/applicationService", () => ({
  updateApplicationStatus: jest.fn(),
}));
jest.mock("../src/utils/withTransaction", () =>
  jest.fn(async (operation) => operation({ transaction: true }))
);
jest.mock("../src/utils/businessIds", () => ({
  nextBusinessId: jest.fn().mockResolvedValue("OFF-2026-000001"),
  currentYear: jest.fn().mockReturnValue(2026),
}));

const offerRepository = require("../src/repositories/offerRepository");
const applicationRepository = require("../src/repositories/applicationRepository");
const requisitionRepository = require("../src/repositories/requisitionRepository");
const interviewRepository = require("../src/repositories/interviewRepository");
const feedbackRepository = require("../src/repositories/feedbackRepository");
const withTransaction = require("../src/utils/withTransaction");
const applicationService = require("../src/services/applicationService");
const offerService = require("../src/services/offerService");

const makeOfferInput = () => ({
  application: "application-1",
  position: "Engineer",
  department: "Engineering",
  salary: 120000,
  joiningDate: "2099-02-01T00:00:00.000Z",
  expiryDate: "2099-01-01T00:00:00.000Z",
  createdBy: "recruiter-1",
});

describe("offer workflow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    applicationRepository.findById.mockResolvedValue({
      _id: "application-1",
      status: "INTERVIEW",
      requisition: { _id: "requisition-1" },
    });
    offerRepository.findByApplication.mockResolvedValue(null);
    requisitionRepository.findById.mockResolvedValue({
      _id: "requisition-1",
      status: "OPEN",
      salaryMin: 80000,
      salaryMax: 150000,
    });
    interviewRepository.findByApplication.mockResolvedValue([
      {
        _id: "interview-1",
        status: "COMPLETED",
        panel: [{ interviewerId: "interviewer-1" }],
      },
    ]);
    feedbackRepository.findByInterview.mockResolvedValue([
      { interviewerId: "interviewer-1" },
    ]);
    offerRepository.create.mockImplementation(async (data) => data);
  });

  test("requires all interviewers to submit feedback before offer creation", async () => {
    feedbackRepository.findByInterview.mockResolvedValue([]);

    await expect(offerService.createOffer(makeOfferInput())).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(offerRepository.create).not.toHaveBeenCalled();
  });

  test("enforces the approved salary band and records the creator", async () => {
    await expect(
      offerService.createOffer({ ...makeOfferInput(), salary: 150001 })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(offerRepository.create).not.toHaveBeenCalled();

    const offer = await offerService.createOffer(makeOfferInput());
    expect(offer.createdBy).toBe("recruiter-1");
    expect(offer.status).toBe("DRAFT");
    expect(offer.statusHistory[0].newStatus).toBe("DRAFT");
  });

  test("updates application and offer inside a transaction when sending", async () => {
    offerRepository.findById.mockResolvedValue({
      _id: "offer-1",
      status: "APPROVED",
      expiryDate: "2099-01-01T00:00:00.000Z",
      application: { _id: "application-1" },
    });
    applicationService.updateApplicationStatus.mockResolvedValue({});
    offerRepository.updateIfStatus.mockResolvedValue({ status: "SENT" });

    const result = await offerService.sendOffer("offer-1", "recruiter-2");

    expect(withTransaction).toHaveBeenCalled();
    expect(applicationService.updateApplicationStatus).toHaveBeenCalledWith(
      "application-1",
      "OFFER",
      "Offer sent to candidate",
      "recruiter-2",
      { transaction: true }
    );
    expect(result.status).toBe("SENT");
  });

  test("does not mutate an offer when its application transition fails", async () => {
    offerRepository.findById.mockResolvedValue({
      _id: "offer-1",
      status: "APPROVED",
      expiryDate: "2099-01-01T00:00:00.000Z",
      application: { _id: "application-1" },
    });
    applicationService.updateApplicationStatus.mockRejectedValue(
      new Error("application changed")
    );

    await expect(offerService.sendOffer("offer-1", "recruiter-2")).rejects.toThrow(
      "application changed"
    );
    expect(offerRepository.updateIfStatus).not.toHaveBeenCalled();
  });
});
