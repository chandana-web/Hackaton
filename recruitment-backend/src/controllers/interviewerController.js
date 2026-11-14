const Interviewer = require("../models/Interviewer");

exports.listInterviewers = async (req, res, next) => {
  try {
    const interviewers = await Interviewer.find({ isActive: true })
      .select("interviewerId firstName lastName email availability")
      .sort({ lastName: 1, firstName: 1 });
    res.status(200).json({
      success: true,
      results: interviewers.length,
      data: interviewers,
    });
  } catch (error) {
    next(error);
  }
};

exports.createInterviewer = async (req, res, next) => {
  try {
    const interviewer = await Interviewer.create(req.body);
    res.status(201).json({
      success: true,
      message: "Interviewer created successfully",
      data: interviewer,
    });
  } catch (error) {
    next(error);
  }
};
