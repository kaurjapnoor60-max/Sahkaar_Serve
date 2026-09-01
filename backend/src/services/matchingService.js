const WorkerProfile = require('../models/WorkerProfile');

/**
 * Fair Worker Matching Algorithm
 * Weights: Skill 40%, Distance 20%, Availability 15%, Workload 15%, Rating 10%
 */
async function recommendWorkers({ serviceName, subService, isEmergency = false, limit = 5 }) {
  // Only approved workers for normal; approved + high availability for emergency
  const query = { verificationStatus: 'approved', availability: true };
  if (isEmergency) {
    query.availableNow = true;
  }

  const workers = await WorkerProfile.find(query).lean();

  if (!workers.length) return [];

  const scored = workers
    .filter((w) => {
      // Must have the service in skills or primaryService
      const allSkills = [w.primaryService, ...w.skills].map((s) => s.toLowerCase());
      const serviceMatch = allSkills.some(
        (s) => s.includes(serviceName.toLowerCase()) || serviceName.toLowerCase().includes(s)
      );
      return serviceMatch;
    })
    .map((worker) => {
      const breakdown = computeBreakdown(worker, serviceName, subService, isEmergency);
      const matchScore = computeMatchScore(breakdown);
      const allocationScore = computeAllocationScore(worker, breakdown);
      return { worker, matchScore, allocationScore, breakdown };
    });

  if (!scored.length) {
    // If no strict match, return any approved workers sorted by rating
    return workers
      .slice(0, limit)
      .map((worker) => {
        const breakdown = computeBreakdown(worker, serviceName, subService, isEmergency);
        const matchScore = computeMatchScore(breakdown);
        const allocationScore = computeAllocationScore(worker, breakdown);
        return { worker, matchScore, allocationScore, breakdown };
      })
      .sort((a, b) => b.allocationScore - a.allocationScore)
      .slice(0, limit);
  }

  // Sort by allocation score (fair pick first)
  const sorted = scored.sort((a, b) => b.allocationScore - a.allocationScore);

  // Mark fair allocation pick
  if (sorted.length > 0) {
    sorted[0].isFairAllocationPick = true;
    if (sorted.length > 1 && sorted[0].worker._id.toString() !== sorted.find((s) => s.matchScore === Math.max(...scored.map((s) => s.matchScore)))?.worker._id.toString()) {
      const topMatch = scored.find((s) => s.matchScore === Math.max(...scored.map((s) => s.matchScore)));
      sorted[0].fairAllocationNote = `${sorted[0].worker.name.split(' ')[0]} has lower workload (${sorted[0].worker.currentWorkload}%) and meets all skill requirements. Fair allocation prioritizes them.`;
    }
  }

  return sorted.slice(0, limit).map((s) => ({
    ...s,
    isFairAllocationPick: s.isFairAllocationPick || false,
  }));
}

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function computeBreakdown(worker, serviceName, subService, isEmergency) {
  // Skill relevance
  const allSkills = [worker.primaryService, ...worker.skills].map((s) => s.toLowerCase());
  const exactSkillMatch = allSkills.some((s) => s === (subService || serviceName).toLowerCase());
  const serviceMatch = allSkills.some((s) => s.includes(serviceName.toLowerCase()));
  const skillRelevance = clamp(exactSkillMatch ? 96 + Math.random() * 4 : serviceMatch ? 78 + Math.random() * 12 : 50 + Math.random() * 20);

  // Distance (max 6km for scoring)
  const distance = clamp(100 - ((worker.distanceKm || 2) / 6) * 100);

  // Availability
  const avail = worker.availability
    ? isEmergency
      ? worker.availableNow
        ? 100
        : 55
      : 100
    : 0;

  // Rating (normalized 4-5 star range → 0-100)
  const rating = clamp(((worker.rating - 4) / 1) * 100);

  // Workload (lower workload = higher score)
  const workload = clamp(100 - (worker.currentWorkload || 0));

  return {
    skillRelevance: Math.round(skillRelevance),
    distance: Math.round(distance),
    availability: Math.round(avail),
    rating: Math.round(rating),
    workload: Math.round(workload),
    experience: Math.round(clamp(((worker.experience || 1) / 12) * 100)),
  };
}

function computeMatchScore(b) {
  return Math.round(
    b.skillRelevance * 0.40 +
    b.distance * 0.20 +
    b.availability * 0.15 +
    b.workload * 0.15 +
    b.rating * 0.10
  );
}

function computeAllocationScore(worker, b) {
  const matchScore = computeMatchScore(b);
  // Penalty for overloaded workers (fair distribution)
  const recentPenalty = clamp((worker.recentJobs || 0) * 1.6, 0, 70);
  return Math.round(clamp(matchScore - recentPenalty + (100 - (worker.currentWorkload || 0)) * 0.05));
}

module.exports = { recommendWorkers };
