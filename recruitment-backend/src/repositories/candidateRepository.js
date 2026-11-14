
const Candidate = require("../models/Candidate");
const QueryFeatures = require("../utils/queryFeatures");
const create = (data) => Candidate.create(data);

const findById = (id) => Candidate.findById(id);

const findByEmail = (email) =>
  Candidate.findOne({ email: email.toLowerCase() });

const findByIdAndUpdate = (id, data) =>
  Candidate.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

const findAll = async (queryString = {}) => {
  const features = new QueryFeatures(
    Candidate.find(),
    queryString
  )
    .filter()
    .sort()
    .selectFields()
    .paginate();

  return features.query;
};

const countAll = (filter = {}) => Candidate.countDocuments(filter);

const deleteById = (id) => Candidate.findByIdAndDelete(id);

module.exports = {
  create,
  findById,
  findByEmail,
  findByIdAndUpdate,
  findAll,
  countAll,
  deleteById,
};
