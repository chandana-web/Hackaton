const calculateScreeningScore = (candidate, requisition, rule = null) => {
  const requirements = rule?.requiredSkills?.length
    ? rule.requiredSkills.map((item) => ({
        name: item.skillName.trim().toLowerCase(),
        weight: item.weight,
      }))
    : (requisition.skills || []).map((name) => ({
        name: name.trim().toLowerCase(),
        weight: 1,
      }));

  const minimumExperience =
    rule?.minimumExperience ?? requisition.experienceMin ?? 0;
  const experienceWeight =
    rule?.experienceWeight ?? (minimumExperience > 0 ? 20 : 0);
  const skillWeight = requirements.length
    ? Math.max(0, 100 - experienceWeight)
    : 0;
  const configuredSkillWeight = requirements.reduce(
    (total, item) => total + item.weight,
    0
  );
  const totalWeight = configuredSkillWeight + experienceWeight;

  if (totalWeight <= 0) {
    throw new Error("No job-related screening criteria are configured");
  }

  const candidateSkills = new Set(
    (candidate.skills || []).map((name) => name.trim().toLowerCase())
  );
  const criteriaBreakdown = [];
  let weightedPoints = 0;

  if (requirements.length) {
    for (const requirement of requirements) {
      const requirementWeight = configuredSkillWeight
        ? (skillWeight * requirement.weight) / configuredSkillWeight
        : 0;
      const score = candidateSkills.has(requirement.name) ? 100 : 0;
      const contribution = (score * requirementWeight) / 100;
      weightedPoints += contribution;
      criteriaBreakdown.push({
        criterion: `skill:${requirement.name}`,
        weight: requirementWeight,
        score,
        contribution,
      });
    }
  }

  if (experienceWeight > 0) {
    const score =
      Number(candidate.experience || 0) >= minimumExperience ? 100 : 0;
    const contribution = (score * experienceWeight) / 100;
    weightedPoints += contribution;
    criteriaBreakdown.push({
      criterion: `experience>=${minimumExperience}`,
      weight: experienceWeight,
      score,
      contribution,
    });
  }

  return {
    score: Math.round(weightedPoints),
    criteriaBreakdown,
    passThreshold: rule?.passThreshold ?? 70,
  };
};

module.exports = calculateScreeningScore;
