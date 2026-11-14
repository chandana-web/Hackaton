
const Application = require("../models/Application");

const create = (data) => Application.create(data);

const findById = (id, session) => {
  let query = Application.findById(id)
    .populate("candidate")
    .populate("requisition");
  if (session) query = query.session(session);
  return query;
};

const findByCandidateAndRequisition = (candidate, requisition) =>
  Application.findOne({ candidate, requisition });

const findByIdAndUpdate = (id, data, session) =>
  Application.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
    session,
  });

const updateIfStatus = (id, status, data, session) =>
  Application.findOneAndUpdate({ _id: id, status }, data, {
    new: true,
    runValidators: true,
    session,
  });

const findAll = (filter = {}) =>
  Application.find(filter)
    .populate("candidate")
    .populate("requisition")
    .sort({ createdAt: -1 });

module.exports = {
  create,
  findById,
  findByCandidateAndRequisition,
  findByIdAndUpdate,
  updateIfStatus,
  findAll,
};
