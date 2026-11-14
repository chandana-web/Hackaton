
const candidateService = require("../services/candidateService");

exports.createCandidate = async (req, res, next) => {
  try {
    const candidate = await candidateService.createCandidate(req.body);

    res.status(201).json({
      success: true,
      message: "Candidate created successfully",
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllCandidates = async (req, res, next) => {
  try {
    const candidates = await candidateService.getAllCandidates(req.query);
    const pagination = await candidateService.getCandidatePagination(req.query);

    res.status(200).json({
      success: true,
      results: candidates.length,
      pagination,
      data: candidates,
    });
  } catch (error) {
    next(error);
  }
};

exports.getCandidateById = async (req, res, next) => {
  try {
    const candidate = await candidateService.getCandidateById(
      req.params.id
    );

    res.status(200).json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCandidate = async (req, res, next) => {
  try {
    const candidate = await candidateService.updateCandidate(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Candidate updated successfully",
      data: candidate,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCandidate = async (req, res, next) => {
  try {
    await candidateService.deleteCandidate(req.params.id);

    res.status(200).json({
      success: true,
      message: "Candidate deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.searchCandidates = async (req, res, next) => {
  try {
    const candidates = await candidateService.searchCandidates(
      req.query.keyword
    );

    res.status(200).json({
      success: true,
      results: candidates.length,
      data: candidates,
    });
  } catch (error) {
    next(error);
  }
};
