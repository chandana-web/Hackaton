const ISSUE_TYPES = [
  "duplicate_application",
  "interviewer_conflict",
  "stage_advanced_without_feedback",
  "offer_outside_approved_band",
  "closed_role_with_active_applications",
];

const uniqueCount = (items, key) => new Set(items.map((item) => item[key])).size;

const validateSyntheticData = (data) => {
  const issues = [];
  const maps = {
    departments: new Map(data.departments.map((item) => [item.departmentId, item])),
    skills: new Map(data.skills.map((item) => [item.skillId, item])),
    requisitions: new Map(data.requisitions.map((item) => [item.requisitionId, item])),
    candidates: new Map(data.candidates.map((item) => [item.candidateId, item])),
    applications: new Map(data.applications.map((item) => [item.applicationId, item])),
    interviewers: new Map(data.interviewers.map((item) => [item.interviewerId, item])),
    interviews: new Map(data.interviews.map((item) => [item.interviewId, item])),
  };

  const tables = [
    ["departments", "departmentId"],
    ["skills", "skillId"],
    ["requisitions", "requisitionId"],
    ["screeningRules", "ruleId"],
    ["candidates", "candidateId"],
    ["candidateSkills", "candidateSkillId"],
    ["resumeArtifacts", "resumeId"],
    ["applications", "applicationId"],
    ["interviewers", "interviewerId"],
    ["interviews", "interviewId"],
    ["feedback", "feedbackId"],
    ["offers", "offerId"],
  ];
  for (const [tableName, key] of tables) {
    if (uniqueCount(data[tableName], key) !== data[tableName].length) {
      issues.push(`Duplicate primary key in ${tableName}`);
    }
  }

  for (const requisition of data.requisitions) {
    if (!maps.departments.has(requisition.departmentId)) {
      issues.push(`Missing department for ${requisition.requisitionId}`);
    }
    if (!maps.skills.size || requisition.skills.some(
      (name) => !data.skills.some((skill) => skill.name === name)
    )) {
      issues.push(`Missing required skill for ${requisition.requisitionId}`);
    }
  }
  for (const rule of data.screeningRules) {
    if (!maps.requisitions.has(rule.requisitionId)) {
      issues.push(`Missing requisition for ${rule.ruleId}`);
    }
    if (rule.requiredSkills.some((item) => !maps.skills.has(item.skillId))) {
      issues.push(`Missing skill for ${rule.ruleId}`);
    }
  }
  for (const candidateSkill of data.candidateSkills) {
    if (
      !maps.candidates.has(candidateSkill.candidateId) ||
      !maps.skills.has(candidateSkill.skillId)
    ) {
      issues.push(`Broken candidate-skill relationship ${candidateSkill.candidateSkillId}`);
    }
  }
  for (const resume of data.resumeArtifacts) {
    if (!maps.candidates.has(resume.candidateId)) {
      issues.push(`Missing candidate for ${resume.resumeId}`);
    }
  }
  for (const application of data.applications) {
    if (
      !maps.candidates.has(application.candidateId) ||
      !maps.requisitions.has(application.requisitionId)
    ) {
      issues.push(`Broken application relationship ${application.applicationId}`);
    }
    const candidate = maps.candidates.get(application.candidateId);
    const requisition = maps.requisitions.get(application.requisitionId);
    if (candidate && requisition) {
      const skills = new Set(candidate.skills.map((item) => item.toLowerCase()));
      const matches = requisition.skills.filter((item) =>
        skills.has(item.toLowerCase())
      ).length;
      const expectedScore = Math.round(
        (matches / requisition.skills.length) * 80 +
          (candidate.experience >= requisition.experienceMin ? 20 : 0)
      );
      if (expectedScore !== application.screening.score) {
        issues.push(`Screening score reconciliation failed for ${application.applicationId}`);
      }
    }
    if (
      application.stageHistory.length &&
      application.stageHistory[application.stageHistory.length - 1].newStatus !== application.status
    ) {
      issues.push(`Application history does not match state for ${application.applicationId}`);
    }
  }

  const duplicatePairs = new Map();
  for (const application of data.applications) {
    const pair = `${application.candidateId}|${application.requisitionId}`;
    duplicatePairs.set(pair, (duplicatePairs.get(pair) || 0) + 1);
  }
  const duplicateApplicationCount = Array.from(duplicatePairs.values()).filter(
    (count) => count > 1
  ).length;

  for (const interview of data.interviews) {
    if (!maps.applications.has(interview.applicationId)) {
      issues.push(`Missing application for ${interview.interviewId}`);
    }
    for (const panelMember of interview.panel) {
      if (!maps.interviewers.has(panelMember.interviewerId)) {
        issues.push(`Missing interviewer for ${interview.interviewId}`);
      }
    }
    if (
      interview.status === "COMPLETED" &&
      new Date(interview.completedAt) <= new Date(interview.scheduledAt)
    ) {
      issues.push(`Interview date ordering failed for ${interview.interviewId}`);
    }
  }
  for (const feedback of data.feedback) {
    if (
      !maps.interviews.has(feedback.interviewId) ||
      !maps.applications.has(feedback.applicationId)
    ) {
      issues.push(`Broken feedback relationship ${feedback.feedbackId}`);
    }
  }
  for (const offer of data.offers) {
    const application = maps.applications.get(offer.applicationId);
    const requisition = application && maps.requisitions.get(application.requisitionId);
    if (!application || !requisition) {
      issues.push(`Broken offer relationship ${offer.offerId}`);
      continue;
    }
    if (
      new Date(offer.offerDate) >= new Date(offer.expiryDate) ||
      new Date(offer.joiningDate) <= new Date(offer.offerDate)
    ) {
      issues.push(`Offer date ordering failed for ${offer.offerId}`);
    }
  }

  const interviewConflicts = [];
  const assignments = [];
  for (const interview of data.interviews) {
    for (const member of interview.panel) {
      assignments.push({
        interviewId: interview.interviewId,
        interviewerId: member.interviewerId,
        start: new Date(interview.scheduledAt).getTime(),
        end:
          new Date(interview.scheduledAt).getTime() +
          interview.durationMinutes * 60000,
      });
    }
  }
  for (let left = 0; left < assignments.length; left += 1) {
    for (let right = left + 1; right < assignments.length; right += 1) {
      const first = assignments[left];
      const second = assignments[right];
      if (
        first.interviewerId === second.interviewerId &&
        first.interviewId !== second.interviewId &&
        first.start < second.end &&
        first.end > second.start
      ) {
        interviewConflicts.push([first.interviewId, second.interviewId]);
      }
    }
  }

  const feedbackKeys = new Set(
    data.feedback.map((item) => `${item.interviewId}|${item.interviewerId}`)
  );
  const missingFeedbackStages = data.applications.filter((application) => {
    if (!["OFFER", "HIRED"].includes(application.status)) return false;
    return data.interviews.some((interview) =>
      interview.applicationId === application.applicationId &&
      interview.panel.some((member) =>
        !feedbackKeys.has(`${interview.interviewId}|${member.interviewerId}`)
      )
    );
  }).length;
  const salaryViolations = data.offers.filter((offer) => {
    const application = maps.applications.get(offer.applicationId);
    const requisition = application && maps.requisitions.get(application.requisitionId);
    return requisition && offer.salary > requisition.salaryMax;
  }).length;
  const closedRoleActiveApplications = data.requisitions.filter((requisition) =>
    requisition.status === "CLOSED" &&
    data.applications.some((application) =>
      application.requisitionId === requisition.requisitionId &&
      !["HIRED", "REJECTED", "WITHDRAWN"].includes(application.status)
    )
  ).length;

  const expected = Object.fromEntries(ISSUE_TYPES.map((type) => [
    type,
    data.groundTruth.filter((item) => item.issue_type === type).length,
  ]));
  const observed = {
    duplicate_application: duplicateApplicationCount,
    interviewer_conflict: interviewConflicts.length,
    stage_advanced_without_feedback: missingFeedbackStages,
    offer_outside_approved_band: salaryViolations,
    closed_role_with_active_applications: closedRoleActiveApplications,
  };
  const anomalyChecks = ISSUE_TYPES.map((issueType) => ({
    issueType,
    expected: expected[issueType],
    observed: observed[issueType],
    passed: expected[issueType] === observed[issueType],
  }));
  const counts = Object.fromEntries(
    tables.map(([tableName]) => [tableName, data[tableName].length])
  );
  counts.groundTruth = data.groundTruth.length;

  return {
    passed:
      issues.length === 0 &&
      anomalyChecks.every((check) => check.passed),
    checkedAt: data.metadata.dataAsOf,
    counts,
    checks: {
      primaryKeysAndForeignKeys: {
        passed: issues.every((issue) => !issue.startsWith("Duplicate primary key") &&
          !issue.startsWith("Missing ") && !issue.startsWith("Broken ")),
      },
      screeningScoreReconciliation: {
        passed: issues.every((issue) => !issue.startsWith("Screening score reconciliation")),
      },
      lifecycleAndDateOrdering: {
        passed: issues.every((issue) =>
          !issue.startsWith("Application history") &&
          !issue.startsWith("Interview date ordering") &&
          !issue.startsWith("Offer date ordering")
        ),
      },
      labelledExceptions: anomalyChecks,
    },
    issues,
  };
};

module.exports = validateSyntheticData;
