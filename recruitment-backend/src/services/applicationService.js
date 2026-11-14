
const applicationRepository = require("../repositories/applicationRepository");
const candidateRepository = require("../repositories/candidateRepository");
const requisitionRepository = require("../repositories/requisitionRepository");
const screeningRuleRepository = require("../repositories/screeningRuleRepository");
const AppError = require("../utils/AppError");
const calculateScreeningScore = require("../utils/screeningScore");
const Candidate = require("../models/Candidate");
const Requisition = require("../models/Requisition");
const { ensureBusinessId } = require("../utils/businessIds");

const createApplication = async (data) => {
  const candidate = await candidateRepository.findById(data.candidate);

  if (!candidate) {
    throw new AppError("Candidate not found", 404);
  }
  if (candidate.isActive === false) {
    throw new AppError("Inactive candidates cannot apply", 400);
  }

  const requisition = await requisitionRepository.findById(
    data.requisition
  );

  if (!requisition) {
    throw new AppError("Requisition not found", 404);
  }

  if (requisition.status !== "OPEN") {
    throw new AppError(
      "Applications are allowed only for open requisitions",
      400
    );
  }

  const existingApplication =
    await applicationRepository.findByCandidateAndRequisition(
      data.candidate,
      data.requisition
    );

  if (existingApplication) {
    throw new AppError(
      "Candidate has already applied for this requisition",
      409
    );
  }

  const year = new Date().getUTCFullYear();
  const candidateId = await ensureBusinessId(
    Candidate,
    candidate,
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

  return applicationRepository.create({
    applicationId: `APP-${requisitionId}-${candidateId}`,
    candidate: data.candidate,
    requisition: data.requisition,
    stageHistory: [
      {
        stage: "APPLICATION",
        previousStatus: null,
        newStatus: "APPLIED",
        changedBy: "SYSTEM",
        remarks: "Application created",
        timestamp: new Date(),
      },
    ],
  });
};

const getAllApplications = async (filter = {}) => {
  return applicationRepository.findAll(filter);
};

const getApplicationById = async (id, session) => {
  const application = await applicationRepository.findById(id, session);

  if (!application) {
    throw new AppError("Application not found", 404);
  }

  return application;
};

// Common application status transition
const updateApplicationStatus = async (
  applicationId,
  newStatus,
  remarks,
  userId = "SYSTEM",
  session
) => {
  const application = await getApplicationById(applicationId, session);

  const allowedTransitions = {
    APPLIED: ["SCREENING", "REJECTED", "WITHDRAWN"],
    SCREENING: ["REJECTED", "WITHDRAWN"],
    SHORTLISTED: ["REJECTED", "WITHDRAWN"],
    INTERVIEW: ["REJECTED", "WITHDRAWN"],
    OFFER: ["REJECTED", "WITHDRAWN"],
    HIRED: [],
    REJECTED: [],
    WITHDRAWN: [],
  };

  const allowed = allowedTransitions[application.status] || [];

  if (!allowed.includes(newStatus)) {
    throw new AppError(
      `Invalid application transition: ${application.status} → ${newStatus}`,
      400
    );
  }

  const update = {
    status: newStatus,
    $push: {
      stageHistory: {
        stage: newStatus,
        previousStatus: application.status,
        newStatus,
        changedBy: userId,
        remarks: remarks || "",
        timestamp: new Date(),
      },
    },
  };

  if (["REJECTED", "WITHDRAWN", "HIRED"].includes(newStatus)) {
    update.closedAt = new Date();
  }

  const updated = await applicationRepository.updateIfStatus(
    applicationId,
    application.status,
    update,
    session
  );
  if (!updated) {
    throw new AppError(
      "Application state changed concurrently; reload and retry",
      409
    );
  }
  return updated;
};

// Screen application

const screenApplication = async (id, data) => {
  const application = await getApplicationById(id);

  if (!["APPLIED", "SCREENING"].includes(application.status)) {
    throw new AppError(
      "Application cannot be screened at its current stage",
      400
    );
  }

  const now = new Date();

  let result;
  try {
    const rule = await screeningRuleRepository.findEffectiveForRequisition(
      application.requisition._id || application.requisition,
      now
    );
    result = calculateScreeningScore(
      application.candidate,
      application.requisition,
      rule
    );
  } catch (error) {
    if (error.message === "No job-related screening criteria are configured") {
      throw new AppError(error.message, 400);
    }
    throw error;
  }

  const decision =
    result.score >= result.passThreshold ? "PASS" : "FAIL";
  const newStatus = decision === "PASS" ? "SHORTLISTED" : "REJECTED";
  const update = {
    screening: {
      score: result.score,
      decision,
      remarks: data.remarks || "",
      screenedBy: data.screenedBy,
      screenedAt: now,
      criteriaBreakdown: result.criteriaBreakdown,
    },
    status: newStatus,
    $push: {
      stageHistory: {
        stage: "SCREENING",
        previousStatus: application.status,
        newStatus,
        changedBy: data.screenedBy,
        remarks: data.remarks || "",
        timestamp: now,
      },
    },
  };

  if (newStatus === "REJECTED") {
    update.closedAt = now;
  }

  const updated = await applicationRepository.updateIfStatus(
    id,
    application.status,
    update
  );
  if (!updated) {
    throw new AppError(
      "Application state changed concurrently; reload and retry",
      409
    );
  }
  return updated;
};


module.exports = {
  createApplication,
  getAllApplications,
  getApplicationById,
  screenApplication,
  updateApplicationStatus,
};
