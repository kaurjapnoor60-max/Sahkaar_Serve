import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Booking, BookingStatus, PaymentBreakdown, ServiceRating } from '@/types';
import { bookingsApi } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface BookingState {
  bookings: Booking[];
  loading: boolean;
  addBooking: (b: Booking) => void;
  updateStatus: (id: string, status: BookingStatus) => void;
  advanceStatus: (id: string) => void;
  setPayment: (id: string, payment: PaymentBreakdown) => void;
  setRating: (id: string, rating: ServiceRating) => void;
  claimWarranty: (id: string, reason: string) => void;
  claimInsurance: (id: string, reason: string, amount: number) => void;
  activeBooking: Booking | undefined;
  // API-backed methods
  addBookingFromApi: (b: Booking) => void;
  updateStatusViaApi: (id: string, status: BookingStatus) => Promise<void>;
}

const BookingContext = createContext<BookingState | null>(null);

const STATUS_FLOW: BookingStatus[] = ['Requested', 'Accepted', 'On the Way', 'Service Started', 'Completed', 'Paid', 'Rated'];

// --- Status transition guard ---------------------------------------------
// Har status se sirf yeh next statuses allowed hain. Jo yahan list nahi,
// woh invalid jump maana jayega aur block ho jayega.
const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  'Requested': ['Accepted', 'Rejected'],
  'Accepted': ['On the Way', 'Rejected'],
  'On the Way': ['Service Started'],
  'Service Started': ['Completed'],
  'Completed': ['Paid'],
  'Paid': ['Rated'],
  // Terminal states — inse aage koi transition allowed nahi
  'Rejected': [],
  'Rated': [],
};

const TERMINAL_STATUSES: BookingStatus[] = ['Rejected', 'Rated'];

function isValidTransition(from: BookingStatus, to: BookingStatus): boolean {
  if (from === to) return false; // no-op jump bhi allow nahi
  if (TERMINAL_STATUSES.includes(from)) return false;
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
// ---------------------------------------------------------------------------

const SEED_BOOKINGS: Booking[] = [
  {
    id: 'SS1018',
    service: 'Electrical',
    subService: 'Switch Replacement',
    workerId: 'w4',
    workerName: 'Anil Verma',
    customerName: 'Priya Sharma',
    date: 'Yesterday',
    time: '4:30 PM',
    location: 'Swaroop Nagar, Kanpur',
    description: 'Two switches in the kitchen are not working.',
    cost: 150,
    status: 'Rated',
    priority: 'Normal',
    isEmergency: false,
    createdAt: 'Yesterday',
    timeline: [
      { status: 'Requested', time: '3:55 PM', done: true },
      { status: 'Accepted', time: '4:00 PM', done: true },
      { status: 'On the Way', time: '4:20 PM', done: true },
      { status: 'Service Started', time: '4:35 PM', done: true },
      { status: 'Completed', time: '5:10 PM', done: true },
      { status: 'Paid', time: '5:12 PM', done: true },
      { status: 'Rated', time: '5:20 PM', done: true },
    ],
    payment: { totalAmount: 150, workerEarnings: 123, coopOperations: 15, welfareContribution: 9, damageInsurancePremium: 3, paidAt: 'Yesterday 5:12 PM', method: 'UPI' },
    rating: { stars: 5, feedback: 'Quick and professional work. Switches working perfectly.', hasComplaint: false, ratedAt: 'Yesterday 5:20 PM' },
  },
  {
    id: 'SS1023',
    service: 'Cleaning',
    subService: 'Deep Cleaning',
    workerId: 'w3',
    workerName: 'Sunita Devi',
    customerName: 'Priya Sharma',
    date: '3 days ago',
    time: '10:00 AM',
    location: 'Swaroop Nagar, Kanpur',
    description: 'Full home deep cleaning before a family event.',
    cost: 400,
    status: 'Rated',
    priority: 'Normal',
    isEmergency: false,
    createdAt: '3 days ago',
    timeline: [
      { status: 'Requested', time: '9:50 AM', done: true },
      { status: 'Accepted', time: '9:55 AM', done: true },
      { status: 'On the Way', time: '10:00 AM', done: true },
      { status: 'Service Started', time: '10:10 AM', done: true },
      { status: 'Completed', time: '1:30 PM', done: true },
      { status: 'Paid', time: '1:35 PM', done: true },
      { status: 'Rated', time: '2:00 PM', done: true },
    ],
    payment: { totalAmount: 400, workerEarnings: 328, coopOperations: 40, welfareContribution: 32, damageInsurancePremium: 0, paidAt: '3 days ago 1:35 PM', method: 'Card' },
    rating: { stars: 4, feedback: 'Good cleaning, a few spots missed in the kitchen.', hasComplaint: false, ratedAt: '3 days ago 2:00 PM' },
  },
  {
    id: 'SS1041',
    service: 'Plumbing',
    subService: 'Pipe Repair',
    workerId: 'w1',
    workerName: 'Rajesh Kumar',
    customerName: 'Amit Gupta',
    date: 'Today',
    time: '11:00 AM',
    location: 'Swaroop Nagar, Kanpur',
    description: 'Kitchen pipe leaking under the sink.',
    cost: 120,
    status: 'On the Way',
    priority: 'Normal',
    isEmergency: false,
    createdAt: 'Today',
    timeline: [
      { status: 'Requested', time: '10:30 AM', done: true },
      { status: 'Accepted', time: '10:35 AM', done: true },
      { status: 'On the Way', time: '10:50 AM', done: true },
      { status: 'Service Started', time: '', done: false },
      { status: 'Completed', time: '', done: false },
    ],
  },
  {
    id: 'SS1042',
    service: 'Plumbing',
    subService: 'Tap Fitting',
    workerId: 'w1',
    workerName: 'Rajesh Kumar',
    customerName: 'Meera Joshi',
    date: 'Today',
    time: '3:00 PM',
    location: 'Civil Lines, Kanpur',
    description: 'Bathroom tap needs replacement.',
    cost: 120,
    status: 'Accepted',
    priority: 'Normal',
    isEmergency: false,
    createdAt: 'Today',
    timeline: [
      { status: 'Requested', time: '1:00 PM', done: true },
      { status: 'Accepted', time: '1:15 PM', done: true },
      { status: 'On the Way', time: '', done: false },
      { status: 'Service Started', time: '', done: false },
      { status: 'Completed', time: '', done: false },
    ],
  },
  {
    id: 'SS1043',
    service: 'Plumbing',
    subService: 'Drainage Cleaning',
    workerId: 'w1',
    workerName: 'Rajesh Kumar',
    customerName: 'Ravi Reddy',
    date: 'Tomorrow',
    time: '10:00 AM',
    location: 'Kakadeo, Kanpur',
    description: 'Blocked drainage in the bathroom.',
    cost: 150,
    status: 'Requested',
    priority: 'Normal',
    isEmergency: false,
    createdAt: 'Today',
    timeline: [
      { status: 'Requested', time: '2:00 PM', done: true },
      { status: 'Accepted', time: '', done: false },
      { status: 'On the Way', time: '', done: false },
      { status: 'Service Started', time: '', done: false },
      { status: 'Completed', time: '', done: false },
    ],
  },
  {
    id: 'SS1037',
    service: 'Plumbing',
    subService: 'Geyser Installation',
    workerId: 'w1',
    workerName: 'Rajesh Kumar',
    customerName: 'Kavita Nair',
    date: 'Yesterday',
    time: '5:00 PM',
    location: 'Swaroop Nagar, Kanpur',
    description: 'Install new geyser in bathroom.',
    cost: 180,
    status: 'Rated',
    priority: 'Normal',
    isEmergency: false,
    createdAt: 'Yesterday',
    timeline: [
      { status: 'Requested', time: '4:30 PM', done: true },
      { status: 'Accepted', time: '4:35 PM', done: true },
      { status: 'On the Way', time: '4:50 PM', done: true },
      { status: 'Service Started', time: '5:05 PM', done: true },
      { status: 'Completed', time: '6:00 PM', done: true },
      { status: 'Paid', time: '6:05 PM', done: true },
      { status: 'Rated', time: '6:30 PM', done: true },
    ],
    payment: { totalAmount: 180, workerEarnings: 148, coopOperations: 18, welfareContribution: 11, damageInsurancePremium: 3, paidAt: 'Yesterday 6:05 PM', method: 'UPI' },
    rating: { stars: 5, feedback: 'Excellent geyser installation, very neat work.', hasComplaint: false, ratedAt: 'Yesterday 6:30 PM' },
  },
  {
    id: 'SS1031',
    service: 'Plumbing',
    subService: 'Pipe Repair',
    workerId: 'w1',
    workerName: 'Rajesh Kumar',
    customerName: 'Suresh Pillai',
    date: '2 days ago',
    time: '9:00 AM',
    location: 'Kidwai Nagar, Kanpur',
    description: 'Burst pipe in warehouse restroom.',
    cost: 250,
    status: 'Rated',
    priority: 'High',
    isEmergency: false,
    createdAt: '2 days ago',
    timeline: [
      { status: 'Requested', time: '8:30 AM', done: true },
      { status: 'Accepted', time: '8:35 AM', done: true },
      { status: 'On the Way', time: '8:45 AM', done: true },
      { status: 'Service Started', time: '9:05 AM', done: true },
      { status: 'Completed', time: '10:30 AM', done: true },
      { status: 'Paid', time: '10:35 AM', done: true },
      { status: 'Rated', time: '11:00 AM', done: true },
    ],
    payment: { totalAmount: 250, workerEarnings: 205, coopOperations: 25, welfareContribution: 15, damageInsurancePremium: 5, paidAt: '2 days ago 10:35 AM', method: 'Cash' },
    rating: { stars: 4, feedback: 'Fixed the burst pipe quickly. Would recommend.', hasComplaint: false, ratedAt: '2 days ago 11:00 AM' },
  },
  {
    id: 'SS1029',
    service: 'Plumbing',
    subService: 'Leak Detection',
    workerId: 'w1',
    workerName: 'Rajesh Kumar',
    customerName: 'Pooja Mehta',
    date: '3 days ago',
    time: '2:00 PM',
    location: 'Govind Nagar, Kanpur',
    description: 'Water leaking from concealed pipe in wall.',
    cost: 150,
    status: 'Rated',
    priority: 'Normal',
    isEmergency: false,
    createdAt: '3 days ago',
    timeline: [
      { status: 'Requested', time: '1:30 PM', done: true },
      { status: 'Accepted', time: '1:35 PM', done: true },
      { status: 'On the Way', time: '1:50 PM', done: true },
      { status: 'Service Started', time: '2:05 PM', done: true },
      { status: 'Completed', time: '3:30 PM', done: true },
      { status: 'Paid', time: '3:35 PM', done: true },
      { status: 'Rated', time: '4:00 PM', done: true },
    ],
    payment: { totalAmount: 150, workerEarnings: 123, coopOperations: 15, welfareContribution: 9, damageInsurancePremium: 3, paidAt: '3 days ago 3:35 PM', method: 'UPI' },
    rating: { stars: 5, feedback: 'Found the leak instantly. Great expertise.', hasComplaint: false, ratedAt: '3 days ago 4:00 PM' },
  },
];

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>(SEED_BOOKINGS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadBookings() {
      if (!getToken()) return;
      setLoading(true);
      try {
        const data = await bookingsApi.getMyBookings();
        if (data && Array.isArray(data)) {
          // Map backend bookings to frontend booking format
          const mapped = data.map((b: any) => ({
            id: b._id,
            workerId: b.workerId,
            workerName: b.workerName || 'Assigned Worker',
            customerName: b.customerName || 'Customer',
            service: b.serviceName,
            subService: b.subService,
            date: b.scheduledDate,
            time: b.scheduledTime,
            status: b.status.split('_').map((s: string) => s.charAt(0) + s.slice(1).toLowerCase()).join(' ') as BookingStatus,
            amount: 500, // Fallback amount
            timeline: [
              { status: 'Requested', time: new Date(b.createdAt).toLocaleTimeString(), done: true },
              ...(b.status !== 'REQUESTED' ? [{ status: 'Accepted', time: 'Later', done: true }] : [])
            ]
          }));
          setBookings(mapped);
        }
      } catch (e) {
        console.error('Failed to load bookings from API:', e);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, []);

  // API-backed: add a booking returned from the backend
  const addBookingFromApi = useCallback((b: Booking) => {
    setBookings((prev) => [b, ...prev]);
  }, []);

  // API-backed: advance status via backend then reflect locally
  const updateStatusViaApi = useCallback(async (id: string, newStatus: BookingStatus) => {
    setBookings((prev) => {
      const current = prev.find((b) => b.id === id);
      if (current && !isValidTransition(current.status, newStatus)) {
        console.warn(`Blocked invalid transition: ${current.status} -> ${newStatus} (booking ${id})`);
        return prev;
      }
      return prev; // state update actually happens below after API call
    });

    const current = bookings.find((b) => b.id === id);
    if (current && !isValidTransition(current.status, newStatus)) {
      return; // guard: don't even hit the API for an invalid jump
    }

    try {
      // Map frontend status strings to backend enum values
      const statusMap: Record<string, string> = {
        'Accepted': 'ACCEPTED', 'Rejected': 'REJECTED',
        'On the Way': 'ON_THE_WAY', 'Service Started': 'SERVICE_STARTED',
        'Completed': 'SERVICE_COMPLETED',
      };
      const backendStatus = statusMap[newStatus] || newStatus.toUpperCase().replace(/ /g, '_');
      if (getToken()) {
        await bookingsApi.updateStatus(id, backendStatus);
      }
    } catch (e) {
      console.warn('API status update failed, falling back to local:', e);
    }
    // Always update local state regardless
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        if (!isValidTransition(b.status, newStatus)) {
          console.warn(`Blocked invalid transition: ${b.status} -> ${newStatus} (booking ${id})`);
          return b;
        }
        const idx = STATUS_FLOW.indexOf(newStatus);
        const timeline = b.timeline.map((t) => ({ ...t, done: STATUS_FLOW.indexOf(t.status) <= idx }));
        if (idx >= 0 && !timeline.some((t) => t.status === newStatus)) {
          timeline.push({ status: newStatus, time: 'Now', done: true });
        }
        return { ...b, status: newStatus, timeline };
      }),
    );
  }, [bookings]);

  const addBooking = useCallback((b: Booking) => {
    setBookings((prev) => [b, ...prev]);
  }, []);

  const updateStatus = useCallback((id: string, status: BookingStatus) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        if (!isValidTransition(b.status, status)) {
          console.warn(`Blocked invalid transition: ${b.status} -> ${status} (booking ${id})`);
          return b;
        }
        const idx = STATUS_FLOW.indexOf(status);
        const timeline = b.timeline.map((t) => ({ ...t, done: STATUS_FLOW.indexOf(t.status) <= idx }));
        if (idx >= 0 && !timeline.some((t) => t.status === status)) {
          timeline.push({ status, time: 'Now', done: true });
        }
        return { ...b, status, timeline };
      }),
    );
  }, []);

  const advanceStatus = useCallback((id: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        const idx = STATUS_FLOW.indexOf(b.status);
        if (idx < 0 || idx >= STATUS_FLOW.length - 1) return b;
        const next = STATUS_FLOW[idx + 1];
        if (!isValidTransition(b.status, next)) {
          console.warn(`Blocked invalid transition: ${b.status} -> ${next} (booking ${id})`);
          return b;
        }
        const timeline = b.timeline.map((t) => ({ ...t, done: true }));
        if (!timeline.some((t) => t.status === next)) {
          timeline.push({ status: next, time: 'Now', done: true });
        }
        return { ...b, status: next, timeline };
      }),
    );
  }, []);

  const setPayment = useCallback((id: string, payment: PaymentBreakdown) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, payment, status: 'Paid' } : b)));
  }, []);

  const setRating = useCallback((id: string, rating: ServiceRating) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, rating, status: 'Rated' } : b)));
  }, []);

  const claimWarranty = useCallback((id: string, reason: string) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, warrantyClaimed: true, warrantyClaimReason: reason } : b)));
  }, []);

  const claimInsurance = useCallback((id: string, reason: string, amount: number) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, insuranceClaimed: true, insuranceClaimReason: reason, insuranceAmount: amount } : b)));
  }, []);

  const activeBooking = bookings.find((b) => b.status !== 'Rated' && b.status !== 'Rejected' && b.status !== 'Paid' && b.status !== 'Completed');

  return (
    <BookingContext.Provider value={{ bookings, loading, addBooking, updateStatus, advanceStatus, setPayment, setRating, claimWarranty, claimInsurance, activeBooking, addBookingFromApi, updateStatusViaApi }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBookings() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBookings must be used within BookingProvider');
  return ctx;
}
