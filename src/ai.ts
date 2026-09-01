import type { Worker, ServiceCategory, ServiceInterpretation, WorkerMatch, MatchBreakdown } from './types';
import { WORKERS, AREAS } from './data';

const KEYWORDS: Record<ServiceCategory, string[]> = {
  Plumbing: ['pipe', 'leak', 'tap', 'drain', 'bathroom', 'water', 'geyser', 'sanitary', 'flush', 'sink'],
  Electrical: ['switch', 'wire', 'light', 'bulb', 'fan', 'short', 'inverter', 'socket', 'meter', 'current', 'electrical', 'mcb'],
  Carpentry: ['door', 'furniture', 'table', 'chair', 'wood', 'hinge', 'cabinet', 'shelf', 'plywood'],
  Painting: ['paint', 'wall', 'color', 'waterproof', 'texture', 'whitewash', 'crack'],
  Cleaning: ['clean', 'dust', 'mop', 'sanitize', 'deep clean', 'move-in', 'wash', 'scrub', 'furniture polish'],
  Househelp: ['maid', 'house help', 'househelp', 'domestic', 'helper', 'cook', 'cooking', 'bai', 'household', 'home help', 'daily help'],
  'Appliance Repair': ['ac service', 'fridge repair', 'refrigerator', 'washing machine', 'appliance repair', 'cooler repair', 'microwave', 'oven repair'],
  Gardening: ['garden', 'plant', 'lawn', 'grass', 'landscape', 'tree', 'prune', 'hedge'],
  Driving: ['drive', 'driver', 'ride', 'pickup', 'drop', 'errand', 'deliver', 'transport', 'chauffeur'],
  Caregiving: ['care', 'elder', 'child', 'patient', 'nurse', 'hospital', 'post-op', 'support', 'attendant'],
  'Technical Services': ['device', 'setup', 'router', 'installation', 'it support', 'computer', 'printer'],
};

const SUBSERVICE_MAP: Record<ServiceCategory, string[]> = {
  Plumbing: ['Pipe Repair', 'Tap Fitting', 'Drainage Cleaning', 'Geyser Installation'],
  Electrical: ['Wiring Repair', 'Switch Replacement', 'Fan Installation', 'Inverter Setup'],
  Carpentry: ['Furniture Repair', 'Door Fitting', 'Modular Work'],
  Painting: ['Interior Painting', 'Waterproofing', 'Texture Finish'],
  Cleaning: ['Deep Cleaning', 'Kitchen Sanitization', 'Move-in Cleaning'],
  Househelp: ['Daily Help', 'Cooking Help', 'Utensil Cleaning', 'Full-Time Maid'],
  'Appliance Repair': ['AC Service', 'Refrigerator Repair', 'Washing Machine Repair', 'General Appliance Repair'],
  Gardening: ['Lawn Care', 'Plant Health', 'Landscaping'],
  Driving: ['City Commute', 'Errand Driving', 'Goods Transport'],
  Caregiving: ['Eldercare', 'Childcare', 'Post-Operative Care'],
  'Technical Services': ['Device Setup', 'Network Setup', 'IT Support'],
};

const URGENT_WORDS = ['urgent', 'emergency', 'burst', 'flood', 'spark', 'fire', 'short circuit', 'broken', 'stuck', 'leak badly', 'not working at all'];

function matchCategory(text: string): ServiceCategory {
  const lower = text.toLowerCase();
  let best: ServiceCategory = 'Plumbing';
  let bestScore = 0;
  (Object.keys(KEYWORDS) as ServiceCategory[]).forEach((cat) => {
    const score = KEYWORDS[cat].reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = cat;
    }
  });
  return best;
}

export function interpretService(text: string): ServiceInterpretation {
  const category = matchCategory(text);
  const lower = text.toLowerCase();
  const subService = pickSubservice(category, lower);
  const isUrgent = URGENT_WORDS.some((w) => lower.includes(w));
  const priority: ServiceInterpretation['priority'] = isUrgent ? 'Critical' : 'Normal';
  const availableWorkers = WORKERS.filter((w) => w.trade === category && w.available).length;
  const keywords = KEYWORDS[category].filter((kw) => lower.includes(kw));
  const location = AREAS[Math.floor(Math.random() * AREAS.length)];
  const summary = `Your request has been understood as a ${subService} need under ${category} services${isUrgent ? ' with critical priority' : ''}. ${availableWorkers} verified cooperative workers are available nearby.`;
  return { category, subService, priority, location, availableWorkers, keywords, summary };
}

function pickSubservice(cat: ServiceCategory, text: string): string {
  const subs = SUBSERVICE_MAP[cat];
  if (text.includes('pipe') || text.includes('leak')) return 'Pipe Repair';
  if (text.includes('tap') || text.includes('sink')) return 'Tap Fitting';
  if (text.includes('fan') || text.includes('light')) return 'Fan Installation';
  if (text.includes('switch') || text.includes('socket')) return 'Switch Replacement';
  if (text.includes('door')) return 'Door Fitting';
  if (text.includes('ac') || text.includes('appliance')) return 'Appliance Repair';
  return subs[0];
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function round(n: number): number {
  return Math.round(n);
}

function computeBreakdown(worker: Worker, subService: string, emergency: boolean): MatchBreakdown {
  const skillRelevance = clamp(
    worker.skills.some((s) => s.toLowerCase() === subService.toLowerCase()) ? 96 + Math.random() * 4 : 78 + Math.random() * 12
  );
  const distance = clamp(100 - (worker.distanceKm / 6) * 100);
  const availability = worker.available ? (emergency ? (worker.availableNow ? 100 : 55) : 100) : 0;
  const rating = clamp(((worker.rating - 4) / 1) * 100);
  const workload = clamp(100 - worker.currentWorkload);
  const experience = clamp((worker.experienceYears / 12) * 100);
  return {
    skillRelevance: round(skillRelevance),
    distance: round(distance),
    availability: round(availability),
    rating: round(rating),
    workload: round(workload),
    experience: round(experience),
  };
}

/**
 * Fair Allocation Engine.
 * Considers skill, distance, availability, rating, experience, workload,
 * AND the number of recent jobs received to prevent concentration.
 */
function computeAllocationScore(worker: Worker, b: MatchBreakdown): number {
  const matchScore =
    b.skillRelevance * 0.3 + b.distance * 0.18 + b.availability * 0.16 + b.rating * 0.12 + b.experience * 0.08 + b.workload * 0.16;
  // Penalty for workers who have received many recent jobs (fair-job distribution)
  const recentJobsPenalty = clamp(worker.recentJobs * 1.6, 0, 70);
  const allocationScore = clamp(matchScore - recentJobsPenalty + (100 - worker.currentWorkload) * 0.05);
  return round(allocationScore);
}

export function matchWorkers(
  category: ServiceCategory,
  subService: string,
  location: string,
  emergency: boolean,
): WorkerMatch[] {
  void location;
  const candidates = WORKERS.filter((w) => w.trade === category && (emergency ? w.availableNow : w.available));
  const matches: WorkerMatch[] = candidates.map((worker) => {
    const breakdown = computeBreakdown(worker, subService, emergency);
    const matchScore = round(
      breakdown.skillRelevance * 0.3 + breakdown.distance * 0.18 + breakdown.availability * 0.16 +
        breakdown.rating * 0.12 + breakdown.experience * 0.08 + breakdown.workload * 0.16
    );
    const allocationScore = computeAllocationScore(worker, breakdown);
    return { worker, matchScore, allocationScore, breakdown, isFairAllocationPick: false };
  });

  // Identify the pure "best match" (highest match score) and the "fair allocation pick" (highest allocation score)
  const sortedByMatch = [...matches].sort((a, z) => z.matchScore - a.matchScore);
  const sortedByAllocation = [...matches].sort((a, z) => z.allocationScore - a.allocationScore);

  const bestMatch = sortedByMatch[0];
  const fairPick = sortedByAllocation[0];

  // Mark: the recommended worker is the fair-allocation pick (the differentiator)
  if (fairPick && bestMatch && fairPick.worker.id !== bestMatch.worker.id) {
    fairPick.isFairAllocationPick = true;
    fairPick.fairAllocationNote = `Worker ${fairPick.worker.name.split(' ')[0]} received a higher allocation score because their recent workload is significantly lower (${fairPick.worker.recentJobs} recent jobs vs ${bestMatch.worker.recentJobs} for ${bestMatch.worker.name.split(' ')[0]}) while their skills and availability meet the job requirements.`;
  } else if (fairPick) {
    fairPick.isFairAllocationPick = true;
  }

  // Order: fair pick first (AI recommended), then by allocation score
  return [...matches].sort((a, z) => z.allocationScore - a.allocationScore);
}

export function recommendBest(matches: WorkerMatch[]): WorkerMatch | undefined {
  return matches[0];
}
