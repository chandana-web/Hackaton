const Counter = require("../models/Counter");

const nextBusinessId = async (counterKey, prefix, width = 6) => {
  let counter;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      counter = await Counter.findOneAndUpdate(
        { _id: counterKey },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      break;
    } catch (error) {
      if (error.code !== 11000 || attempt === 1) throw error;
    }
  }
  if (!counter || !Number.isInteger(counter.sequence)) {
    throw new Error(`Could not allocate business ID for ${counterKey}`);
  }
  return `${prefix}${String(counter.sequence).padStart(width, "0")}`;
};

const ensureBusinessId = async (
  Model,
  document,
  field,
  counterKey,
  prefix,
  width = 6
) => {
  if (document[field]) return document[field];

  const businessId = await nextBusinessId(counterKey, prefix, width);
  const updated = await Model.findOneAndUpdate(
    { _id: document._id, [field]: { $exists: false } },
    { $set: { [field]: businessId } },
    { new: true, runValidators: true }
  );
  if (updated) return businessId;

  const existing = await Model.findById(document._id).select(field);
  if (existing?.[field]) return existing[field];
  throw new Error(`Could not assign ${field} to record ${document._id}`);
};

const setBusinessIdIfMissing = async (Model, document, field, businessId) => {
  if (document[field]) return document[field];
  const updated = await Model.findOneAndUpdate(
    { _id: document._id, [field]: { $exists: false } },
    { $set: { [field]: businessId } },
    { new: true, runValidators: true }
  );
  if (updated) return businessId;

  const existing = await Model.findById(document._id).select(field);
  if (existing?.[field]) return existing[field];
  throw new Error(`Could not assign ${field} to record ${document._id}`);
};

const currentYear = () => new Date().getUTCFullYear();

module.exports = {
  nextBusinessId,
  ensureBusinessId,
  setBusinessIdIfMissing,
  currentYear,
};
