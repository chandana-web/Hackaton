
const feedbackService = require("../services/feedbackService");

exports.submitFeedback = async (req, res, next) => {
  try {
    const feedback = await feedbackService.submitFeedback({
      ...req.body,
      interviewerId:
        req.user?.role === "INTERVIEWER"
          ? req.user.interviewerId
          : req.body.interviewerId,
      submittedBy: req.user?.id || req.body.submittedBy,
    });

    res.status(201).json({
      success: true,
      message: "Interview feedback submitted successfully",
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllFeedback = async (req, res, next) => {
  try {
    const filter = req.user?.role === "INTERVIEWER"
      ? { interviewerId: req.user.interviewerId }
      : {};
    const feedback = await feedbackService.getAllFeedback(filter);

    res.status(200).json({
      success: true,
      results: feedback.length,
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};

exports.getFeedbackById = async (req, res, next) => {
  try {
    const feedback = await feedbackService.getFeedbackById(
      req.params.id
    );

    res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};

exports.getFeedbackByInterview = async (req, res, next) => {
  try {
    const feedback = await feedbackService.getFeedbackByInterview(
      req.params.interviewId
    );

    res.status(200).json({
      success: true,
      results: feedback.length,
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};

exports.getFeedbackByApplication = async (req, res, next) => {
  try {
    const feedback = await feedbackService.getFeedbackByApplication(
      req.params.applicationId
    );

    res.status(200).json({
      success: true,
      results: feedback.length,
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};
