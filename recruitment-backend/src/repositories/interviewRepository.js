
const Interview = require("../models/Interview");

const create = (data, session) => {
  if (!session) return Interview.create(data);
  return new Interview(data).save({ session });
};

const findById = (id) =>
  Interview.findById(id).populate("application");

const findByApplication = (application) =>
  Interview.find({ application }).sort({ round: 1 });

const findByIdAndUpdate = (id, data) =>
  Interview.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

const findAll = (filter = {}) =>
  Interview.find(filter)
    .populate("application")
    .sort({ scheduledAt: 1 });

module.exports = {
  create,
  findById,
  findByApplication,
  findByIdAndUpdate,
  findAll,
};
