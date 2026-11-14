const ScreeningRule = require("../models/ScreeningRule");

const findEffectiveForRequisition = (requisitionId, at = new Date()) =>
  ScreeningRule.findOne({
    requisition: requisitionId,
    isActive: true,
    effectiveFrom: { $lte: at },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gte: at } }],
  }).sort({ effectiveFrom: -1 });

module.exports = { findEffectiveForRequisition };
