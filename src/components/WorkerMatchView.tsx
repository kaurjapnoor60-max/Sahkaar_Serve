import { useState } from 'react';
import {
  Scale, ChevronDown, ChevronUp, MapPin, Clock, Briefcase, ShieldCheck, Star,
  Award, Sparkles, Zap, Check, ArrowLeft, TrendingUp, User as UserIcon, X,
} from 'lucide-react';
import { Avatar, RatingStars, VerifiedBadge } from './ui';
import type { WorkerMatch, ServiceCategory } from '@/types';

const BASE_COSTS: Record<ServiceCategory, number> = {
  Plumbing: 400, Electrical: 450, Carpentry: 500, Painting: 1200, Cleaning: 350,
  Househelp: 450, 'Appliance Repair': 550,
  Gardening: 400, Driving: 300, Caregiving: 600, 'Technical Services': 700,
};

function startingPrice(worker: { trade: ServiceCategory; experienceYears: number }): number {
  const base = BASE_COSTS[worker.trade] ?? 400;
  return Math.round(base * (0.85 + (worker.experienceYears / 12) * 0.3));
}

export function WorkerMatchView({ matches, onSelect, emergency = false, onBack }: { matches: WorkerMatch[]; onSelect: (m: WorkerMatch) => void; emergency?: boolean; onBack?: () => void }) {
  const top = matches[0];
  const others = matches.slice(1);

  return (
    <div className="space-y-5">
      {onBack && (
        <button onClick={onBack} className="btn-ghost text-xs"><ArrowLeft className="h-4 w-4" /> Back</button>
      )}

      <div>
        <h1 className="font-display text-xl font-bold text-ink-900">Best Workers for Your Request</h1>
        <p className="mt-1 text-sm text-ink-600">Recommended based on skill, availability, distance, rating and workload.</p>
      </div>

      {/* Top recommended */}
      {top && (
        <div className="card-md overflow-hidden ring-2 ring-primary-500/30 animate-slide-up">
          <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-primary-600 to-primary-500 px-5 py-3 text-white">
            <span className="inline-flex items-center gap-2 text-sm font-bold">
              <Sparkles className="h-4 w-4" /> AI Recommended — Best Match
            </span>
            <span className="chip bg-white/20 text-white">{top.matchScore}% Match</span>
          </div>
          <WorkerCard match={top} recommended onSelect={() => onSelect(top)} emergency={emergency} />
        </div>
      )}

      {/* Other matches */}
      {others.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-semibold text-ink-700">Other matched workers</p>
          <div className="space-y-3">
            {others.map((m) => (
              <div key={m.worker.id} className="card-md overflow-hidden">
                <WorkerCard match={m} onSelect={() => onSelect(m)} emergency={emergency} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WorkerCard({ match, recommended = false, onSelect, emergency }: { match: WorkerMatch; recommended?: boolean; onSelect: () => void; emergency: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [showFairTip, setShowFairTip] = useState(false);
  const [showBadgeTip, setShowBadgeTip] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { worker, breakdown, matchScore } = match;
  const price = startingPrice(worker);

  return (
    <div className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar initials={worker.initials} color={worker.avatarColor} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-base font-bold text-ink-900">{worker.name}</p>
              <div className="relative" onMouseEnter={() => setShowBadgeTip(true)} onMouseLeave={() => setShowBadgeTip(false)}>
                <button onClick={() => setShowBadgeTip((s) => !s)} className="cursor-help">
                  <VerifiedBadge />
                </button>
                {showBadgeTip && (
                  <div className="absolute left-0 top-full z-10 mt-1 w-64 rounded-xl bg-ink-900 p-3 text-xs text-white shadow-card-lg animate-scale-in">
                    Verified through cooperative onboarding, identity/contact checks and skill assessment.
                  </div>
                )}
              </div>
            </div>
            <p className="mt-0.5 text-sm text-ink-600">{worker.trade} • {worker.skills[0]}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-600">
              <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5 text-ink-400" /> {worker.experienceYears} yrs experience</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-ink-400" /> {worker.distanceKm} km away</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-ink-400" /> {worker.availableNow ? 'Available now' : worker.available ? 'Available' : 'Busy'}</span>
              <RatingStars rating={worker.rating} />
              <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-ink-400" /> {worker.jobsCompleted} jobs</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {worker.skills.map((s) => (
                <span key={s} className="chip bg-ink-100 text-ink-600">{s}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Price + match score */}
        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
          <div className="text-right">
            <p className="font-display text-xl font-bold text-ink-900">₹{price}</p>
            <p className="text-[10px] text-ink-500">onwards</p>
          </div>
          <div className={`rounded-xl px-3 py-2 text-center ${recommended ? 'bg-primary-50' : 'bg-ink-50'}`}>
            <p className={`text-[10px] font-medium ${recommended ? 'text-primary-600' : 'text-ink-500'}`}>AI Match</p>
            <p className={`font-display text-lg font-bold ${recommended ? 'text-primary-700' : 'text-ink-900'}`}>{matchScore}%</p>
          </div>
        </div>
      </div>

      {/* Fair Match badge with hover tooltip */}
      <div className="mt-3 flex items-center gap-2">
        <div className="relative" onMouseEnter={() => setShowFairTip(true)} onMouseLeave={() => setShowFairTip(false)}>
          <span className="inline-flex cursor-help items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">
            <Scale className="h-3.5 w-3.5" /> Fair Match
          </span>
          {showFairTip && (
            <div className="absolute left-0 top-full z-10 mt-1 w-64 rounded-xl bg-ink-900 p-3 text-xs text-white shadow-card-lg animate-scale-in">
              Our matching considers skill, availability, distance, rating and workload to distribute opportunities fairly.
            </div>
          )}
        </div>
      </div>

      {/* Mini stats — why this worker is a good match */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Current Workload" value={`${worker.currentWorkload}%`} icon={<TrendingUp className="h-3.5 w-3.5" />} />
        <MiniStat label="Recent Jobs" value={`${worker.recentJobs} this week`} icon={<Briefcase className="h-3.5 w-3.5" />} />
        <MiniStat label="Rating" value={`${worker.rating} ★`} icon={<Star className="h-3.5 w-3.5" />} />
        <MiniStat label="Certifications" value={`${worker.certifications.length} verified`} icon={<Award className="h-3.5 w-3.5" />} />
      </div>

      {/* Match explanation toggle (simplified) */}
      <button onClick={() => setExpanded((e) => !e)} className="mt-4 flex w-full items-center justify-between rounded-xl bg-ink-50 px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-100">
        <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary-600" /> Why this match?</span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {expanded && (
        <div className="mt-3 space-y-2 animate-slide-up">
          <SimpleBar label="Skill relevance" value={breakdown.skillRelevance} color="bg-primary-500" />
          <SimpleBar label="Distance" value={breakdown.distance} color="bg-secondary-500" />
          <SimpleBar label="Availability" value={breakdown.availability} color="bg-teal-500" />
          <SimpleBar label="Rating" value={breakdown.rating} color="bg-amber-500" />
          <SimpleBar label="Experience" value={breakdown.experience} color="bg-secondary-400" />
        </div>
      )}

      <button onClick={onSelect} className={`btn-primary mt-4 w-full ${emergency ? 'bg-red-600 hover:bg-red-700' : ''}`}>
        {emergency ? <><Zap className="h-4 w-4" /> Dispatch Worker</> : <><Check className="h-4 w-4" /> Select {worker.name}</>}
      </button>

      {/* View Profile toggle */}
      <button onClick={() => setShowProfile((s) => !s)} className="btn-ghost mt-2 w-full text-sm">
        {showProfile ? <><X className="h-4 w-4" /> Hide profile</> : <><UserIcon className="h-4 w-4" /> View Profile</>}
      </button>
      {showProfile && (
        <WorkerProfile worker={worker} />
      )}
    </div>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-ink-200 p-2.5">
      <p className="inline-flex items-center gap-1 text-[10px] font-medium text-ink-500">{icon} {label}</p>
      <p className="mt-0.5 text-sm font-bold text-ink-900">{value}</p>
    </div>
  );
}

function WorkerProfile({ worker }: { worker: WorkerMatch['worker'] }) {
  return (
    <div className="mt-3 space-y-4 rounded-xl border border-ink-200 p-4 animate-slide-up">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-ink-400">About</p>
        <p className="mt-1 text-sm text-ink-600">{worker.name} is a {worker.trade.toLowerCase()} professional with {worker.experienceYears} years of experience, serving the {worker.cooperative} cooperative. Completed {worker.jobsCompleted} jobs with a {worker.rating} rating.</p>
      </div>

      {worker.certifications.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Certifications</p>
          <div className="mt-2 space-y-2">
            {worker.certifications.map((c) => (
              <div key={c} className="flex items-center gap-2 text-sm text-ink-700">
                <Award className="h-4 w-4 text-amber-500" /> {c}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Service History</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-ink-50 p-2 text-center">
            <p className="font-display text-base font-bold text-ink-900">{worker.jobsCompleted}</p>
            <p className="text-[10px] text-ink-500">Jobs Completed</p>
          </div>
          <div className="rounded-lg bg-ink-50 p-2 text-center">
            <p className="font-display text-base font-bold text-ink-900">{worker.rating}★</p>
            <p className="text-[10px] text-ink-500">Avg Rating</p>
          </div>
          <div className="rounded-lg bg-ink-50 p-2 text-center">
            <p className="font-display text-base font-bold text-ink-900">{worker.recentJobs}</p>
            <p className="text-[10px] text-ink-500">Recent Jobs</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SimpleBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-ink-600">{label}</span>
        <span className="font-bold text-ink-900">{value}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-ink-100 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}
