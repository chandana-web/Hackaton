
const interviewService = require("../services/interviewService");

exports.createInterview = async (req, res, next) => {
  try {
    const interview = await interviewService.createInterview({
      ...req.body,
      scheduledBy: req.user?.id || req.body.scheduledBy,
    });

    res.status(201).json({
      success: true,
      message: "Interview scheduled successfully",
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllInterviews = async (req, res, next) => {
  try {
    const filter = req.user?.role === "INTERVIEWER"
      ? { "panel.interviewerId": req.user.interviewerId }
      : {};
    const interviews = await interviewService.getAllInterviews(filter);

    res.status(200).json({
      success: true,
      results: interviews.length,
      data: interviews,
    });
  } catch (error) {
    next(error);
  }
};

exports.getInterviewById = async (req, res, next) => {
  try {
    const interview = await interviewService.getInterviewById(
      req.params.id
    );

    res.status(200).json({
      success: true,
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

exports.rescheduleInterview = async (req, res, next) => {
  try {
    const interview = await interviewService.rescheduleInterview(
      req.params.id,
      { ...req.body, changedBy: req.user?.id || req.body.changedBy }
    );

    res.status(200).json({
      success: true,
      message: "Interview rescheduled successfully",
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

exports.completeInterview = async (req, res, next) => {
  try {
    const interview = await interviewService.completeInterview(
      req.params.id,
      req.body.result,
      req.body.notes,
      req.user?.id || req.body.changedBy,
      req.user?.role === "INTERVIEWER" ? req.user.interviewerId : undefined
    );

    res.status(200).json({
      success: true,
      message: "Interview completed successfully",
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelInterview = async (req, res, next) => {
  try {
    const interview = await interviewService.cancelInterview(
      req.params.id,
      req.body.reason,
      req.user?.id || req.body.changedBy
    );

    res.status(200).json({
      success: true,
      message: "Interview cancelled successfully",
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};
