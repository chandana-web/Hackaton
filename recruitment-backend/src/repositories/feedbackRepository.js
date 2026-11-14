
const Feedback = require("../models/Feedback");

const create = (data) => Feedback.create(data);

const findById = (id) => Feedback.findById(id);

const findByInterview = (interview) =>
  Feedback.find({ interview });

const findByApplication = (application) =>
  Feedback.find({ application });

const findAll = (filter = {}) =>
  Feedback.find(filter).sort({ submittedAt: -1 });

module.exports = {
  create,
  findById,
  findByInterview,
  findByApplication,
  findAll,
};
