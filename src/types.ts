export type Role = 'customer' | 'worker' | 'admin';

export type ServiceCategory =
  | 'Plumbing'
  | 'Electrical'
  | 'Carpentry'
  | 'Painting'
  | 'Cleaning'
  | 'Gardening'
  | 'Driving'
  | 'Caregiving'
  | 'Technical Services'
  | 'Househelp';

export interface ServiceInterpretation {
  category: ServiceCategory;
  subService: string;
  priority: 'Low' | 'Normal' | 'High' | 'Critical';
  location: string;
  availableWorkers: number;
  keywords: string[];
  summary: string;
}

export interface Worker {
  id: string;
  name: string;
  trade: ServiceCategory;
  skills: string[];
  certifications: string[];
  experienceYears: number;
  distanceKm: number;
  available: boolean;
  availableNow: boolean;
  rating: number;
  jobsCompleted: number;
  currentWorkload: number; // 0-100
  recentJobs: number; // jobs in last 7 days
  verified: boolean;
  cooperative: string;
  avatarColor: string;
  initials: string;
  earningsMonth: number;
  welfareContribution: number;
  coopContribution: number;
}

export interface MatchBreakdown {
  skillRelevance: number;
  distance: number;
  availability: number;
  rating: number;
  workload: number;
  experience: number;
}

export interface WorkerMatch {
  worker: Worker;
  matchScore: number;
  allocationScore: number;
  breakdown: MatchBreakdown;
  isFairAllocationPick: boolean;
  fairAllocationNote?: string;
}

export type BookingStatus =
  | 'Requested'
  | 'Accepted'
  | 'On the Way'
  | 'Service Started'
  | 'Completed'
  | 'Rejected'
  | 'Paid'
  | 'Rated';

export interface Booking {
  id: string;
  service: ServiceCategory;
  subService: string;
  workerId: string;
  workerName: string;
  customerName: string;
  date: string;
  time: string;
  location: string;
  description: string;
  cost: number;
  status: BookingStatus;
  priority: 'Low' | 'Normal' | 'High' | 'Critical';
  isEmergency: boolean;
  createdAt: string;
  timeline: { status: BookingStatus; time: string; done: boolean }[];
  payment?: PaymentBreakdown;
  rating?: ServiceRating;
  warrantyClaimed?: boolean;
  insuranceClaimed?: boolean;
  insuranceAmount?: number;
  warrantyClaimReason?: string;
  insuranceClaimReason?: string;
}

export interface PaymentBreakdown {
  totalAmount: number;
  workerEarnings: number;
  coopOperations: number;
  welfareContribution: number;
  damageInsurancePremium: number;
  paidAt: string;
  method: string;
}

export interface ServiceRating {
  stars: number;
  feedback: string;
  complaint?: string;
  hasComplaint: boolean;
  ratedAt: string;
}

export interface WarrantyClaim {
  bookingId: string;
  reason: string;
  claimDate: string;
  status: 'Submitted' | 'Approved' | 'Re-service Scheduled';
}

export type Language = 'en' | 'hi' | 'pa';
