
const interviewRepository = require("../repositories/interviewRepository");
const applicationRepository = require("../repositories/applicationRepository");
const AppError = require("../utils/AppError");
const Interviewer = require("../models/Interviewer");
const Interview = require("../models/Interview");
const crypto = require("crypto");
const Candidate = require("../models/Candidate");
const Requisition = require("../models/Requisition");
const Application = require("../models/Application");
const {
  ensureBusinessId,
  setBusinessIdIfMissing,
  nextBusinessId,
  currentYear,
} = require("../utils/businessIds");
const withTransaction = require("../utils/withTransaction");


// Validate interviewer availability and overlapping bookings.
// interviewerId values in Interview.panel must match Interviewer.interviewerId.
const validateInterviewerAvailability = async (
  panel,
  scheduledAt,
  durationMinutes,
  excludeInterviewId = null
) => {
  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + Number(durationMinutes) * 60000);
  const ids = panel.map((member) => member.interviewerId);

  for (const interviewerId of ids) {
    const interviewer = await Interviewer.findOne({
      interviewerId,
      isActive: true,
    });

    if (!interviewer) {
      throw new AppError(`Interviewer ${interviewerId} not found or inactive`, 404);
    }

    const withinAvailability = (interviewer.availability || []).some(
      (slot) => new Date(slot.startTime) <= start && new Date(slot.endTime) >= end
    );

    if (!withinAvailability) {
      throw new AppError(`Interviewer ${interviewerId} is unavailable at the requested time`, 409);
    }

    const bookings = await Interview.find({
      _id: excludeInterviewId ? { $ne: excludeInterviewId } : { $exists: true },
      status: { $in: ["SCHEDULED", "RESCHEDULED"] },
      "panel.interviewerId": interviewerId,
      scheduledAt: {
        $lt: end,
        $gte: new Date(start.getTime() - 8 * 60 * 60 * 1000),
      },
    });

    const conflict = bookings.find((booking) => {
      const bookingStart = new Date(booking.scheduledAt);
      const bookingEnd = new Date(
        bookingStart.getTime() + Number(booking.durationMinutes) * 60000
      );
      return start < bookingEnd && end > bookingStart;
    });

    if (conflict) {
      throw new AppError(`Interviewer ${interviewerId} has a scheduling conflict`, 409);
    }
  }
};

const acquirePanelLocks = async (panel) => {
  const interviewerIds = [...new Set(panel.map((item) => item.interviewerId))].sort();
  const locks = [];
  const now = new Date();
  try {
    for (const interviewerId of interviewerIds) {
      const token = crypto.randomUUID();
      const locked = await Interviewer.findOneAndUpdate(
        {
          interviewerId,
          isActive: true,
          $or: [
            { scheduleLockExpiresAt: null },
            { scheduleLockExpiresAt: { $lte: now } },
          ],
        },
        {
          $set: {
            scheduleLockToken: token,
            scheduleLockExpiresAt: new Date(now.getTime() + 5 * 60000),
          },
        },
        { new: true }
      );
      if (!locked) {
        const activeInterviewer = await Interviewer.exists({
          interviewerId,
          isActive: true,
        });
        if (!activeInterviewer) {
          throw new AppError(
            `Interviewer ${interviewerId} not found or inactive`,
            404
          );
        }
        throw new AppError(
          `Interviewer ${interviewerId} is being scheduled concurrently`,
          409
        );
      }
      locks.push({ interviewerId, token });
    }
    return locks;
  } catch (error) {
    await releasePanelLocks(locks);
    throw error;
  }
};

const releasePanelLocks = async (locks) => {
  await Promise.all(
    locks.map(({ interviewerId, token }) =>
      Interviewer.updateOne(
        { interviewerId, scheduleLockToken: token },
        { $set: { scheduleLockToken: null, scheduleLockExpiresAt: null } }
      )
    )
  );
};

const createInterview = async (data) => {
  const application = await applicationRepository.findById(data.application);

  if (!application) {
    throw new AppError("Application not found", 404);
  }

  if (!["SHORTLISTED", "INTERVIEW"].includes(application.status)) {
    throw new AppError(
      "Application is not eligible for interviews",
      400
    );
  }
  const requisition = application.requisition;
  if (requisition?.status && requisition.status !== "OPEN") {
    throw new AppError("Interviews require an open requisition", 409);
  }
  const year = currentYear();
  const candidateId = await ensureBusinessId(
    Candidate,
    application.candidate,
    "candidateId",
    "candidate",
    "CAND-"
  );
  const requisitionId = await ensureBusinessId(
    Requisition,
    requisition,
    "requisitionId",
    `requisition:${year}`,
    `REQ-${year}-`
  );
  await setBusinessIdIfMissing(
    Application,
    application,
    "applicationId",
    `APP-${requisitionId}-${candidateId}`
  );

  if (new Date(data.scheduledAt) <= new Date()) {
    throw new AppError("Interview must be scheduled in the future", 400);
  }

  const existingRounds = await interviewRepository.findByApplication(
    data.application
  );

  if (existingRounds.some((interview) => interview.round === data.round)) {
    throw new AppError(
      "Interview round already exists for this application",
      409
    );
  }

  // Prevent duplicate panel members
  const panelIds = data.panel.map((member) => member.interviewerId);

  if (new Set(panelIds).size !== panelIds.length) {
    throw new AppError(
      "Duplicate interviewer in panel",
      400
    );
  }

  const locks = await acquirePanelLocks(data.panel);
  const durationMinutes = data.durationMinutes ?? 60;
  try {
    await validateInterviewerAvailability(
      data.panel,
      data.scheduledAt,
      durationMinutes
    );

    const interviewData = {
      ...data,
      durationMinutes,
      interviewId: await nextBusinessId(
        `interview:${year}`,
        `INT-${year}-`
      ),
      statusHistory: [
        {
          previousStatus: null,
          newStatus: "SCHEDULED",
          changedBy: data.scheduledBy,
          reason: "Interview scheduled",
          changedAt: new Date(),
        },
      ],
    };

    return await withTransaction(async (session) => {
      const currentApplication = await applicationRepository.findById(
        data.application,
        session
      );
      if (!currentApplication) {
        throw new AppError("Application not found", 404);
      }
      if (!["SHORTLISTED", "INTERVIEW"].includes(currentApplication.status)) {
        throw new AppError(
          "Application is no longer eligible for interviews",
          409
        );
      }
      if (
        currentApplication.requisition?.status &&
        currentApplication.requisition.status !== "OPEN"
      ) {
        throw new AppError("Interviews require an open requisition", 409);
      }

      if (currentApplication.status === "SHORTLISTED") {
        const updatedApplication = await applicationRepository.updateIfStatus(
          currentApplication._id,
          "SHORTLISTED",
          {
            status: "INTERVIEW",
            $push: {
              stageHistory: {
                stage: "INTERVIEW",
                previousStatus: "SHORTLISTED",
                newStatus: "INTERVIEW",
                changedBy: data.scheduledBy,
                remarks: "Interview scheduled",
                timestamp: new Date(),
              },
            },
          },
          session
        );
        if (!updatedApplication) {
          throw new AppError(
            "Application state changed concurrently; reload and retry",
            409
          );
        }
      }

      return interviewRepository.create(interviewData, session);
    });
  } finally {
    await releasePanelLocks(locks);
  }
};

const getAllInterviews = async (filter = {}) => {
  return interviewRepository.findAll(filter);
};

const getInterviewById = async (id) => {
  const interview = await interviewRepository.findById(id);

  if (!interview) {
    throw new AppError("Interview not found", 404);
  }

  return interview;
};

const rescheduleInterview = async (id, data) => {
  const interview = await getInterviewById(id);

  if (!["SCHEDULED", "RESCHEDULED"].includes(interview.status)) {
    throw new AppError(
      "Only scheduled interviews can be rescheduled",
      400
    );
  }

  if (new Date(data.scheduledAt) <= new Date()) {
    throw new AppError(
      "New interview date must be in the future",
      400
    );
  }

  const locks = await acquirePanelLocks(interview.panel);
  try {
    await validateInterviewerAvailability(
      interview.panel,
      data.scheduledAt,
      interview.durationMinutes,
      interview._id
    );

    return await interviewRepository.findByIdAndUpdate(id, {
      scheduledAt: data.scheduledAt,
      status: "RESCHEDULED",
      $push: {
        rescheduleHistory: {
          previousDate: interview.scheduledAt,
          newDate: data.scheduledAt,
          changedBy: data.changedBy,
          reason: data.reason,
          changedAt: new Date(),
        },
        statusHistory: {
          previousStatus: interview.status,
          newStatus: "RESCHEDULED",
          changedBy: data.changedBy,
          reason: data.reason,
          changedAt: new Date(),
        },
      },
    });
  } finally {
    await releasePanelLocks(locks);
  }
};

const completeInterview = async (
  id,
  result,
  notes = "",
  changedBy = "SYSTEM",
  interviewerId
) => {
  const interview = await getInterviewById(id);

  if (
    interviewerId &&
    !interview.panel.some((member) => member.interviewerId === interviewerId)
  ) {
    throw new AppError("Interviewer is not assigned to this interview", 403);
  }

  if (!["SCHEDULED", "RESCHEDULED"].includes(interview.status)) {
    throw new AppError(
      "Interview cannot be completed in its current state",
      400
    );
  }

  if (new Date(interview.scheduledAt) > new Date()) {
    throw new AppError(
      "Interview cannot be completed before its scheduled time",
      400
    );
  }

  return interviewRepository.findByIdAndUpdate(id, {
    status: "COMPLETED",
    result,
    notes,
    $push: {
      statusHistory: {
        previousStatus: interview.status,
        newStatus: "COMPLETED",
        changedBy,
        changedAt: new Date(),
      },
    },
  });
};

const cancelInterview = async (id, reason, changedBy = "SYSTEM") => {
  const interview = await getInterviewById(id);

  if (!["SCHEDULED", "RESCHEDULED"].includes(interview.status)) {
    throw new AppError(
      "Only scheduled interviews can be cancelled",
      400
    );
  }

  if (!reason || !reason.trim()) {
    throw new AppError("Cancellation reason is required", 400);
  }

  return interviewRepository.findByIdAndUpdate(id, {
    status: "CANCELLED",
    cancellationReason: reason.trim(),
    $push: {
      statusHistory: {
        previousStatus: interview.status,
        newStatus: "CANCELLED",
        changedBy,
        reason: reason.trim(),
        changedAt: new Date(),
      },
    },
  });
};

module.exports = {
  createInterview,
  getAllInterviews,
  getInterviewById,
  rescheduleInterview,
  completeInterview,
  cancelInterview,
  validateInterviewerAvailability,
};
