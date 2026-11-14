
const feedbackRepository = require("../repositories/feedbackRepository");
const interviewRepository = require("../repositories/interviewRepository");
const applicationRepository = require("../repositories/applicationRepository");
const AppError = require("../utils/AppError");
const { ensureBusinessId } = require("../utils/businessIds");
const Interview = require("../models/Interview");

const submitFeedback = async (data) => {
  const interview = await interviewRepository.findById(data.interview);

  if (!interview) {
    throw new AppError("Interview not found", 404);
  }

  if (interview.status !== "COMPLETED") {
    throw new AppError(
      "Feedback can only be submitted after interview completion",
      400
    );
  }

  const panelMember = interview.panel.find(
    (member) => member.interviewerId === data.interviewerId
  );

  if (!panelMember) {
    throw new AppError(
      "Interviewer is not assigned to this interview",
      403
    );
  }

  const interviewApplicationId = interview.application?._id
    ? interview.application._id.toString()
    : interview.application.toString();
  if (interviewApplicationId !== data.application) {
    throw new AppError(
      "Feedback application does not match interview application",
      400
    );
  }

  const interviewId = await ensureBusinessId(
    Interview,
    interview,
    "interviewId",
    `interview:${new Date().getUTCFullYear()}`,
    `INT-${new Date().getUTCFullYear()}-`
  );
  const existingFeedback = await feedbackRepository.findByInterview(
    data.interview
  );

  if (
    existingFeedback.some(
      (feedback) => feedback.interviewerId === data.interviewerId
    )
  ) {
    throw new AppError(
      "Feedback already submitted by this interviewer",
      409
    );
  }

  return feedbackRepository.create({
    ...data,
    interviewerName: panelMember.interviewerName,
    feedbackId: `FB-${interviewId}-${data.interviewerId}`,
    submittedBy: data.submittedBy || data.interviewerId,
  });
};

const getFeedbackById = async (id) => {
  const feedback = await feedbackRepository.findById(id);

  if (!feedback) {
    throw new AppError("Feedback not found", 404);
  }

  return feedback;
};

const getFeedbackByInterview = async (interviewId) => {
  const interview = await interviewRepository.findById(interviewId);

  if (!interview) {
    throw new AppError("Interview not found", 404);
  }

  return feedbackRepository.findByInterview(interviewId);
};

const getFeedbackByApplication = async (applicationId) => {
  const application = await applicationRepository.findById(applicationId);

  if (!application) {
    throw new AppError("Application not found", 404);
  }

  return feedbackRepository.findByApplication(applicationId);
};

const getAllFeedback = async (filter = {}) => {
  return feedbackRepository.findAll(filter);
};

module.exports = {
  submitFeedback,
  getFeedbackById,
  getFeedbackByInterview,
  getFeedbackByApplication,
  getAllFeedback,
};
