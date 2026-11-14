
const Offer = require("../models/Offer");

const create = (data) => Offer.create(data);

const findById = (id, session) => {
  let query = Offer.findById(id).populate("application");
  if (session) query = query.session(session);
  return query;
};

const findByApplication = (application) =>
  Offer.findOne({ application });

const findByIdAndUpdate = (id, data, session) =>
  Offer.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
    session,
  });

const updateIfStatus = (id, status, data, session) =>
  Offer.findOneAndUpdate({ _id: id, status }, data, {
    new: true,
    runValidators: true,
    session,
  });

const findAll = (filter = {}) =>
  Offer.find(filter)
    .populate("application")
    .sort({ createdAt: -1 });

module.exports = {
  create,
  findById,
  findByApplication,
  findByIdAndUpdate,
  update: findByIdAndUpdate,
  updateIfStatus,
  findAll,
};
