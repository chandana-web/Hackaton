jest.mock("../src/models/Interviewer", () => ({
  findOne: jest.fn(),
}));
jest.mock("../src/models/Interview", () => ({
  find: jest.fn(),
}));
jest.mock("../src/repositories/applicationRepository", () => ({}));
jest.mock("../src/repositories/interviewRepository", () => ({}));

const Interviewer = require("../src/models/Interviewer");
const Interview = require("../src/models/Interview");
const interviewRepository = require("../src/repositories/interviewRepository");
const interviewService = require("../src/services/interviewService");

describe("interviewer scheduling checks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("rejects an overlapping booking for the same interviewer", async () => {
    Interviewer.findOne.mockResolvedValue({
      availability: [
        {
          startTime: new Date("2030-01-01T09:00:00.000Z"),
          endTime: new Date("2030-01-01T17:00:00.000Z"),
        },
      ],
    });
    Interview.find.mockResolvedValue([
      {
        scheduledAt: new Date("2030-01-01T10:00:00.000Z"),
        durationMinutes: 60,
      },
    ]);

    await expect(
      interviewService.validateInterviewerAvailability(
        [{ interviewerId: "interviewer-1" }],
        new Date("2030-01-01T10:30:00.000Z"),
        45
      )
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  test("prevents an interviewer from completing an interview they are not assigned to", async () => {
    interviewRepository.findById = jest.fn().mockResolvedValue({
      status: "SCHEDULED",
      scheduledAt: new Date("2020-01-01T10:00:00.000Z"),
      panel: [{ interviewerId: "interviewer-1" }],
    });
    interviewRepository.findByIdAndUpdate = jest.fn();

    await expect(
      interviewService.completeInterview(
        "interview-id",
        "PASS",
        "",
        "user-id",
        "interviewer-2"
      )
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(interviewRepository.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});
