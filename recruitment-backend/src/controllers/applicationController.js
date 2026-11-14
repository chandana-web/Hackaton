
const applicationService = require("../services/applicationService");

exports.createApplication = async (req, res, next) => {
  try {
    const application = await applicationService.createApplication(req.body);

    res.status(201).json({
      success: true,
      message: "Application created successfully",
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllApplications = async (req, res, next) => {
  try {
    const applications = await applicationService.getAllApplications();

    res.status(200).json({
      success: true,
      results: applications.length,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

exports.getApplicationById = async (req, res, next) => {
  try {
    const application = await applicationService.getApplicationById(
      req.params.id
    );

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

exports.screenApplication = async (req, res, next) => {
  try {
    const application = await applicationService.screenApplication(
      req.params.id,
      { ...req.body, screenedBy: req.user?.id || req.body.screenedBy }
    );

    res.status(200).json({
      success: true,
      message: "Application screened successfully",
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const application = await applicationService.updateApplicationStatus(
      req.params.id,
      req.body.status,
      req.body.remarks,
      req.user?.id || req.body.changedBy
    );

    res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      data: application,
    });
  } catch (error) {
    next(error);
  }
};
