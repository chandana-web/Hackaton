
const offerService = require("../services/offerService");

exports.createOffer = async (req, res, next) => {
  try {
    const offer = await offerService.createOffer(req.body, req.user?.id);

    res.status(201).json({
      success: true,
      message: "Offer created successfully",
      data: offer,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllOffers = async (req, res, next) => {
  try {
    const offers = await offerService.getAllOffers();

    res.status(200).json({
      success: true,
      results: offers.length,
      data: offers,
    });
  } catch (error) {
    next(error);
  }
};

exports.getOfferById = async (req, res, next) => {
  try {
    const offer = await offerService.getOfferById(req.params.id);

    res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (error) {
    next(error);
  }
};

exports.submitForApproval = async (req, res, next) => {
  try {
    const offer = await offerService.submitForApproval(
      req.params.id,
      req.user?.id || req.body.actorId
    );

    res.status(200).json({
      success: true,
      message: "Offer submitted for approval",
      data: offer,
    });
  } catch (error) {
    next(error);
  }
};

exports.approveOffer = async (req, res, next) => {
  try {
    const offer = await offerService.approveOffer(
      req.params.id,
      req.user?.id || req.body.actorId
    );

    res.status(200).json({
      success: true,
      message: "Offer approved successfully",
      data: offer,
    });
  } catch (error) {
    next(error);
  }
};

exports.sendOffer = async (req, res, next) => {
  try {
    const offer = await offerService.sendOffer(
      req.params.id,
      req.user?.id || req.body.actorId
    );

    res.status(200).json({
      success: true,
      message: "Offer sent successfully",
      data: offer,
    });
  } catch (error) {
    next(error);
  }
};

exports.acceptOffer = async (req, res, next) => {
  try {
    const offer = await offerService.acceptOffer(req.params.id);

    res.status(200).json({
      success: true,
      message: "Offer accepted successfully",
      data: offer,
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectOffer = async (req, res, next) => {
  try {
    const offer = await offerService.rejectOffer(
      req.params.id,
      req.body.rejectionReason
    );

    res.status(200).json({
      success: true,
      message: "Offer rejected",
      data: offer,
    });
  } catch (error) {
    next(error);
  }
};

exports.withdrawOffer = async (req, res, next) => {
  try {
    const offer = await offerService.withdrawOffer(
      req.params.id,
      req.user?.id || req.body.actorId
    );

    res.status(200).json({
      success: true,
      message: "Offer withdrawn successfully",
      data: offer,
    });
  } catch (error) {
    next(error);
  }
};

exports.expireOffer = async (req, res, next) => {
  try {
    const offer = await offerService.expireOffer(req.params.id);

    res.status(200).json({
      success: true,
      message: "Offer expired",
      data: offer,
    });
  } catch (error) {
    next(error);
  }
};
