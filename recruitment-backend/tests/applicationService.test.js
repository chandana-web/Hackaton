jest.mock("../src/repositories/applicationRepository", () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByCandidateAndRequisition: jest.fn(),
  updateIfStatus: jest.fn(),
}));
jest.mock("../src/repositories/candidateRepository", () => ({
  findById: jest.fn(),
}));
jest.mock("../src/repositories/requisitionRepository", () => ({
  findById: jest.fn(),
}));
jest.mock("../src/repositories/screeningRuleRepository", () => ({
  findEffectiveForRequisition: jest.fn(),
}));

const applicationRepository = require("../src/repositories/applicationRepository");
const screeningRuleRepository = require("../src/repositories/screeningRuleRepository");
const applicationService = require("../src/services/applicationService");

describe("application workflow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("does not allow generic status updates to create or accept offers", async () => {
    applicationRepository.findById.mockResolvedValue({
      _id: "application-1",
      status: "INTERVIEW",
    });
    await expect(
      applicationService.updateApplicationStatus(
        "application-1",
        "OFFER",
        "skip approvals",
        "actor-1"
      )
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(applicationRepository.updateIfStatus).not.toHaveBeenCalled();
  });

  test("rejects a repeated candidate and requisition application", async () => {
    const candidateRepository = require("../src/repositories/candidateRepository");
    const requisitionRepository = require("../src/repositories/requisitionRepository");
    candidateRepository.findById.mockResolvedValue({
      _id: "candidate-1",
      isActive: true,
    });
    requisitionRepository.findById.mockResolvedValue({
      _id: "requisition-1",
      status: "OPEN",
    });
    applicationRepository.findByCandidateAndRequisition.mockResolvedValue({
      _id: "existing-application",
    });

    await expect(
      applicationService.createApplication({
        candidate: "candidate-1",
        requisition: "requisition-1",
      })
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(applicationRepository.create).not.toHaveBeenCalled();
  });

  test("derives screening scores only from job skills and experience", async () => {
    applicationRepository.findById.mockResolvedValue({
      _id: "application-2",
      status: "APPLIED",
      candidate: { skills: ["Node.js"], experience: 4 },
      requisition: {
        _id: "requisition-2",
        skills: ["Node.js", "SQL"],
        experienceMin: 2,
      },
    });
    screeningRuleRepository.findEffectiveForRequisition.mockResolvedValue(null);
    applicationRepository.updateIfStatus.mockImplementation(
      async (_id, _status, update) => update
    );

    const result = await applicationService.screenApplication("application-2", {
      screenedBy: "reviewer-1",
      score: 100,
      decision: "PASS",
    });

    expect(result.screening.score).toBe(60);
    expect(result.screening.decision).toBe("FAIL");
    expect(result.status).toBe("REJECTED");
    expect(result.screening.criteriaBreakdown).toHaveLength(3);
  });
});
