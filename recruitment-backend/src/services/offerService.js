const offerRepository = require("../repositories/offerRepository");
const applicationRepository = require("../repositories/applicationRepository");
const requisitionRepository = require("../repositories/requisitionRepository");
const interviewRepository = require("../repositories/interviewRepository");
const feedbackRepository = require("../repositories/feedbackRepository");
const applicationService = require("./applicationService");
const AppError = require("../utils/AppError");
const withTransaction = require("../utils/withTransaction");
const { nextBusinessId, currentYear } = require("../utils/businessIds");

const getOfferOrFail = async (id, session) => {
  const offer = await offerRepository.findById(id, session);
  if (!offer) throw new AppError("Offer not found", 404);
  return offer;
};

const transitionOffer = async (
  offer,
  nextStatus,
  actor,
  changes = {},
  session
) => {
  const updated = await offerRepository.updateIfStatus(
    offer._id,
    offer.status,
    {
      ...changes,
      status: nextStatus,
      $push: {
        statusHistory: {
          previousStatus: offer.status,
          newStatus: nextStatus,
          changedBy: actor || "SYSTEM",
          changedAt: new Date(),
        },
      },
    },
    session
  );
  if (!updated) {
    throw new AppError("Offer state changed concurrently; reload and retry", 409);
  }
  return updated;
};

exports.createOffer = async (data, userId) => {
  const creatorId = userId || data.createdBy;
  if (!creatorId) throw new AppError("Offer creator is required", 400);

  const application = await applicationRepository.findById(data.application);
  if (!application) throw new AppError("Application not found", 404);
  if (application.status !== "INTERVIEW") {
    throw new AppError(
      "Offer can only be created for INTERVIEW-stage applications",
      400
    );
  }

  const existing = await offerRepository.findByApplication(data.application);
  if (existing) {
    throw new AppError("Offer already exists for this application", 409);
  }

  const offerDate = new Date(data.offerDate || Date.now());
  const expiryDate = new Date(data.expiryDate);
  const joiningDate = new Date(data.joiningDate);
  if (!Number.isFinite(expiryDate.getTime()) || expiryDate <= offerDate) {
    throw new AppError("Expiry date must be after the offer date", 400);
  }
  if (!Number.isFinite(joiningDate.getTime()) || joiningDate <= offerDate) {
    throw new AppError("Joining date must be after the offer date", 400);
  }

  const requisitionId =
    application.requisition._id || application.requisition;
  const requisition = await requisitionRepository.findById(requisitionId);
  if (!requisition) {
    throw new AppError("Application requisition not found", 404);
  }
  if (requisition.status !== "OPEN") {
    throw new AppError("Offers require an open requisition", 409);
  }
  if (requisition.salaryMin != null && data.salary < requisition.salaryMin) {
    throw new AppError(
      `Offer salary is below approved minimum (${requisition.salaryMin})`,
      400
    );
  }
  if (requisition.salaryMax != null && data.salary > requisition.salaryMax) {
    throw new AppError(
      `Offer salary exceeds approved maximum (${requisition.salaryMax})`,
      400
    );
  }

  const interviews = await interviewRepository.findByApplication(
    application._id
  );
  const requiredInterviews = interviews.filter(
    (interview) => interview.status !== "CANCELLED"
  );
  if (
    !requiredInterviews.length ||
    requiredInterviews.some((interview) => interview.status !== "COMPLETED")
  ) {
    throw new AppError(
      "All scheduled interview rounds must be completed before creating an offer",
      409
    );
  }
  for (const interview of requiredInterviews) {
    const feedback = await feedbackRepository.findByInterview(interview._id);
    const submittedIds = new Set(feedback.map((item) => item.interviewerId));
    if (interview.panel.some((member) => !submittedIds.has(member.interviewerId))) {
      throw new AppError(
        `Required feedback is missing for interview ${interview._id}`,
        409
      );
    }
  }

  return offerRepository.create({
    offerId: await nextBusinessId(
      `offer:${currentYear()}`,
      `OFF-${currentYear()}-`
    ),
    application: application._id,
    position: requisition.title,
    department: requisition.department,
    salary: data.salary,
    currency: requisition.currency || data.currency || "INR",
    joiningDate,
    offerDate,
    expiryDate,
    createdBy: creatorId,
    status: "DRAFT",
    statusHistory: [
      {
        previousStatus: null,
        newStatus: "DRAFT",
        changedBy: creatorId,
        remarks: "Offer created",
        changedAt: new Date(),
      },
    ],
  });
};

exports.getAllOffers = async () => offerRepository.findAll();
exports.getOfferById = async (id) => getOfferOrFail(id);

exports.submitForApproval = async (id, actor = "SYSTEM") => {
  const offer = await getOfferOrFail(id);
  if (offer.status !== "DRAFT") {
    throw new AppError("Only DRAFT offers can be submitted", 400);
  }
  return transitionOffer(offer, "PENDING_APPROVAL", actor);
};

exports.approveOffer = async (id, approverId) => {
  if (!approverId) throw new AppError("Approver identity is required", 400);
  const offer = await getOfferOrFail(id);
  if (offer.status !== "PENDING_APPROVAL") {
    throw new AppError("Offer is not pending approval", 400);
  }
  if (offer.createdBy === approverId) {
    throw new AppError("Offer creator cannot approve their own offer", 403);
  }
  return transitionOffer(offer, "APPROVED", approverId, {
    approvedBy: approverId,
    approvedAt: new Date(),
  });
};

exports.sendOffer = async (id, actor = "SYSTEM") =>
  withTransaction(async (session) => {
    const offer = await getOfferOrFail(id, session);
    if (offer.status !== "APPROVED") {
      throw new AppError("Only APPROVED offers can be sent", 400);
    }
    if (new Date(offer.expiryDate) <= new Date()) {
      throw new AppError("Offer has expired", 400);
    }
    const applicationId = offer.application._id || offer.application;
    await applicationService.updateApplicationStatus(
      applicationId,
      "OFFER",
      "Offer sent to candidate",
      actor,
      session
    );
    return transitionOffer(
      offer,
      "SENT",
      actor,
      { sentAt: new Date() },
      session
    );
  });

exports.acceptOffer = async (id) => {
  let expired = false;
  const offer = await withTransaction(async (session) => {
    const current = await getOfferOrFail(id, session);
    if (current.status !== "SENT") {
      throw new AppError("Only SENT offers can be accepted", 400);
    }
    const applicationId = current.application._id || current.application;
    if (new Date(current.expiryDate) <= new Date()) {
      await applicationService.updateApplicationStatus(
        applicationId,
        "REJECTED",
        "Offer expired before acceptance",
        "SYSTEM",
        session
      );
      expired = true;
      return transitionOffer(
        current,
        "EXPIRED",
        "SYSTEM",
        { respondedAt: new Date() },
        session
      );
    }
    await applicationService.updateApplicationStatus(
      applicationId,
      "HIRED",
      "Candidate accepted offer",
      "CANDIDATE",
      session
    );
    return transitionOffer(
      current,
      "ACCEPTED",
      "CANDIDATE",
      { respondedAt: new Date() },
      session
    );
  });
  if (expired) throw new AppError("Offer has expired", 400);
  return offer;
};

exports.rejectOffer = async (id, reason) => {
  if (!reason || !reason.trim()) {
    throw new AppError("Rejection reason is required", 400);
  }
  return withTransaction(async (session) => {
    const offer = await getOfferOrFail(id, session);
    if (offer.status !== "SENT") {
      throw new AppError("Only SENT offers can be rejected", 400);
    }
    const applicationId = offer.application._id || offer.application;
    await applicationService.updateApplicationStatus(
      applicationId,
      "REJECTED",
      "Candidate declined offer",
      "CANDIDATE",
      session
    );
    return transitionOffer(
      offer,
      "REJECTED",
      "CANDIDATE",
      {
        rejectionReason: reason.trim(),
        respondedAt: new Date(),
      },
      session
    );
  });
};

exports.withdrawOffer = async (id, actor = "SYSTEM") =>
  withTransaction(async (session) => {
    const offer = await getOfferOrFail(id, session);
    if (!["APPROVED", "SENT"].includes(offer.status)) {
      throw new AppError(
        "Only APPROVED or SENT offers can be withdrawn",
        400
      );
    }
    if (offer.status === "SENT") {
      await applicationService.updateApplicationStatus(
        offer.application._id || offer.application,
        "WITHDRAWN",
        "Offer withdrawn",
        actor,
        session
      );
    }
    return transitionOffer(offer, "WITHDRAWN", actor, {}, session);
  });

exports.expireOffer = async (id, actor = "SYSTEM") =>
  withTransaction(async (session) => {
    const offer = await getOfferOrFail(id, session);
    if (offer.status !== "SENT") {
      throw new AppError("Only SENT offers can expire", 400);
    }
    if (new Date(offer.expiryDate) > new Date()) {
      throw new AppError("Offer expiry date has not been reached", 400);
    }
    await applicationService.updateApplicationStatus(
      offer.application._id || offer.application,
      "REJECTED",
      "Offer expired",
      actor,
      session
    );
    return transitionOffer(
      offer,
      "EXPIRED",
      actor,
      { respondedAt: new Date() },
      session
    );
  });
