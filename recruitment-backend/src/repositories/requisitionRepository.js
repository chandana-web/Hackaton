
const Requisition = require("../models/Requisition");

const create = (data) => Requisition.create(data);

const findById = (id) => Requisition.findById(id);

const findByIdAndUpdate = (id, data) =>
  Requisition.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

const updateIfStatus = (id, status, data) =>
  Requisition.findOneAndUpdate({ _id: id, status }, data, {
    new: true,
    runValidators: true,
  });

const findAll = (filter = {}) =>
  Requisition.find(filter).sort({ createdAt: -1 });

const deleteById = (id) => Requisition.findByIdAndDelete(id);

module.exports = {
  create,
  findById,
  findByIdAndUpdate,
  updateIfStatus,
  findAll,
  deleteById,
};
