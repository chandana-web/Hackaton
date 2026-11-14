
const candidateRepository = require("../repositories/candidateRepository");
const AppError = require("../utils/AppError");
const { nextBusinessId } = require("../utils/businessIds");

const createCandidate = async (data) => {
  const existingCandidate = await candidateRepository.findByEmail(data.email);

  if (existingCandidate) {
    throw new AppError(
      "Candidate with this email already exists",
      409
    );
  }

  return candidateRepository.create({
    ...data,
    candidateId: await nextBusinessId("candidate", "CAND-"),
  });
};

const getAllCandidates = async (queryString = {}) => {
  return candidateRepository.findAll({
    ...queryString,
    isActive: { $ne: false },
  });
};

const getCandidateById = async (id) => {
  const candidate = await candidateRepository.findById(id);

  if (!candidate || candidate.isActive === false) {
    throw new AppError("Candidate not found", 404);
  }

  return candidate;
};

const updateCandidate = async (id, data) => {
  await getCandidateById(id);

  if (data.email) {
    const existingCandidate = await candidateRepository.findByEmail(
      data.email
    );

    if (existingCandidate && existingCandidate._id.toString() !== id) {
      throw new AppError(
        "Email already belongs to another candidate",
        409
      );
    }
  }

  return candidateRepository.findByIdAndUpdate(id, data);
};

const deleteCandidate = async (id) => {
  await getCandidateById(id);

  return candidateRepository.findByIdAndUpdate(id, { isActive: false });
};

const searchCandidates = async (search) => {
  if (!search || !search.trim()) {
    return candidateRepository.findAll();
  }

  const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escapedSearch, "i");

  return candidateRepository.findAll({
    isActive: { $ne: false },
    $or: [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { skills: regex },
    ],
  });
};

const getCandidatePagination = async (queryString = {}) => {
  const page = Math.max(1, Number(queryString.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(queryString.limit) || 10));

  const filters = { isActive: { $ne: false } };

  if (queryString.source) {
    filters.source = queryString.source;
  }

  const total = await candidateRepository.countAll(filters);

  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };
};

module.exports = {
  createCandidate,
  getAllCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
  searchCandidates,
    getCandidatePagination,
};
