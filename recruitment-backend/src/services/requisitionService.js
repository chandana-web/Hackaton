
const requisitionRepository = require("../repositories/requisitionRepository");
const applicationRepository = require("../repositories/applicationRepository");
const AppError = require("../utils/AppError");
const { nextBusinessId, currentYear } = require("../utils/businessIds");

const createRequisition = async (data, actor) => {
  const creator = actor || data.createdBy || "SYSTEM";
  const year = currentYear();
  return requisitionRepository.create({
    ...data,
    createdBy: creator,
    requisitionId: await nextBusinessId(
      `requisition:${year}`,
      `REQ-${year}-`
    ),
    status: "DRAFT",
    statusHistory: [
      {
        previousStatus: null,
        newStatus: "DRAFT",
        actor: creator,
        remarks: "Requisition created",
        timestamp: new Date(),
      },
    ],
  });
};

const getAllRequisitions = async (filter = {}) => {
  return requisitionRepository.findAll(filter);
};

const getRequisitionById = async (id) => {
  const requisition = await requisitionRepository.findById(id);

  if (!requisition) {
    throw new AppError("Requisition not found", 404);
  }

  return requisition;
};

const updateRequisition = async (id, data) => {
  const requisition = await getRequisitionById(id);

  if (!["DRAFT", "REJECTED"].includes(requisition.status)) {
    throw new AppError(
      "Only draft or rejected requisitions can be edited",
      400
    );
  }

  const nextExperienceMin = data.experienceMin ?? requisition.experienceMin;
  const nextExperienceMax = data.experienceMax ?? requisition.experienceMax;
  const nextSalaryMin =
    data.salaryMin !== undefined ? data.salaryMin : requisition.salaryMin;
  const nextSalaryMax =
    data.salaryMax !== undefined ? data.salaryMax : requisition.salaryMax;
  if (nextExperienceMax < nextExperienceMin) {
    throw new AppError("Maximum experience must be >= minimum experience", 400);
  }
  if (
    nextSalaryMin != null &&
    nextSalaryMax != null &&
    nextSalaryMax < nextSalaryMin
  ) {
    throw new AppError("Maximum salary must be >= minimum salary", 400);
  }
  const nextSkills = data.skills !== undefined ? data.skills : requisition.skills;
  if (nextExperienceMin === 0 && (!nextSkills || nextSkills.length === 0)) {
    throw new AppError(
      "At least one job-related skill or minimum experience is required",
      400
    );
  }

  const editableFields = [
    "title",
    "department",
    "departmentRef",
    "location",
    "employmentType",
    "experienceMin",
    "experienceMax",
    "salaryMin",
    "salaryMax",
    "openings",
    "description",
    "skills",
    "requiredSkillRefs",
    "hiringManager",
  ];
  const changes = Object.fromEntries(
    Object.entries(data).filter(([field]) => editableFields.includes(field))
  );
  return requisitionRepository.findByIdAndUpdate(id, changes);
};

const updateStatus = async (
  id,
  requisition,
  status,
  actor,
  remarks,
  additional = {}
) => {
  const updated = await requisitionRepository.updateIfStatus(
    id,
    requisition.status,
    {
    ...additional,
    status,
    $push: {
      ...(additional.$push || {}),
      statusHistory: {
        previousStatus: requisition.status,
        newStatus: status,
        actor: actor || "SYSTEM",
        remarks: remarks || "",
        timestamp: new Date(),
      },
    },
  });
  if (!updated) {
    throw new AppError(
      "Requisition state changed concurrently; reload and retry",
      409
    );
  }
  return updated;
};

const submitForApproval = async (id, actor = "SYSTEM") => {
  const requisition = await getRequisitionById(id);

  if (!["DRAFT", "REJECTED"].includes(requisition.status)) {
    throw new AppError(
      "Only draft or rejected requisitions can be submitted",
      400
    );
  }

  return updateStatus(id, requisition, "PENDING_APPROVAL", actor, "", {
    $push: {
      approvalHistory: {
        action: "SUBMITTED",
        actor: actor || "SYSTEM",
        timestamp: new Date(),
      },
    },
  });
};

const approveRequisition = async (id, actor = "SYSTEM", remarks = "") => {
  const requisition = await getRequisitionById(id);

  if (requisition.status !== "PENDING_APPROVAL") {
    throw new AppError(
      "Only pending requisitions can be approved",
      400
    );
  }
  if (actor && requisition.createdBy === actor) {
    throw new AppError("Requisition creator cannot approve their own request", 403);
  }

  return updateStatus(id, requisition, "APPROVED", actor, remarks, {
    $push: {
      approvalHistory: {
        action: "APPROVED",
        actor: actor || "SYSTEM",
        remarks,
        timestamp: new Date(),
      },
    },
  });
};

const rejectRequisition = async (id, actor = "SYSTEM", remarks) => {
  const requisition = await getRequisitionById(id);

  if (requisition.status !== "PENDING_APPROVAL") {
    throw new AppError(
      "Only pending requisitions can be rejected",
      400
    );
  }

  if (!remarks || !remarks.trim()) {
    throw new AppError("Rejection remarks are required", 400);
  }

  return updateStatus(id, requisition, "REJECTED", actor, remarks, {
    $push: {
      approvalHistory: {
        action: "REJECTED",
        actor: actor || "SYSTEM",
        remarks,
        timestamp: new Date(),
      },
    },
  });
};

const openRequisition = async (id, actor = "SYSTEM") => {
  const requisition = await getRequisitionById(id);

  if (requisition.status !== "APPROVED") {
    throw new AppError(
      "Only approved requisitions can be opened",
      400
    );
  }

  return updateStatus(id, requisition, "OPEN", actor);
};

const closeRequisition = async (id, actor = "SYSTEM") => {
  const requisition = await getRequisitionById(id);

  if (!["OPEN", "ON_HOLD"].includes(requisition.status)) {
    throw new AppError(
      "Only open or on-hold requisitions can be closed",
      400
    );
  }

  const activeApplications = await applicationRepository.findAll({
    requisition: id,
    status: {
      $in: ["APPLIED", "SCREENING", "SHORTLISTED", "INTERVIEW", "OFFER"],
    },
  });
  if (activeApplications.length) {
    throw new AppError(
      `Cannot close requisition with ${activeApplications.length} active application(s)`,
      409
    );
  }

  return updateStatus(id, requisition, "CLOSED", actor);
};

const holdRequisition = async (id, actor = "SYSTEM") => {
  const requisition = await getRequisitionById(id);

  if (requisition.status !== "OPEN") {
    throw new AppError(
      "Only open requisitions can be put on hold",
      400
    );
  }

  return updateStatus(id, requisition, "ON_HOLD", actor);
};

const cancelRequisition = async (id, actor = "SYSTEM") => {
  const requisition = await getRequisitionById(id);

  if (["CLOSED", "CANCELLED"].includes(requisition.status)) {
    throw new AppError(
      "Requisition is already closed or cancelled",
      400
    );
  }

  return updateStatus(id, requisition, "CANCELLED", actor);
};

module.exports = {
  createRequisition,
  getAllRequisitions,
  getRequisitionById,
  updateRequisition,
  submitForApproval,
  approveRequisition,
  rejectRequisition,
  openRequisition,
  closeRequisition,
  holdRequisition,
  cancelRequisition,
};
