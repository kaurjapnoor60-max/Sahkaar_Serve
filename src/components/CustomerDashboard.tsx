import { useState } from 'react';
import * as Icons from 'lucide-react';
import {
  Home, Sparkles, AlertTriangle, CalendarClock, Bell, Star, MapPin, ShieldCheck, Scale,
  Search, ArrowRight, CheckCircle2, Clock, Zap, Navigation, X, ChevronLeft, ChevronRight,
  TrendingUp, Briefcase, Loader2, ArrowLeft,
} from 'lucide-react';
import { AppShell } from './AppShell';
import { Avatar, Badge, RatingStars, VerifiedBadge, StatTile, EmptyState } from './ui';
import { SERVICE_CATEGORIES, AREAS, NOTIFICATIONS, WORKERS } from '@/data';
import { interpretService, matchWorkers } from '@/ai';
import { useBookings } from '@/store';
import type { Role, ServiceInterpretation, WorkerMatch, Booking, ServiceCategory, Worker } from '@/types';
import { WorkerMatchView } from './WorkerMatchView';
import { BookingFlow } from './BookingFlow';

const CUSTOMER = { name: 'Priya Sharma', subtitle: 'Greenwood Society', initials: 'PS', color: 'bg-primary-600' };

const NAV = [
  { id: 'home', label: 'Home', icon: <Home className="h-5 w-5" /> },
  { id: 'ai', label: 'AI Service Request', icon: <Sparkles className="h-5 w-5" /> },
  { id: 'bookings', label: 'My Bookings', icon: <CalendarClock className="h-5 w-5" /> },
  { id: 'emergency', label: 'Emergency Service', icon: <AlertTriangle className="h-5 w-5" /> },
];

const BASE_COSTS: Record<ServiceCategory, number> = {
  Plumbing: 400, Electrical: 450, Carpentry: 500, Painting: 1200, Cleaning: 350,
  Househelp: 450, 'Appliance Repair': 550,
  Gardening: 400, Driving: 300, Caregiving: 600, 'Technical Services': 700,
};

function startingPrice(worker: Worker): number {
  const base = BASE_COSTS[worker.trade] ?? 400;
  return Math.round(base * (0.85 + (worker.experienceYears / 12) * 0.3));
}

function workerSortValue(w: Worker, sort: string): number {
  if (sort === 'rating') return -w.rating;
  if (sort === 'distance') return w.distanceKm;
  if (sort === 'experience') return -w.experienceYears;
  if (sort === 'price') return startingPrice(w);
  return -w.rating;
}

export function CustomerDashboard({ role, onExit, user }: { role: Role; onExit: () => void; user?: { name: string; mobile: string; email?: string; pendingVerification?: boolean } }) {
  void role;
  const CUSTOMER_USER = { name: user?.name ?? CUSTOMER.name, subtitle: user?.email ?? CUSTOMER.subtitle, initials: user?.name?.split(' ').map((w) => w[0]).join('').slice(0, 2) ?? CUSTOMER.initials, color: CUSTOMER.color };
  const [active, setActive] = useState('home');
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [aiResult, setAiResult] = useState<ServiceInterpretation | null>(null);
  const [workerMatches, setWorkerMatches] = useState<WorkerMatch[] | null>(null);
  const [prevView, setPrevView] = useState<string>('home');

  function goCategory(cat: ServiceCategory) {
    setCategory(cat);
    setAiResult(null);
    setWorkerMatches(null);
    setActive('category');
  }

  function goAI() {
    setCategory(null);
    setAiResult(null);
    setWorkerMatches(null);
    setActive('ai');
  }

  function goMatches(matches: WorkerMatch[]) {
    setWorkerMatches(matches);
    setActive('matches');
  }

  function goBooking(match: WorkerMatch, interp: ServiceInterpretation) {
    setAiResult(interp);
    setWorkerMatches([match]);
    setActive('booking');
  }

  function navigate(id: string) {
    setPrevView(active);
    setActive(id);
  }

  function goBookingFromCategory(worker: Worker, cat: ServiceCategory) {
    setCategory(cat);
    setAiResult({
      category: cat,
      subService: worker.skills[0] ?? cat,
      priority: 'Normal',
      location: AREAS[0],
      availableWorkers: WORKERS.filter((w) => w.trade === cat && w.available).length,
      keywords: [],
      summary: `${cat} service request.`,
    });
    setWorkerMatches([{
      worker,
      matchScore: 90,
      allocationScore: 88,
      breakdown: { skillRelevance: 95, distance: 80, availability: 100, rating: 90, workload: 70, experience: 85 },
      isFairAllocationPick: false,
    }]);
    setActive('booking');
  }

  return (
    <AppShell role="customer" nav={NAV} active={active === 'home' || active === 'category' || active === 'matches' || active === 'booking' ? 'home' : active} onNavigate={navigate} onExit={onExit} user={CUSTOMER_USER}>
      {active === 'home' && <HomeView onGoAI={goAI} onGoEmergency={() => setActive('emergency')} onGoCategory={goCategory} onNavigate={setActive} />}
      {active === 'category' && category && (
        <CategoryWorkersView
          category={category}
          onBack={() => setActive('home')}
          onSelect={(w) => goBookingFromCategory(w, category)}
        />
      )}
      {active === 'ai' && (
        <AIRequestView
          onBack={() => setActive('home')}
          onFindWorkers={(interp) => { setAiResult(interp); goMatches(matchWorkers(interp.category, interp.subService, interp.location, false)); }}
        />
      )}
      {active === 'matches' && workerMatches && aiResult && (
        <WorkerMatchView
          matches={workerMatches}
          onSelect={(m) => goBooking(m, aiResult)}
          onBack={() => setActive('ai')}
        />
      )}
      {active === 'booking' && workerMatches && aiResult && workerMatches[0] && (
        <BookingFlow
          match={workerMatches[0]}
          interpretation={aiResult}
          onDone={() => { setActive('bookings'); }}
          onCancel={() => setActive('matches')}
        />
      )}
      {active === 'bookings' && <BookingsView />}
      {active === 'emergency' && <EmergencyView onBack={() => setActive('home')} />}
    </AppShell>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="section-title">{title}</h2>
      {action}
    </div>
  );
}

function HomeView({ onGoAI, onGoEmergency, onGoCategory, onNavigate }: { onGoAI: () => void; onGoEmergency: () => void; onGoCategory: (c: ServiceCategory) => void; onNavigate: (id: string) => void }) {
  const { bookings, activeBooking } = useBookings();
  const recent = bookings.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="card-md overflow-hidden">
        <div className="relative bg-gradient-to-br from-primary-700 to-primary-600 p-6 sm:p-7 text-white">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -right-2 top-10 h-20 w-20 rounded-full bg-white/5" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary-100">Good afternoon, Priya</p>
              <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">What help do you need?</h1>
              <p className="mt-1 text-sm text-primary-100/80">Browse our service categories or let our AI understand your problem.</p>
            </div>
            <button onClick={onGoAI} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary-700 shadow-lg transition hover:bg-primary-50 hover:shadow-xl active:scale-95">
              <Sparkles className="h-4 w-4" /> Ask AI
            </button>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Active booking" value={activeBooking ? '1' : '0'} sub={activeBooking ? activeBooking.id : 'No active job'} icon={<Clock className="h-4 w-4" />} />
        <StatTile label="Total bookings" value={bookings.length} icon={<CalendarClock className="h-4 w-4" />} accent="secondary" />
        <StatTile label="Verified workers" value="12" sub="Nearby" icon={<ShieldCheck className="h-4 w-4" />} accent="teal" />
        <StatTile label="Avg response" value="< 25m" sub="In your area" icon={<Zap className="h-4 w-4" />} accent="accent" />
      </div>

      {/* Service categories */}
      <div>
        <SectionHeader title="Service categories" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
          {SERVICE_CATEGORIES.map((cat) => {
            const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[cat.icon] ?? Briefcase;
            return (
              <button
                key={cat.name}
                onClick={() => onGoCategory(cat.name)}
                className="card group p-4 text-left transition hover:-translate-y-0.5 hover:shadow-card-md"
              >
                <div className={`grid h-11 w-11 place-items-center rounded-xl ${cat.bg} ${cat.color} transition group-hover:scale-105`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 font-display text-sm font-bold text-ink-900">{cat.name}</p>
                <p className="mt-0.5 text-xs text-ink-500">{cat.desc}</p>
                <p className="mt-2 text-xs font-semibold text-primary-600">from ₹{BASE_COSTS[cat.name] ?? cat.baseCost}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI optional feature */}
      <div className="card-md overflow-hidden border-primary-200">
        <div className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600"><Sparkles className="h-5 w-5" /></div>
            <div>
              <p className="font-display text-sm font-bold text-ink-900">Not sure what service you need?</p>
              <p className="mt-0.5 text-sm text-ink-600">Describe your problem in your own words and let SahkaarServe AI find the right service and best worker for you.</p>
            </div>
          </div>
          <button onClick={onGoAI} className="btn-primary shrink-0">
            <Sparkles className="h-4 w-4" /> Ask SahkaarServe AI
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active booking */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <SectionHeader title="Active booking" action={<button onClick={() => onNavigate('bookings')} className="btn-ghost text-xs">View all</button>} />
            {activeBooking ? (
              <ActiveBookingCard booking={activeBooking} />
            ) : (
              <div className="card p-6">
                <EmptyState icon={<CalendarClock className="h-6 w-6" />} title="No active booking" subtitle="Pick a category above to start a new service request." />
              </div>
            )}
          </div>

          {/* Recent bookings */}
          <div>
            <SectionHeader title="Recent bookings" />
            <div className="space-y-3">
              {recent.map((b) => (
                <div key={b.id} className="card flex items-center gap-4 p-4">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-600">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">{b.service} — {b.subService}</p>
                    <p className="truncate text-xs text-ink-500">{b.id} · {b.workerName} · {b.date}</p>
                  </div>
                  <StatusPill status={b.status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <button onClick={onGoEmergency} className="card-md group w-full overflow-hidden p-5 text-left transition hover:-translate-y-0.5 hover:shadow-card-lg">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-red-50 text-danger animate-pulse-ring">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-display text-sm font-bold text-ink-900">Emergency Service</p>
                <p className="text-xs text-ink-500">Burst pipe? Spark? Get urgent help now.</p>
              </div>
              <ChevronRight className="h-5 w-5 text-ink-400 transition group-hover:translate-x-0.5" />
            </div>
          </button>

          {/* Recommended */}
          <div>
            <SectionHeader title="Popular services" />
            <div className="card divide-y divide-ink-100">
              {([
                { cat: 'Plumbing' as ServiceCategory, label: 'Plumbing — Pipe Repair' },
                { cat: 'Cleaning' as ServiceCategory, label: 'Cleaning — Deep Cleaning' },
                { cat: 'Electrical' as ServiceCategory, label: 'Electrical — Fan Installation' },
              ]).map((s) => (
                <button key={s.label} onClick={() => onGoCategory(s.cat)} className="flex w-full items-center justify-between gap-2 p-3.5 text-left hover:bg-ink-50">
                  <span className="text-sm font-medium text-ink-700">{s.label}</span>
                  <ArrowRight className="h-4 w-4 text-ink-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div>
            <SectionHeader title="Notifications" />
            <div className="card divide-y divide-ink-100">
              {NOTIFICATIONS.map((n) => (
                <div key={n.id} className="flex gap-3 p-3.5">
                  <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${n.type === 'success' ? 'bg-primary-50 text-primary-600' : n.type === 'info' ? 'bg-secondary-50 text-secondary-600' : 'bg-teal-50 text-teal-600'}`}>
                    {n.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : n.type === 'info' ? <Bell className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900">{n.title}</p>
                    <p className="text-xs text-ink-600">{n.body}</p>
                    <p className="mt-0.5 text-[10px] text-ink-400">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Requested: 'bg-ink-100 text-ink-600', Accepted: 'bg-secondary-50 text-secondary-700',
    'On the Way': 'bg-amber-50 text-amber-700', 'Service Started': 'bg-secondary-100 text-secondary-800',
    Completed: 'bg-primary-50 text-primary-700', Rejected: 'bg-red-50 text-red-600',
  };
  return <span className={`chip ${map[status] ?? 'bg-ink-100 text-ink-600'}`}>{status}</span>;
}

function ActiveBookingCard({ booking }: { booking: Booking }) {
  const { advanceStatus } = useBookings();
  const steps: Booking['status'][] = ['Requested', 'Accepted', 'On the Way', 'Service Started', 'Completed'];
  const currentIdx = steps.indexOf(booking.status);

  return (
    <div className="card-md overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 p-4">
        <div>
          <p className="font-display text-base font-bold text-ink-900">Booking {booking.id}</p>
          <p className="text-xs text-ink-500">{booking.service} — {booking.subService}</p>
        </div>
        <StatusPill status={booking.status} />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar initials={booking.workerName.split(' ').map((w) => w[0]).join('').slice(0, 2)} color="bg-primary-600" size="sm" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink-900">{booking.workerName}</p>
            <p className="text-xs text-ink-500">{booking.date} · {booking.time} · {booking.location}</p>
          </div>
          <RatingStars rating={4.8} />
        </div>
        <div className="mt-4 flex items-center gap-1">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-1">
              <div className="flex flex-col items-center gap-1">
                <div className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${i <= currentIdx ? 'bg-primary-600 text-white' : 'bg-ink-100 text-ink-400'}`}>
                  {i <= currentIdx ? <CheckCircle2 className="h-3.5 w-3.5" /> : i}
                </div>
                <span className={`text-[9px] font-medium ${i <= currentIdx ? 'text-primary-700' : 'text-ink-400'}`}>{s}</span>
              </div>
              {i < steps.length - 1 && <div className={`h-0.5 flex-1 ${i < currentIdx ? 'bg-primary-500' : 'bg-ink-200'}`} />}
            </div>
          ))}
        </div>
        {booking.status !== 'Completed' && (
          <button onClick={() => advanceStatus(booking.id)} className="btn-primary mt-4 w-full">
            Advance to next status <ArrowRight className="h-4 w-4" />
          </button>
        )}
        {booking.status === 'Completed' && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary-50 p-3 text-sm text-primary-700">
            <CheckCircle2 className="h-4 w-4" /> Service completed. Rate your experience.
          </div>
        )}
      </div>
    </div>
  );
}

// --- Category workers listing ---
function CategoryWorkersView({ category, onBack, onSelect }: { category: ServiceCategory; onBack: () => void; onSelect: (w: Worker) => void }) {
  const workers = WORKERS.filter((w) => w.trade === category);
  const [sort, setSort] = useState('rating');
  const sorted = [...workers].sort((a, b) => workerSortValue(a, sort) - workerSortValue(b, sort));
  const catMeta = SERVICE_CATEGORIES.find((c) => c.name === category);

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="btn-ghost text-xs"><ArrowLeft className="h-4 w-4" /> Back to services</button>

      <div className="flex items-center gap-3">
        {catMeta && (
          <div className={`grid h-12 w-12 place-items-center rounded-xl ${catMeta.bg} ${catMeta.color}`}>
            {(Icons as unknown as Record<string, Icons.LucideIcon>)[catMeta.icon] && (() => { const I = (Icons as unknown as Record<string, Icons.LucideIcon>)[catMeta.icon]; return <I className="h-6 w-6" />; })()}
          </div>
        )}
        <div>
          <h1 className="font-display text-xl font-bold text-ink-900">Available {category} Professionals</h1>
          <p className="text-sm text-ink-600">{workers.length} verified cooperative workers near you</p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-ink-500 shrink-0">Sort by:</span>
        {[
          { id: 'rating', label: 'Top Rated' },
          { id: 'distance', label: 'Nearest' },
          { id: 'experience', label: 'Most Experienced' },
          { id: 'price', label: 'Lowest Price' },
        ].map((s) => (
          <button key={s.id} onClick={() => setSort(s.id)} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${sort === s.id ? 'bg-primary-600 text-white' : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {sorted.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {sorted.map((w) => (
            <CategoryWorkerCard key={w.id} worker={w} onSelect={() => onSelect(w)} />
          ))}
        </div>
      ) : (
        <div className="card p-6"><EmptyState icon={<Briefcase className="h-6 w-6" />} title={`No ${category} workers available`} subtitle="Try another service category." /></div>
      )}
    </div>
  );
}

function CategoryWorkerCard({ worker, onSelect }: { worker: Worker; onSelect: () => void }) {
  return (
    <div className="card-md p-5">
      <div className="flex items-start gap-4">
        <Avatar initials={worker.initials} color={worker.avatarColor} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-base font-bold text-ink-900">{worker.name}</p>
            <VerifiedBadge />
          </div>
          <p className="mt-0.5 text-sm text-ink-600">{worker.trade} • {worker.skills[0]}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-600">
            <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5 text-ink-400" /> {worker.experienceYears} yrs</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-ink-400" /> {worker.distanceKm} km</span>
            <RatingStars rating={worker.rating} />
            <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-ink-400" /> {worker.jobsCompleted} jobs</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-display text-lg font-bold text-ink-900">₹{startingPrice(worker)}</p>
          <p className="text-[10px] text-ink-500">onwards</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {worker.skills.map((s) => (
          <span key={s} className="chip bg-ink-100 text-ink-600">{s}</span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <Badge variant={worker.available ? 'success' : 'neutral'}>{worker.available ? (worker.availableNow ? 'Available now' : 'Available') : 'Busy'}</Badge>
        <button onClick={onSelect} className="btn-primary text-sm">
          Book / Select <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// --- AI request (optional) ---
const EXAMPLES = [
  'My bathroom pipe is leaking',
  'Two electrical switches are not working',
  'I need deep cleaning for my 3BHK',
  'My ceiling fan is making noise',
  'The kitchen door hinge is broken',
];

function AIRequestView({ onBack, onFindWorkers }: { onBack: () => void; onFindWorkers: (interp: ServiceInterpretation) => void }) {
  const [text, setText] = useState('');
  const [interpreting, setInterpreting] = useState(false);
  const [result, setResult] = useState<ServiceInterpretation | null>(null);

  function runInterpret() {
    if (!text.trim()) return;
    setInterpreting(true);
    setResult(null);
    setTimeout(() => {
      const r = interpretService(text);
      setResult(r);
      setInterpreting(false);
    }, 900);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      runInterpret();
    }
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="btn-ghost text-xs"><ArrowLeft className="h-4 w-4" /> Back to home</button>

      <div>
        <h1 className="font-display text-xl font-bold text-ink-900">Ask SahkaarServe AI</h1>
        <p className="mt-1 text-sm text-ink-600">Describe your problem in plain language. Our AI will understand the service, sub-service and priority for you.</p>
      </div>

      <div className="card-md p-5">
        <label className="text-sm font-semibold text-ink-700">Describe your request</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          placeholder="e.g. My bathroom pipe is leaking and water is spreading on the floor"
          className="input-field mt-2 resize-none"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button key={ex} onClick={() => setText(ex)} className="chip bg-ink-100 text-ink-600 hover:bg-ink-200">
              <Sparkles className="h-3 w-3" /> {ex}
            </button>
          ))}
        </div>
        <button onClick={runInterpret} disabled={!text.trim() || interpreting} className="btn-primary mt-4">
          {interpreting ? <><Loader2 className="h-4 w-4 animate-spin" /> AI is understanding…</> : <><Sparkles className="h-4 w-4" /> Interpret with AI</>}
        </button>
        <p className="mt-2 text-xs text-ink-400">Press Enter to submit</p>
      </div>

      {result && (
        <div className="card-md animate-slide-up overflow-hidden">
          <div className="flex items-center gap-2 border-b border-ink-100 bg-primary-50/50 px-5 py-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-100 text-primary-700"><Sparkles className="h-4 w-4" /></div>
            <p className="font-display text-sm font-bold text-ink-900">AI Understanding</p>
          </div>
          <div className="p-5">
            <p className="text-sm text-ink-700">{result.summary}</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoTile label="Service" value={result.category} />
              <InfoTile label="Sub-service" value={result.subService} />
              <InfoTile label="Priority" value={result.priority} highlight={result.priority === 'Critical' || result.priority === 'High' ? 'danger' : undefined} />
              <InfoTile label="Location" value={result.location} icon={<MapPin className="h-3.5 w-3.5" />} />
              <InfoTile label="Available Verified Workers" value={`${result.availableWorkers} nearby`} icon={<ShieldCheck className="h-3.5 w-3.5" />} />
            </div>
            <button onClick={() => onFindWorkers(result)} className="btn-primary mt-5">
              <Search className="h-4 w-4" /> Find Best Worker
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoTile({ label, value, highlight, icon }: { label: string; value: string; highlight?: 'danger'; icon?: React.ReactNode }) {
  return (
    <div className={`rounded-xl border p-3 ${highlight === 'danger' ? 'border-red-200 bg-red-50' : 'border-ink-200 bg-ink-50/50'}`}>
      <p className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-500">{icon} {label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${highlight === 'danger' ? 'text-danger' : 'text-ink-900'}`}>{value}</p>
    </div>
  );
}

function BookingsView() {
  const { bookings } = useBookings();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-ink-900">My Bookings</h1>
        <p className="mt-1 text-sm text-ink-600">Track all your service requests and their live status.</p>
      </div>
      {bookings.length === 0 ? (
        <div className="card p-6"><EmptyState icon={<CalendarClock className="h-6 w-6" />} title="No bookings yet" subtitle="Pick a category to start your first booking." /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bookings.map((b) => (
            <div key={b.id} className="card-md overflow-hidden">
              <div className="flex items-center justify-between border-b border-ink-100 p-4">
                <div>
                  <p className="font-display text-sm font-bold text-ink-900">{b.id}</p>
                  <p className="text-xs text-ink-500">{b.service} — {b.subService}</p>
                </div>
                <StatusPill status={b.status} />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar initials={b.workerName.split(' ').map((w) => w[0]).join('').slice(0, 2)} color="bg-primary-600" size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink-900">{b.workerName}</p>
                    <p className="text-xs text-ink-500">{b.date} · {b.time}</p>
                  </div>
                  <span className="text-sm font-bold text-ink-900">₹{b.cost}</span>
                </div>
                <p className="mt-3 text-xs text-ink-600">{b.description}</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-500">
                  <MapPin className="h-3.5 w-3.5" /> {b.location}
                </div>
                {b.isEmergency && <div className="mt-2"><Badge variant="danger" icon={<AlertTriangle className="h-3 w-3" />} >Emergency</Badge></div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmergencyView({ onBack }: { onBack: () => void }) {
  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ServiceInterpretation | null>(null);
  const [matches, setMatches] = useState<WorkerMatch[] | null>(null);
  const [selected, setSelected] = useState<WorkerMatch | null>(null);

  function run() {
    if (!text.trim()) return;
    setAnalyzing(true);
    setResult(null);
    setMatches(null);
    setTimeout(() => {
      const r = interpretService(text);
      r.priority = 'Critical';
      setResult(r);
      setAnalyzing(false);
      const m = matchWorkers(r.category, r.subService, r.location, true);
      setMatches(m);
    }, 800);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      run();
    }
  }

  if (selected && result) {
    return (
      <BookingFlow
        match={selected}
        interpretation={result}
        emergency
        onDone={() => { setSelected(null); }}
        onCancel={() => { setSelected(null); }}
      />
    );
  }

  const EMERGENCY_EXAMPLES = ['Water pipe burst', 'Electrical spark from switchboard', 'Gas smell in kitchen', 'AC not cooling at all'];

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="btn-ghost text-xs"><ArrowLeft className="h-4 w-4" /> Back to home</button>

      <div className="card-md overflow-hidden">
        <div className="flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-500 p-5 text-white">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/20 animate-pulse-ring"><AlertTriangle className="h-6 w-6" /></div>
          <div>
            <p className="font-display text-lg font-bold">Emergency Service</p>
            <p className="text-sm text-red-100">Report an urgent problem. We dispatch the nearest available verified worker immediately.</p>
          </div>
        </div>
        <div className="p-5">
          <label className="text-sm font-semibold text-ink-700">What is the emergency?</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder="e.g. Water pipe burst in the bathroom"
            className="input-field mt-2 resize-none"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {EMERGENCY_EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => setText(ex)} className="chip bg-red-50 text-red-700 hover:bg-red-100">
                <AlertTriangle className="h-3 w-3" /> {ex}
              </button>
            ))}
          </div>
          <button onClick={run} disabled={!text.trim() || analyzing} className="btn-primary mt-4 bg-red-600 hover:bg-red-700">
            {analyzing ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing emergency…</> : <><Zap className="h-4 w-4" /> Dispatch Now</>}
          </button>
        </div>
      </div>

      {result && (
        <div className="card-md animate-slide-up p-5">
          <div className="flex items-center gap-2">
            <Badge variant="danger" icon={<AlertTriangle className="h-3 w-3" />}>Emergency Priority: HIGH</Badge>
            <Badge variant="neutral">{result.category}</Badge>
          </div>
          <p className="mt-3 text-sm text-ink-700">{result.summary}</p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <InfoTile label="Service" value={result.category} />
            <InfoTile label="Issue" value={result.subService} />
            <InfoTile label="Available now" value={`${matches?.length ?? result.availableWorkers}`} highlight="danger" />
          </div>
        </div>
      )}

      {matches && <WorkerMatchView matches={matches} onSelect={setSelected} emergency onBack={onBack} />}
    </div>
  );
}
