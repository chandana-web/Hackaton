
const requisitionService = require("../services/requisitionService");

exports.createRequisition = async (req, res, next) => {
  try {
    const requisition = await requisitionService.createRequisition(
      req.body,
      req.user?.id || req.body.createdBy
    );

    res.status(201).json({
      success: true,
      message: "Requisition created successfully",
      data: requisition,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllRequisitions = async (req, res, next) => {
  try {
    const requisitions = await requisitionService.getAllRequisitions();

    res.status(200).json({
      success: true,
      results: requisitions.length,
      data: requisitions,
    });
  } catch (error) {
    next(error);
  }
};

exports.getRequisitionById = async (req, res, next) => {
  try {
    const requisition = await requisitionService.getRequisitionById(
      req.params.id
    );

    res.status(200).json({
      success: true,
      data: requisition,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateRequisition = async (req, res, next) => {
  try {
    const requisition = await requisitionService.updateRequisition(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Requisition updated successfully",
      data: requisition,
    });
  } catch (error) {
    next(error);
  }
};

exports.submitForApproval = async (req, res, next) => {
  try {
    const requisition = await requisitionService.submitForApproval(
      req.params.id,
      req.user?.id || req.body.actorId
    );

    res.status(200).json({
      success: true,
      message: "Requisition submitted for approval",
      data: requisition,
    });
  } catch (error) {
    next(error);
  }
};

exports.approveRequisition = async (req, res, next) => {
  try {
    const requisition = await requisitionService.approveRequisition(
      req.params.id,
      req.user?.id || req.body.actorId,
      req.body.remarks
    );

    res.status(200).json({
      success: true,
      message: "Requisition approved successfully",
      data: requisition,
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectRequisition = async (req, res, next) => {
  try {
    const requisition = await requisitionService.rejectRequisition(
      req.params.id,
      req.user?.id || req.body.actorId,
      req.body.remarks
    );

    res.status(200).json({
      success: true,
      message: "Requisition rejected",
      data: requisition,
    });
  } catch (error) {
    next(error);
  }
};

exports.openRequisition = async (req, res, next) => {
  try {
    const requisition = await requisitionService.openRequisition(
      req.params.id,
      req.user?.id || req.body.actorId
    );

    res.status(200).json({
      success: true,
      message: "Requisition opened successfully",
      data: requisition,
    });
  } catch (error) {
    next(error);
  }
};

exports.closeRequisition = async (req, res, next) => {
  try {
    const requisition = await requisitionService.closeRequisition(
      req.params.id,
      req.user?.id || req.body.actorId
    );

    res.status(200).json({
      success: true,
      message: "Requisition closed successfully",
      data: requisition,
    });
  } catch (error) {
    next(error);
  }
};

exports.holdRequisition = async (req, res, next) => {
  try {
    const requisition = await requisitionService.holdRequisition(
      req.params.id,
      req.user?.id || req.body.actorId
    );

    res.status(200).json({
      success: true,
      message: "Requisition placed on hold",
      data: requisition,
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelRequisition = async (req, res, next) => {
  try {
    const requisition = await requisitionService.cancelRequisition(
      req.params.id,
      req.user?.id || req.body.actorId
    );

    res.status(200).json({
      success: true,
      message: "Requisition cancelled",
      data: requisition,
    });
  } catch (error) {
    next(error);
  }
};
