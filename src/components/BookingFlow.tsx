import { useState } from 'react';
import { Calendar, Clock, MapPin, FileText, Check, ArrowLeft, CheckCircle2, PartyPopper, ChevronLeft, ChevronRight, ChevronDown, Wallet, ShieldCheck, Receipt, CreditCard, Smartphone, Building2, Star, AlertTriangle, Wrench, Heart } from 'lucide-react';
import { Avatar, Badge } from './ui';
import { AREAS, DAMAGE_INSURANCE_LIMIT, WARRANTY_DAYS } from '@/data';
import { useBookings } from '@/store';
import { useI18n } from '@/i18n';
import type { WorkerMatch, ServiceInterpretation, Booking } from '@/types';

const TIME_SLOTS = [
  { group: 'Morning', slots: ['8:00–10:00 AM', '10:00 AM–12:00 PM'] },
  { group: 'Afternoon', slots: ['12:00–2:00 PM', '2:00–4:00 PM'] },
  { group: 'Evening', slots: ['4:00–6:00 PM', '6:00–8:00 PM'] },
];

function unavailableSlots(workerId: string): string[] {
  const map: Record<string, string[]> = {
    w1: ['8:00–10:00 AM', '2:00–4:00 PM'],
    w2: ['10:00 AM–12:00 PM'],
    w3: ['12:00–2:00 PM', '6:00–8:00 PM'],
    w4: ['8:00–10:00 AM'],
    w5: [],
    w6: ['4:00–6:00 PM'],
  };
  return map[workerId] ?? [];
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function estimateCost(cat: string, emergency: boolean): number {
  const base: Record<string, number> = { Plumbing: 120, Electrical: 150, Carpentry: 180, Painting: 400, Cleaning: 250, Gardening: 150, Driving: 100, Caregiving: 200, 'Technical Services': 250 };
  const cost = base[cat] ?? 120;
  return emergency ? Math.round(cost * 1.5) : cost;
}

export function BookingFlow({
  match,
  interpretation,
  emergency = false,
  onDone,
  onCancel,
}: {
  match: WorkerMatch;
  interpretation: ServiceInterpretation;
  emergency?: boolean;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const { addBooking, setPayment } = useBookings();
  const [step, setStep] = useState<'form' | 'payment' | 'confirmed'>('form');
  const [selectedDate, setSelectedDate] = useState<Date | null>(emergency ? new Date() : null);
  const [emergencyDate, setEmergencyDate] = useState<Date | null>(null);
  const [emergencyTime, setEmergencyTime] = useState('');
  const [time, setTime] = useState(emergency ? 'Now' : '');
  const [location, setLocation] = useState(interpretation.location);
  const [description, setDescription] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [showEmergencyCalendar, setShowEmergencyCalendar] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'Net Banking'>('UPI');
  const [paying, setPaying] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const blockedSlots = unavailableSlots(match.worker.id);

  function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function formatDate(d: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  function formatDateLong(d: Date): string {
    return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  function formatTime(d: Date): string {
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  const cost = estimateCost(interpretation.category, emergency);
  const workerEarnings = Math.round(cost * 0.82);
  const coopOperations = Math.round(cost * 0.10);
  const welfareContribution = Math.round(cost * 0.06);
  const damageInsurancePremium = Math.round(cost * 0.02);

  function confirm() {
    if (!selectedDate && !emergency) return;
    if (!emergency && !time) return;
    if (emergency && !emergencyDate && time !== 'Now') return;
    const id = `SS${1024 + Math.floor(Math.random() * 800)}`;
    const dateStr = emergency ? 'Today' : formatDateLong(selectedDate!);
    const timeStr = emergency && time === 'Now' ? 'Now' : emergency && emergencyDate ? formatTime(emergencyDate) : time;
    const booking: Booking = {
      id,
      service: interpretation.category,
      subService: interpretation.subService,
      workerId: match.worker.id,
      workerName: match.worker.name,
      customerName: 'Priya Sharma',
      date: dateStr,
      time: timeStr,
      location,
      description: description || interpretation.summary,
      cost,
      status: 'Requested',
      priority: emergency ? 'Critical' : interpretation.priority,
      isEmergency: emergency,
      createdAt: 'Just now',
      timeline: [{ status: 'Requested', time: 'Now', done: true }],
    };
    addBooking(booking);
    setConfirmedBooking(booking);
    setStep('payment');
  }

  function processPayment() {
    if (!confirmedBooking) return;
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      setPayment(confirmedBooking.id, {
        totalAmount: cost,
        workerEarnings,
        coopOperations,
        welfareContribution,
        damageInsurancePremium,
        paidAt: 'Just now',
        method: paymentMethod,
      });
      setStep('confirmed');
    }, 1200);
  }

  if (step === 'confirmed' && confirmedBooking) {
    return <ConfirmedView booking={confirmedBooking} onDone={onDone} emergency={emergency} />;
  }

  if (step === 'payment' && confirmedBooking) {
    return (
      <PaymentView
        booking={confirmedBooking}
        cost={cost}
        workerEarnings={workerEarnings}
        coopOperations={coopOperations}
        welfareContribution={welfareContribution}
        damageInsurancePremium={damageInsurancePremium}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        paying={paying}
        onPay={processPayment}
        onBack={() => setStep('form')}
        t={t}
      />
    );
  }

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarCells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(new Date(year, month, d));

  const canConfirm = emergency
    ? time === 'Now' || (emergencyDate && emergencyTime)
    : (selectedDate && time);

  return (
    <div className="space-y-5">
      <button onClick={onCancel} className="btn-ghost text-xs"><ArrowLeft className="h-4 w-4" /> {t('Back')}</button>

      <div>
        <h1 className="font-display text-xl font-bold text-ink-900">{t('Confirm booking')}</h1>
        <p className="mt-1 text-sm text-ink-600">You're about to book {match.worker.name} for {interpretation.category} — {interpretation.subService}.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="card-md p-5">
            <div className="flex items-center gap-3">
              <Avatar initials={match.worker.initials} color={match.worker.avatarColor} size="md" />
              <div className="flex-1">
                <p className="font-display text-sm font-bold text-ink-900">{match.worker.name}</p>
                <p className="text-xs text-ink-500">{match.worker.trade} • {match.worker.experienceYears} yrs • {match.worker.distanceKm} km away</p>
              </div>
              <Badge variant="success">{match.matchScore}% match</Badge>
            </div>
          </div>

          {!emergency && (
            <div className="card-md p-5">
              <label className="text-sm font-semibold text-ink-700">{t('Select date')}</label>
              <div className="relative mt-2">
                <button
                  onClick={() => setShowCalendar((s) => !s)}
                  className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${selectedDate ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'}`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {selectedDate ? formatDate(selectedDate) : t('Select Date')}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition ${showCalendar ? 'rotate-180' : ''}`} />
                </button>

                {showCalendar && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowCalendar(false)} />
                    <div className="absolute left-0 top-full z-30 mt-1 w-72 rounded-2xl border border-ink-200 bg-white p-3 shadow-card-lg animate-scale-in">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setViewMonth(new Date(year, month - 1, 1))}
                          className="grid h-7 w-7 place-items-center rounded-lg text-ink-500 transition hover:bg-ink-100"
                          disabled={new Date(year, month, 1) <= new Date(today.getFullYear(), today.getMonth(), 1)}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <p className="font-display text-sm font-bold text-ink-900">{MONTH_NAMES[month]} {year}</p>
                        <button
                          onClick={() => setViewMonth(new Date(year, month + 1, 1))}
                          className="grid h-7 w-7 place-items-center rounded-lg text-ink-500 transition hover:bg-ink-100"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-2 grid grid-cols-7 gap-0.5">
                        {WEEKDAYS.map((wd) => (
                          <div key={wd} className="grid h-7 place-items-center text-[9px] font-semibold text-ink-400">{wd}</div>
                        ))}
                        {calendarCells.map((d, i) => {
                          if (!d) return <div key={i} />;
                          const isPast = d < today;
                          const isSelected = selectedDate && isSameDay(d, selectedDate);
                          const isToday = isSameDay(d, today);
                          return (
                            <button
                              key={i}
                              onClick={() => { if (!isPast) { setSelectedDate(d); setShowCalendar(false); } }}
                              disabled={isPast}
                              className={`grid h-8 place-items-center rounded-lg text-xs font-medium transition ${
                                isSelected
                                  ? 'bg-primary-600 text-white font-bold'
                                  : isPast
                                  ? 'text-ink-300 cursor-not-allowed'
                                  : isToday
                                  ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-300'
                                  : 'text-ink-700 hover:bg-ink-100'
                              }`}
                            >
                              {d.getDate()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Emergency: Select Date/Time or Dispatch Immediately */}
          {emergency && (
            <div className="card-md p-5">
              <label className="text-sm font-semibold text-ink-700">{t('Select time slot')}</label>
              <button
                onClick={() => { setTime('Now'); setEmergencyDate(null); setEmergencyTime(''); }}
                className={`mt-3 w-full rounded-xl border-2 p-3 text-sm font-semibold transition ${time === 'Now' ? 'border-red-500 bg-red-50 text-red-700' : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'}`}
              >
                Dispatch immediately (Now)
              </button>

              <div className="mt-4 flex items-center gap-2">
                <div className="flex-1 border-t border-dashed border-ink-200" />
                <span className="text-xs font-medium text-ink-400">OR schedule for later</span>
                <div className="flex-1 border-t border-dashed border-ink-200" />
              </div>

              <div className="mt-3">
                <label className="text-xs font-semibold text-ink-500">{t('Select date')}</label>
                <div className="relative mt-1.5">
                  <button
                    onClick={() => setShowEmergencyCalendar((s) => !s)}
                    className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition ${emergencyDate ? 'border-red-300 bg-red-50 text-red-700' : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'}`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {emergencyDate ? formatDate(emergencyDate) : t('Select Date')}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition ${showEmergencyCalendar ? 'rotate-180' : ''}`} />
                  </button>
                  {showEmergencyCalendar && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setShowEmergencyCalendar(false)} />
                      <div className="absolute left-0 top-full z-30 mt-1 w-72 rounded-2xl border border-ink-200 bg-white p-3 shadow-card-lg animate-scale-in">
                        <div className="flex items-center justify-between">
                          <button onClick={() => setViewMonth(new Date(year, month - 1, 1))} className="grid h-7 w-7 place-items-center rounded-lg text-ink-500 transition hover:bg-ink-100" disabled={new Date(year, month, 1) <= new Date(today.getFullYear(), today.getMonth(), 1)}>
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <p className="font-display text-sm font-bold text-ink-900">{MONTH_NAMES[month]} {year}</p>
                          <button onClick={() => setViewMonth(new Date(year, month + 1, 1))} className="grid h-7 w-7 place-items-center rounded-lg text-ink-500 transition hover:bg-ink-100">
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-2 grid grid-cols-7 gap-0.5">
                          {WEEKDAYS.map((wd) => <div key={wd} className="grid h-7 place-items-center text-[9px] font-semibold text-ink-400">{wd}</div>)}
                          {calendarCells.map((d, i) => {
                            if (!d) return <div key={i} />;
                            const isPast = d < today;
                            const isSelected = emergencyDate && isSameDay(d, emergencyDate);
                            return (
                              <button key={i} onClick={() => { if (!isPast) { setEmergencyDate(d); setShowEmergencyCalendar(false); } }} disabled={isPast}
                                className={`grid h-8 place-items-center rounded-lg text-xs font-medium transition ${isSelected ? 'bg-red-600 text-white font-bold' : isPast ? 'text-ink-300 cursor-not-allowed' : 'text-ink-700 hover:bg-ink-100'}`}>
                                {d.getDate()}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {emergencyDate && (
                <div className="mt-3">
                  <label className="text-xs font-semibold text-ink-500">{t('Time')}</label>
                  <input
                    type="time"
                    value={emergencyTime}
                    onChange={(e) => { setEmergencyTime(e.target.value); setTime('scheduled'); }}
                    className="input-field mt-1.5"
                  />
                </div>
              )}
            </div>
          )}

          {/* Time slots (non-emergency) */}
          {!emergency && (
            <div className="card-md p-5">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-ink-700">
                <Clock className="h-4 w-4" /> {t('Select time slot')}
              </div>
              <div className="mt-3 space-y-3">
                {TIME_SLOTS.map((group) => (
                  <div key={group.group}>
                    <p className="mb-1.5 text-xs font-semibold text-ink-500">{t(group.group)}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {group.slots.map((slot) => {
                        const isBlocked = blockedSlots.includes(slot);
                        const isSelected = time === slot;
                        return (
                          <button
                            key={slot}
                            onClick={() => !isBlocked && setTime(slot)}
                            disabled={isBlocked}
                            className={`rounded-xl border-2 p-2.5 text-sm font-semibold transition ${
                              isSelected
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : isBlocked
                                ? 'border-ink-100 bg-ink-50 text-ink-300 cursor-not-allowed line-through'
                                : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card-md space-y-4 p-5">
            <Field label={t('Location')} icon={<MapPin className="h-4 w-4" />}>
              <select value={location} onChange={(e) => setLocation(e.target.value)} className="input-field">
                {AREAS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </Field>
            <Field label={t('Problem description')} icon={<FileText className="h-4 w-4" />}>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder={interpretation.summary}
                className="input-field resize-none"
              />
            </Field>
          </div>

          <button onClick={confirm} disabled={!canConfirm} className={`btn-primary w-full ${emergency ? 'bg-red-600 hover:bg-red-700' : ''}`}>
            <Check className="h-4 w-4" /> {t('Confirm booking')}
          </button>
        </div>

        <div className="space-y-4">
          <div className="card-md p-5">
            <p className="text-xs font-semibold text-ink-500">{t('Booking summary')}</p>
            <dl className="mt-3 space-y-2.5 text-sm">
              <Row label={t('Service')} value={interpretation.category} />
              <Row label={t('Issue')} value={interpretation.subService} />
              <Row label={t('Worker')} value={match.worker.name} />
              <Row label={t('Date')} value={emergency ? 'Today' : selectedDate ? formatDateLong(selectedDate) : t('Not selected')} />
              <Row label={t('Time')} value={time === 'Now' ? 'Now' : time || (emergencyDate && emergencyTime ? formatTime(new Date(`${emergencyDate.toDateString()} ${emergencyTime}`)) : 'Not selected')} />
              <Row label={t('Location')} value={location} />
              <Row label={t('Priority')} value={emergency ? t('Critical') : t(interpretation.priority)} />
            </dl>
            <div className="mt-4 border-t border-ink-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink-600">{t('Estimated cost')}</span>
                <span className="font-display text-xl font-bold text-ink-900">₹{cost}</span>
              </div>
              <p className="mt-1 text-xs text-ink-400">{t('Final cost confirmed after service completion.')}</p>
            </div>
          </div>
          {emergency && (
            <div className="card-md border-red-200 bg-red-50/50 p-4">
              <p className="text-xs font-semibold text-red-700">{t('Emergency dispatch')}</p>
              <p className="mt-1 text-xs text-ink-600">{t('The worker will be alerted immediately and dispatched as a priority job.')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-700">{icon} {label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-500">{label}</dt>
      <dd className="text-right font-semibold text-ink-900">{value}</dd>
    </div>
  );
}

function PaymentView({
  booking, cost, workerEarnings, coopOperations, welfareContribution, damageInsurancePremium,
  paymentMethod, setPaymentMethod, paying, onPay, onBack, t,
}: {
  booking: Booking;
  cost: number;
  workerEarnings: number;
  coopOperations: number;
  welfareContribution: number;
  damageInsurancePremium: number;
  paymentMethod: 'UPI' | 'Card' | 'Net Banking';
  setPaymentMethod: (m: 'UPI' | 'Card' | 'Net Banking') => void;
  paying: boolean;
  onPay: () => void;
  onBack: () => void;
  t: (key: string) => string;
}) {
  const methods = [
    { id: 'UPI' as const, label: t('UPI'), icon: Smartphone, color: 'text-primary-600' },
    { id: 'Card' as const, label: t('Card'), icon: CreditCard, color: 'text-secondary-600' },
    { id: 'Net Banking' as const, label: t('Net Banking'), icon: Building2, color: 'text-teal-600' },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <button onClick={onBack} className="btn-ghost text-xs"><ArrowLeft className="h-4 w-4" /> {t('Back')}</button>

      <div>
        <h1 className="font-display text-xl font-bold text-ink-900">{t('Payment & Price Breakdown')}</h1>
        <p className="mt-1 text-sm text-ink-600">Transparent pricing — see exactly where your payment goes.</p>
      </div>

      <div className="card-md overflow-hidden">
        <div className="bg-gradient-to-r from-primary-700 to-primary-600 p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-100">Booking #{booking.id}</p>
              <p className="font-display text-lg font-bold">{booking.service} — {booking.subService}</p>
            </div>
            <Receipt className="h-8 w-8 text-white/70" />
          </div>
        </div>

        <div className="p-5">
          <p className="mb-4 text-sm font-semibold text-ink-700">{t('Invoice')}</p>
          <div className="space-y-3">
            <PaymentRow icon={<Wallet className="h-4 w-4 text-primary-600" />} label={t('Worker Earnings')} value={workerEarnings} sub="82% of total" />
            <PaymentRow icon={<Building2 className="h-4 w-4 text-secondary-600" />} label={t('Cooperative Operations')} value={coopOperations} sub="10% — operations & platform" />
            <PaymentRow icon={<Heart className="h-4 w-4 text-teal-600" />} label={t('Welfare Fund Contribution')} value={welfareContribution} sub="6% — health, insurance, tools" />
            <PaymentRow icon={<ShieldCheck className="h-4 w-4 text-amber-600" />} label={t('Damage Insurance Premium')} value={damageInsurancePremium} sub="2% — up to ₹5,000 cover" />
          </div>
          <div className="mt-4 border-t-2 border-ink-100 pt-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-base font-bold text-ink-900">{t('Total Amount')}</span>
              <span className="font-display text-2xl font-bold text-primary-700">₹{cost}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card-md p-5">
        <p className="text-sm font-semibold text-ink-700">{t('Payment Method')}</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {methods.map((m) => (
            <button
              key={m.id}
              onClick={() => setPaymentMethod(m.id)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition ${paymentMethod === m.id ? 'border-primary-500 bg-primary-50' : 'border-ink-200 bg-white hover:border-ink-300'}`}
            >
              <m.icon className={`h-6 w-6 ${m.color}`} />
              <span className="text-xs font-semibold text-ink-700">{m.label}</span>
            </button>
          ))}
        </div>

        {paymentMethod === 'UPI' && (
          <div className="mt-3 rounded-xl bg-ink-50 p-3 text-xs text-ink-500">
            Simulated UPI payment — enter any UPI ID to proceed (e.g. yourname@upi)
          </div>
        )}
        {paymentMethod === 'Card' && (
          <div className="mt-3 rounded-xl bg-ink-50 p-3 text-xs text-ink-500">
            Simulated card payment — no real card details required
          </div>
        )}
        {paymentMethod === 'Net Banking' && (
          <div className="mt-3 rounded-xl bg-ink-50 p-3 text-xs text-ink-500">
            Simulated net banking — select any bank to proceed
          </div>
        )}

        <button onClick={onPay} disabled={paying} className="btn-primary mt-4 w-full">
          {paying ? <><Clock className="h-4 w-4 animate-spin" /> Processing payment…</> : <><CheckCircle2 className="h-4 w-4" /> {t('Pay & Confirm')} ₹{cost}</>}
        </button>
      </div>
    </div>
  );
}

function PaymentRow({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number; sub: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-ink-50">{icon}</div>
        <div>
          <p className="text-sm font-medium text-ink-700">{label}</p>
          <p className="text-[10px] text-ink-400">{sub}</p>
        </div>
      </div>
      <p className="font-display text-sm font-bold text-ink-900">₹{value}</p>
    </div>
  );
}

function ConfirmedView({ booking, onDone, emergency }: { booking: Booking; onDone: () => void; emergency: boolean }) {
  const { t } = useI18n();
  const steps: Booking['status'][] = ['Requested', 'Accepted', 'On the Way', 'Service Started', 'Completed'];
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="card-md overflow-hidden animate-scale-in">
        <div className={`flex flex-col items-center gap-2 p-7 text-white ${emergency ? 'bg-gradient-to-br from-red-600 to-red-500' : 'bg-gradient-to-br from-primary-700 to-primary-600'}`}>
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/20">
            <PartyPopper className="h-8 w-8" />
          </div>
          <h1 className="font-display text-xl font-bold">{t('Booking Confirmed!')}</h1>
          <p className="text-sm text-white/80">{emergency ? t('Emergency worker dispatched') : t('Your request has been sent to the worker')}</p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between border-b border-ink-100 pb-4">
            <div>
              <p className="font-display text-2xl font-bold text-ink-900">#{booking.id}</p>
              <p className="text-sm text-ink-500">{booking.service} — {booking.subService}</p>
            </div>
            <Badge variant={emergency ? 'danger' : 'success'}>{emergency ? t('Emergency') : t('Requested')}</Badge>
          </div>
          <dl className="mt-4 space-y-2.5 text-sm">
            <Row label={t('Worker')} value={booking.workerName} />
            <Row label={t('Date')} value={booking.date} />
            <Row label={t('Time')} value={booking.time} />
            <Row label={t('Location')} value={booking.location} />
            <Row label={t('Estimated cost')} value={`₹${booking.cost}`} />
          </dl>

          <div className="mt-5">
            <p className="mb-3 text-sm font-semibold text-ink-700">{t('Booking timeline')}</p>
            <div className="space-y-0">
              {steps.map((s, i) => {
                const done = i === 0;
                return (
                  <div key={s} className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`grid h-7 w-7 place-items-center rounded-full ${done ? 'bg-primary-600 text-white' : 'bg-ink-100 text-ink-400'}`}>
                        {done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-3.5 w-3.5" />}
                      </div>
                      {i < steps.length - 1 && <div className="h-6 w-0.5 bg-ink-200" />}
                    </div>
                    <span className={`text-sm ${done ? 'font-semibold text-ink-900' : 'text-ink-400'}`}>{t(s)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={onDone} className="btn-primary mt-6 w-full">{t('View my bookings')}</button>
        </div>
      </div>
    </div>
  );
}
