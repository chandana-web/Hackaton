const crypto = require("crypto");

const SKILL_NAMES = [
  "JavaScript",
  "TypeScript",
  "Node.js",
  "Python",
  "Java",
  "C#",
  "SQL",
  "MongoDB",
  "PostgreSQL",
  "AWS",
  "Azure",
  "Docker",
  "Kubernetes",
  "React",
  "Angular",
  "Vue",
  "Express",
  "Data Analysis",
  "Machine Learning",
  "Project Management",
  "Communication",
  "Testing",
  "API Design",
  "Security",
  "Leadership",
  "Git",
  "Linux",
  "Redis",
  "Product Strategy",
  " UX Research",
];
const DEPARTMENT_NAMES = [
  "Engineering",
  "Product",
  "Data",
  "Operations",
  "Finance",
  "Human Resources",
  "Sales",
  "Customer Success",
  "Security",
  "Design",
];
const FIRST_NAMES = [
  "Ari",
  "Blake",
  "Casey",
  "Dev",
  "Emery",
  "Finley",
  "Gray",
  "Harper",
  "Indigo",
  "Jules",
  "Kai",
  "Lane",
  "Morgan",
  "Noor",
  "Oakley",
  "Parker",
  "Quinn",
  "Riley",
  "Sage",
  "Taylor",
];
const LAST_NAMES = [
  "Adler",
  "Bennett",
  "Chen",
  "Das",
  "Ellis",
  "Foster",
  "Gupta",
  "Hayes",
  "Ibrahim",
  "Jones",
  "Kim",
  "Lopez",
  "Morris",
  "Nair",
  "Owens",
  "Patel",
  "Reed",
  "Singh",
  "Turner",
  "Wong",
];
const LOCATIONS = [
  "Bengaluru",
  "Chennai",
  "Delhi",
  "Hyderabad",
  "Kolkata",
  "Mumbai",
  "Pune",
  "Remote",
];
const SOURCES = ["CAREER_PAGE", "REFERRAL", "JOB_PORTAL", "DIRECT"];
const DATA_AS_OF = "2027-01-31T00:00:00.000Z";
const BASE_SEED = 20261022;

const createRandom = (seed) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const choose = (random, values) => values[Math.floor(random() * values.length)];
const pad = (value, length) => String(value).padStart(length, "0");
const iso = (date) => date.toISOString();

const scoreApplication = (candidate, requisition) => {
  const skills = new Set(candidate.skills.map((skill) => skill.toLowerCase()));
  const matched = requisition.skills.filter((skill) =>
    skills.has(skill.toLowerCase())
  ).length;
  const skillScore = requisition.skills.length
    ? (matched / requisition.skills.length) * 80
    : 0;
  const experienceScore =
    requisition.experienceMin > 0
      ? candidate.experience >= requisition.experienceMin
        ? 20
        : 0
      : 20;
  return {
    score: Math.round(skillScore + experienceScore),
    matchedSkills: matched,
  };
};

const makeApplicationHistory = (status, score, changedAt, interviewed) => {
  const history = [
    {
      stage: "APPLICATION",
      previousStatus: null,
      newStatus: "APPLIED",
      changedBy: "SYSTEM",
      remarks: "Synthetic application created",
      timestamp: iso(changedAt),
    },
    {
      stage: "SCREENING",
      previousStatus: "APPLIED",
      newStatus: score >= 20 ? "SHORTLISTED" : "REJECTED",
      changedBy: "SYSTEM",
      remarks: `Deterministic job-criteria score ${score}`,
      timestamp: iso(new Date(changedAt.getTime() + 3600000)),
    },
  ];

  if (score >= 20) {
    if (interviewed) {
      history.push({
        stage: "INTERVIEW",
        previousStatus: "SHORTLISTED",
        newStatus: "INTERVIEW",
        changedBy: "SYSTEM",
        remarks: "Interview scheduled",
        timestamp: iso(new Date(changedAt.getTime() + 7200000)),
      });
    }
    if (status === "WITHDRAWN") {
      history.push({
        stage: "WITHDRAWN",
        previousStatus: interviewed ? "INTERVIEW" : "SHORTLISTED",
        newStatus: "WITHDRAWN",
        changedBy: "CANDIDATE",
        remarks: "Synthetic withdrawal cohort rule",
        timestamp: iso(new Date(changedAt.getTime() + 86400000)),
      });
    }
  } else {
    history[1].newStatus = "REJECTED";
  }
  return history;
};

const generateSyntheticData = ({
  seed = BASE_SEED,
  scale = "starter",
} = {}) => {
  if (!Number.isInteger(seed) || seed < 0) {
    throw new Error("seed must be a non-negative integer");
  }
  if (!["starter", "full"].includes(scale)) {
    throw new Error('scale must be either "starter" or "full"');
  }

  const factor = scale === "full" ? 1 : 0.1;
  const requisitionCount = 100 * factor;
  const candidateCount = 2000 * factor;
  const applicationCount = 3000 * factor;
  const interviewCount = 600 * factor;
  const offerCount = 150 * factor;
  const random = createRandom(seed);
  const departments = DEPARTMENT_NAMES.slice(0, requisitionCount).map(
    (name, index) => ({
      departmentId: `DEP-${pad(index + 1, 4)}`,
      name,
      costCenter: `CC-${pad(index + 1, 4)}`,
      isActive: true,
    })
  );
  const skills = SKILL_NAMES.map((name, index) => ({
    skillId: `SKILL-${pad(index + 1, 4)}`,
    name: name.trim(),
    category: index < 17 ? "TECHNICAL" : "PROFESSIONAL",
    isActive: true,
  }));
  const requisitions = Array.from({ length: requisitionCount }, (_, index) => {
    const requiredSkills = [];
    while (requiredSkills.length < 4) {
      const skill = choose(random, skills);
      if (!requiredSkills.includes(skill.name)) requiredSkills.push(skill.name);
    }
    return {
      requisitionId: `REQ-2026-${pad(index + 1, 6)}`,
      title: `${requiredSkills[0]} ${choose(random, ["Engineer", "Specialist", "Lead", "Analyst"])}`,
      departmentId: departments[index % departments.length].departmentId,
      location: choose(random, LOCATIONS),
      employmentType: "FULL_TIME",
      experienceMin: 1 + Math.floor(random() * 8),
      experienceMax: 10 + Math.floor(random() * 8),
      salaryMin: 600000 + Math.floor(random() * 500000),
      salaryMax: 1600000 + Math.floor(random() * 1200000),
      currency: "INR",
      openings: 1 + Math.floor(random() * 5),
      description: `Synthetic role requiring ${requiredSkills.join(", ")}.`,
      hiringManager: `USER-HIRING-MANAGER-${pad((index % 20) + 1, 3)}`,
      createdBy: `USER-REQUESTER-${pad((index % 20) + 1, 3)}`,
      skills: requiredSkills,
      screeningRuleId: `RULE-2026-${pad(index + 1, 6)}`,
      status: "OPEN",
      approvedBy: `USER-APPROVER-${pad((index % 8) + 1, 3)}`,
      approvedAt: "2026-10-01T00:00:00.000Z",
      approvalHistory: [
        { action: "SUBMITTED", actor: `USER-REQUESTER-${pad((index % 20) + 1, 3)}`, timestamp: "2026-09-28T00:00:00.000Z" },
        { action: "APPROVED", actor: `USER-APPROVER-${pad((index % 8) + 1, 3)}`, timestamp: "2026-10-01T00:00:00.000Z" },
      ],
      statusHistory: [
        { previousStatus: "DRAFT", newStatus: "PENDING_APPROVAL", actor: "SYSTEM", timestamp: "2026-09-28T00:00:00.000Z" },
        { previousStatus: "PENDING_APPROVAL", newStatus: "APPROVED", actor: `USER-APPROVER-${pad((index % 8) + 1, 3)}`, timestamp: "2026-10-01T00:00:00.000Z" },
        { previousStatus: "APPROVED", newStatus: "OPEN", actor: "SYSTEM", timestamp: "2026-10-02T00:00:00.000Z" },
      ],
    };
  });
  const screeningRules = requisitions.map((requisition, index) => ({
    ruleId: requisition.screeningRuleId,
    requisitionId: requisition.requisitionId,
    requiredSkills: requisition.skills.map((skillName, skillIndex) => ({
      skillName,
      skillId: skills.find((skill) => skill.name === skillName).skillId,
      weight: 20,
      required: true,
    })),
    minimumExperience: requisition.experienceMin,
    experienceWeight: 20,
    passThreshold: 20,
    effectiveFrom: "2026-10-01T00:00:00.000Z",
    effectiveTo: null,
    isActive: true,
    version: 1,
  }));

  const candidates = Array.from({ length: candidateCount }, (_, index) => {
    const selectedSkills = [];
    const skillTarget = 2 + Math.floor(random() * 6);
    while (selectedSkills.length < skillTarget) {
      const skill = choose(random, skills).name;
      if (!selectedSkills.includes(skill)) selectedSkills.push(skill);
    }
    const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
    const lastName = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length];
    const candidateId = `CAND-${pad(index + 1, 6)}`;
    return {
      candidateId,
      firstName,
      lastName,
      email: `${candidateId.toLowerCase()}@example.test`,
      phone: `+91000${pad(index + 1, 10)}`,
      location: choose(random, LOCATIONS),
      currentCompany: `Synthetic Org ${pad((index % 40) + 1, 2)}`,
      experience: Math.floor(random() * 16),
      skills: selectedSkills,
      source: choose(random, SOURCES),
      isSynthetic: true,
      isActive: true,
      resumeId: `RES-2026-${pad(index + 1, 6)}`,
    };
  });
  const candidateSkills = [];
  candidates.forEach((candidate) => {
    candidate.skills.forEach((skillName) => {
      const skill = skills.find((item) => item.name === skillName);
      candidateSkills.push({
        candidateSkillId: `CS-${pad(candidateSkills.length + 1, 8)}`,
        candidateId: candidate.candidateId,
        skillId: skill.skillId,
        proficiency: 1 + Math.floor(random() * 5),
        effectiveFrom: "2026-01-01T00:00:00.000Z",
        effectiveTo: null,
      });
    });
  });
  const resumeArtifacts = candidates.map((candidate) => ({
    resumeId: candidate.resumeId,
    candidateId: candidate.candidateId,
    storageKey: `synthetic/${candidate.resumeId}.pdf`,
    checksum: crypto.createHash("sha256").update(candidate.candidateId).digest("hex"),
    source: "SYNTHETIC",
    uploadedAt: "2026-10-01T00:00:00.000Z",
    isCurrent: true,
  }));

  const pairs = [];
  const pairKeys = new Set();
  while (pairs.length < applicationCount) {
    const candidate = candidates[Math.floor(random() * candidates.length)];
    const requisition = requisitions[Math.floor(random() * requisitions.length)];
    const key = `${candidate.candidateId}|${requisition.requisitionId}`;
    if (pairKeys.has(key)) continue;
    pairKeys.add(key);
    pairs.push({ candidate, requisition });
  }

  const interviewPairs = pairs.slice(0, interviewCount);
  interviewPairs.forEach(({ candidate, requisition }, index) => {
    const matchCount = 1 + (index % requisition.skills.length);
    requisition.skills.slice(0, matchCount).forEach((skillName) => {
      if (!candidate.skills.includes(skillName)) {
        candidate.skills.push(skillName);
        const skill = skills.find((item) => item.name === skillName);
        candidateSkills.push({
          candidateSkillId: `CS-${pad(candidateSkills.length + 1, 8)}`,
          candidateId: candidate.candidateId,
          skillId: skill.skillId,
          proficiency: 3 + (index % 3),
          effectiveFrom: "2026-01-01T00:00:00.000Z",
          effectiveTo: null,
        });
      }
    });
    candidate.experience = Math.max(candidate.experience, requisition.experienceMin);
  });

  const applications = pairs.map(({ candidate, requisition }, index) => {
    const { score } = scoreApplication(candidate, requisition);
    const appliedAt = new Date(Date.UTC(2026, 9, 1 + (index % 30), 8));
    const interviewed = index < interviewCount;
    const status = interviewed
      ? "INTERVIEW"
      : score >= 20 && Number(candidate.candidateId.slice(-6)) % 29 === 0
        ? "WITHDRAWN"
        : score >= 20
          ? "SHORTLISTED"
          : "REJECTED";
    return {
      applicationId: `APP-${requisition.requisitionId}-${candidate.candidateId}`,
      candidateId: candidate.candidateId,
      requisitionId: requisition.requisitionId,
      status,
      screening: {
        score,
        decision: score >= 20 ? "PASS" : "FAIL",
        threshold: 20,
        criteria: {
          requiredSkillMatch: scoreApplication(candidate, requisition).matchedSkills,
          requiredSkillCount: requisition.skills.length,
          minimumExperience: requisition.experienceMin,
          candidateExperience: candidate.experience,
        },
        screenedAt: iso(new Date(appliedAt.getTime() + 3600000)),
        screenedBy: "SYSTEM-SCREENING",
      },
      appliedAt: iso(appliedAt),
      closedAt: ["REJECTED", "WITHDRAWN"].includes(status)
        ? iso(new Date(appliedAt.getTime() + 86400000))
        : null,
      stageHistory: makeApplicationHistory(status, score, appliedAt, interviewed),
    };
  });

  const interviewers = Array.from({ length: 20 }, (_, index) => ({
    interviewerId: `IVR-${pad(index + 1, 6)}`,
    firstName: FIRST_NAMES[(index + 3) % FIRST_NAMES.length],
    lastName: LAST_NAMES[(index + 5) % LAST_NAMES.length],
    email: `interviewer-${pad(index + 1, 3)}@example.test`,
    departmentId: departments[index % departments.length].departmentId,
    skills: skills.slice(index % 10, (index % 10) + 3).map((skill) => skill.name),
    availability: [
      {
        startTime: "2026-12-01T08:00:00.000Z",
        endTime: "2026-12-15T18:00:00.000Z",
      },
    ],
    isActive: true,
  }));
  const interviews = Array.from({ length: interviewCount }, (_, index) => {
    const app = applications[index];
    const day = Math.floor(index / 160);
    const interviewerIndex = Math.floor(index / 8) % interviewers.length;
    const hour = 9 + (index % 8);
    const scheduledAt = new Date(Date.UTC(2026, 11, 1 + day, hour));
    return {
      interviewId: `INT-2026-${pad(index + 1, 6)}`,
      applicationId: app.applicationId,
      round: 1,
      roundName: "Structured interview",
      interviewType: "TECHNICAL",
      mode: "ONLINE",
      scheduledAt: iso(scheduledAt),
      durationMinutes: 45,
      panel: [
        {
          interviewerId: interviewers[interviewerIndex].interviewerId,
          interviewerName: `${interviewers[interviewerIndex].firstName} ${interviewers[interviewerIndex].lastName}`,
          interviewerEmail: interviewers[interviewerIndex].email,
        },
      ],
      status: "COMPLETED",
      result: app.screening.score >= 60 ? "PASS" : app.screening.score >= 40 ? "ON_HOLD" : "FAIL",
      completedAt: iso(new Date(scheduledAt.getTime() + 45 * 60000)),
      scheduledBy: "SYSTEM",
      statusHistory: [
        { previousStatus: null, newStatus: "SCHEDULED", changedBy: "SYSTEM", changedAt: "2026-11-20T00:00:00.000Z" },
        { previousStatus: "SCHEDULED", newStatus: "COMPLETED", changedBy: interviewerIdFor(index), changedAt: iso(new Date(scheduledAt.getTime() + 45 * 60000)) },
      ],
    };
  });
  interviews.forEach((interview) => {
    const application = applications.find(
      (item) => item.applicationId === interview.applicationId
    );
    const interviewTransition = application.stageHistory.find(
      (event) => event.newStatus === "INTERVIEW"
    );
    if (interviewTransition) interviewTransition.timestamp = interview.scheduledAt;
  });
  const feedback = interviews.slice(0, interviewCount - 1).map((interview, index) => {
    const application = applications[index];
    const rating = Math.max(1, Math.min(5, Math.round(application.screening.score / 20)));
    const interviewer = interview.panel[0];
    return {
      feedbackId: `FB-${interview.interviewId}-${interviewer.interviewerId}`,
      interviewId: interview.interviewId,
      applicationId: application.applicationId,
      interviewerId: interviewer.interviewerId,
      interviewerName: `${interviewer.firstName} ${interviewer.lastName}`,
      submittedBy: interviewer.interviewerId,
      competencies: [
        { name: "Job-related skills", rating, comments: "Structured synthetic rating derived from job fit." },
        { name: "Problem solving", rating, comments: "Structured synthetic rating derived from job fit." },
        { name: "Role communication", rating, comments: "Structured synthetic rating derived from job fit." },
      ],
      overallRating: rating,
      recommendation:
        application.screening.score >= 80
          ? "STRONG_YES"
          : application.screening.score >= 60
            ? "YES"
            : application.screening.score >= 40
              ? "HOLD"
              : "NO",
      submittedAt: interview.completedAt,
    };
  });

  const offers = [];
  for (let index = 0; index < offerCount; index += 1) {
    const application = applications[index];
    const requisition = requisitions.find(
      (item) => item.requisitionId === application.requisitionId
    );
    const outcome =
      application.screening.score >= 80
        ? "ACCEPTED"
        : application.screening.score >= 60
          ? "SENT"
          : "REJECTED";
    const salary = Math.floor(
      (requisition.salaryMin +
        ((requisition.salaryMax - requisition.salaryMin) *
          application.screening.score) /
          100) /
        1000
    ) * 1000;
    const statusHistory = [
      { previousStatus: null, newStatus: "DRAFT", changedBy: "SYSTEM", changedAt: "2026-12-01T00:00:00.000Z" },
      { previousStatus: "DRAFT", newStatus: "PENDING_APPROVAL", changedBy: "USER-RECRUITER-001", changedAt: "2026-12-01T01:00:00.000Z" },
      { previousStatus: "PENDING_APPROVAL", newStatus: "APPROVED", changedBy: "USER-APPROVER-001", changedAt: "2026-12-02T01:00:00.000Z" },
    ];
    if (outcome !== "REJECTED") {
      statusHistory.push({
        previousStatus: "APPROVED",
        newStatus: "SENT",
        changedBy: "USER-RECRUITER-001",
        changedAt: "2026-12-03T01:00:00.000Z",
      });
    }
    if (outcome === "ACCEPTED") {
      statusHistory.push({
        previousStatus: "SENT",
        newStatus: "ACCEPTED",
        changedBy: "CANDIDATE",
        changedAt: "2026-12-04T01:00:00.000Z",
      });
    } else if (outcome === "REJECTED") {
      statusHistory.push({
        previousStatus: "APPROVED",
        newStatus: "SENT",
        changedBy: "USER-RECRUITER-001",
        changedAt: "2026-12-03T01:00:00.000Z",
      });
      statusHistory.push({
        previousStatus: "SENT",
        newStatus: "REJECTED",
        changedBy: "CANDIDATE",
        changedAt: "2026-12-04T01:00:00.000Z",
      });
    }
    offers.push({
      offerId: `OFF-2026-${pad(index + 1, 6)}`,
      applicationId: application.applicationId,
      position: requisition.title,
      departmentId: requisition.departmentId,
      salary,
      currency: "INR",
      joiningDate: "2027-01-15T00:00:00.000Z",
      offerDate: "2026-12-01T00:00:00.000Z",
      expiryDate: "2026-12-20T00:00:00.000Z",
      status: outcome,
      approvedBy: "USER-APPROVER-001",
      approvedAt: "2026-12-02T01:00:00.000Z",
      sentAt: outcome === "REJECTED" ? "2026-12-03T01:00:00.000Z" : outcome === "SENT" || outcome === "ACCEPTED" ? "2026-12-03T01:00:00.000Z" : null,
      respondedAt: outcome === "ACCEPTED" || outcome === "REJECTED" ? "2026-12-04T01:00:00.000Z" : null,
      rejectionReason: outcome === "REJECTED" ? "Candidate declined the synthetic offer." : "",
      createdBy: "USER-RECRUITER-001",
      statusHistory,
    });
    if (outcome === "ACCEPTED") {
      application.status = "HIRED";
      application.closedAt = "2026-12-04T01:00:00.000Z";
      application.stageHistory.push({
        stage: "OFFER",
        previousStatus: "INTERVIEW",
        newStatus: "OFFER",
        changedBy: "SYSTEM",
        remarks: "Approved offer sent",
        timestamp: "2026-12-04T01:00:00.000Z",
      });
      application.stageHistory.push({
        stage: "HIRED",
        previousStatus: "OFFER",
        newStatus: "HIRED",
        changedBy: "SYSTEM",
        remarks: "Offer accepted",
        timestamp: "2026-12-05T01:00:00.000Z",
      });
    } else if (outcome === "SENT") {
      application.status = "OFFER";
      application.stageHistory.push({
        stage: "OFFER",
        previousStatus: "INTERVIEW",
        newStatus: "OFFER",
        changedBy: "SYSTEM",
        remarks: "Approved offer sent",
        timestamp: "2026-12-03T01:00:00.000Z",
      });
    } else {
      application.status = "REJECTED";
      application.closedAt = "2026-12-04T01:00:00.000Z";
      application.stageHistory.push({
        stage: "OFFER",
        previousStatus: "INTERVIEW",
        newStatus: "OFFER",
        changedBy: "SYSTEM",
        remarks: "Approved offer sent",
        timestamp: "2026-12-04T01:00:00.000Z",
      });
      application.stageHistory.push({
        stage: "REJECTED",
        previousStatus: "OFFER",
        newStatus: "REJECTED",
        changedBy: "CANDIDATE",
        remarks: "Candidate declined offer",
        timestamp: "2026-12-05T01:00:00.000Z",
      });
    }
  }

  const groundTruth = [];
  if (applications.length > interviewCount) {
    const duplicate = applications[applications.length - 1];
    const source = applications[interviewCount];
    duplicate.candidateId = source.candidateId;
    duplicate.requisitionId = source.requisitionId;
    duplicate.applicationId = `APP-${duplicate.requisitionId}-${duplicate.candidateId}-DUP`;
    duplicate.status = source.status;
    duplicate.screening = {
      ...source.screening,
      screenedAt: iso(new Date(new Date(duplicate.appliedAt).getTime() + 3600000)),
    };
    duplicate.closedAt = source.closedAt
      ? iso(new Date(new Date(duplicate.appliedAt).getTime() + 86400000))
      : null;
    duplicate.stageHistory = makeApplicationHistory(
      duplicate.status,
      duplicate.screening.score,
      new Date(duplicate.appliedAt),
      false
    );
    groundTruth.push({
      issue_type: "duplicate_application",
      target_id: duplicate.applicationId,
      expected_decision: "FLAG_DUPLICATE",
      field: "candidateId,requisitionId",
      expected_value: "one application per candidate and requisition",
      description: "Injected duplicate after generating the valid application baseline.",
    });
  }
  if (interviews.length > 1) {
    const conflict = interviews[interviews.length - 1];
    conflict.scheduledAt = interviews[0].scheduledAt;
    conflict.panel = interviews[0].panel;
    groundTruth.push({
      issue_type: "interviewer_conflict",
      target_id: conflict.interviewId,
      expected_decision: "FLAG_SCHEDULING_CONFLICT",
      field: "scheduledAt,panel",
      expected_value: `${interviews[0].scheduledAt}|${interviews[0].panel[0].interviewerId}`,
      description: "Injected overlapping booking for the same interviewer.",
    });
  }
  if (offers.length) {
    const outOfBandOffer = offers[offers.length - 1];
    const requisition = requisitions.find(
      (item) => item.requisitionId === applications[offerCount - 1].requisitionId
    );
    outOfBandOffer.salary = requisition.salaryMax + 10000;
    groundTruth.push({
      issue_type: "offer_outside_approved_band",
      target_id: outOfBandOffer.offerId,
      expected_decision: "FLAG_SALARY_OUT_OF_BAND",
      field: "salary",
      expected_value: requisition.salaryMax,
      description: "Injected salary above the approved requisition maximum.",
    });
  }
  if (interviews.length > 1) {
    const missingInterview = interviews[interviews.length - 1];
    const application = applications.find(
      (item) => item.applicationId === missingInterview.applicationId
    );
    application.status = "OFFER";
    application.stageHistory.push({
      stage: "OFFER",
      previousStatus: "INTERVIEW",
      newStatus: "OFFER",
      changedBy: "SYSTEM",
      remarks: "Injected stage advancement without complete feedback.",
      timestamp: "2026-12-05T00:00:00.000Z",
    });
    groundTruth.push({
      issue_type: "stage_advanced_without_feedback",
      target_id: application.applicationId,
      expected_decision: "FLAG_MISSING_FEEDBACK",
      field: "feedback",
      expected_value: missingInterview.interviewId,
      description: "Application was advanced despite a missing panel feedback record.",
    });
  }
  const activeApplication = applications.find((application) =>
    ["APPLIED", "SCREENING", "SHORTLISTED", "INTERVIEW", "OFFER"].includes(application.status)
  );
  if (activeApplication) {
    const requisition = requisitions.find(
      (item) => item.requisitionId === activeApplication.requisitionId
    );
    requisition.status = "CLOSED";
    requisition.statusHistory.push({
      previousStatus: "OPEN",
      newStatus: "CLOSED",
      actor: "SYSTEM",
      timestamp: DATA_AS_OF,
    });
    groundTruth.push({
      issue_type: "closed_role_with_active_applications",
      target_id: requisition.requisitionId,
      expected_decision: "FLAG_ACTIVE_APPLICATIONS",
      field: "status",
      expected_value: activeApplication.applicationId,
      description: "Injected closed requisition retaining a non-terminal application.",
    });
  }

  return {
    metadata: {
      seed,
      scale,
      dataAsOf: DATA_AS_OF,
      source: "Synthetic data generated locally; no external candidate data used.",
    },
    departments,
    skills,
    requisitions,
    screeningRules,
    candidates,
    candidateSkills,
    resumeArtifacts,
    applications,
    interviewers,
    interviews,
    feedback,
    offers,
    groundTruth,
  };
};

const interviewerIdFor = (index) => `IVR-${pad((Math.floor(index / 8) % 20) + 1, 6)}`;

module.exports = {
  BASE_SEED,
  generateSyntheticData,
};
