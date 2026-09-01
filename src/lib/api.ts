// Centralized API client for Sahkaar Serve backend
// Falls back gracefully when backend is unavailable

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = opts;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = localStorage.getItem('ss_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();

  if (!res.ok) {
    const err = new Error(json.message || 'API request failed');
    (err as any).statusCode = res.status;
    throw err;
  }

  return json.data as T;
}

// ─── Demo-mode fallback (ONLY while the backend isn't hosted yet) ────────────
// fetch() throws a TypeError specifically when the request never reached a
// server at all (DNS/connection failure) — never for a real API response,
// even an error one (401/400/etc). So this only kicks in when the backend
// truly can't be reached, and never masks a genuine "wrong password" from a
// live backend. Once VITE_API_BASE_URL points to a real deployed backend,
// fetch() will succeed and this code path is simply never hit.
function isBackendUnreachable(err: unknown): boolean {
  return err instanceof TypeError;
}

function demoAuthResponse(input: { name?: string; phone?: string; email?: string; role: string }) {
  const label = input.phone || input.email || 'demo';
  const name = input.name?.trim() || `Demo ${input.role.charAt(0).toUpperCase()}${input.role.slice(1)}`;
  return {
    token: `demo-token.${input.role}.${Date.now()}`,
    user: {
      _id: `demo-${label}`,
      name,
      phone: input.phone || (input.email ? '' : label),
      email: input.email,
      role: input.role,
    },
  };
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  register: async (data: { name: string; phone: string; email?: string; password: string; role: string; skills?: string; primaryService?: string; experience?: number; serviceArea?: string }) => {
    try {
      return await request<{ token: string; user: any }>('/auth/register', { method: 'POST', body: data, auth: false });
    } catch (err) {
      if (isBackendUnreachable(err)) {
        console.warn('[SahkaarServe] Backend not reachable — using local demo account instead. Deploy the backend and set VITE_API_BASE_URL to switch to real auth.');
        return demoAuthResponse(data);
      }
      throw err;
    }
  },

  login: async (data: { phone?: string; email?: string; password: string; role: string }) => {
    try {
      return await request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: data, auth: false });
    } catch (err) {
      if (isBackendUnreachable(err)) {
        console.warn('[SahkaarServe] Backend not reachable — using local demo login instead. Deploy the backend and set VITE_API_BASE_URL to switch to real auth.');
        return demoAuthResponse(data);
      }
      throw err;
    }
  },

  getMe: () => request<{ user: any }>('/auth/me'),
};

// ─── Services ────────────────────────────────────────────────────────────────
export const servicesApi = {
  getAll: () => request<{ services: any[] }>('/services', { auth: false }),
};

// ─── Workers ─────────────────────────────────────────────────────────────────
export const workersApi = {
  getAll: (params?: { service?: string; available?: boolean }) => {
    const qs = params
      ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString()
      : '';
    return request<{ workers: any[] }>(`/workers${qs}`, { auth: false });
  },
  getMe: () => request<{ worker: any }>('/workers/me'),
  updateMe: (data: any) => request<{ worker: any }>('/workers/me', { method: 'PATCH', body: data }),
  getMyJobs: () => request<{ bookings: any[] }>('/workers/me/jobs'),
  getMyEarnings: () => request<{ earnings: any }>('/workers/me/earnings'),
  getMonthlyEarnings: () => request<{ monthly: any[] }>('/workers/me/earnings/monthly'),
  updateAvailability: (data: { availability: boolean; availableNow?: boolean }) =>
    request<{ worker: any }>('/workers/me/availability', { method: 'PATCH', body: data }),
};

// ─── Bookings ────────────────────────────────────────────────────────────────
export const bookingsApi = {
  create: (data: {
    workerId: string;
    serviceName: string;
    subService?: string;
    description?: string;
    scheduledDate?: string;
    scheduledTime?: string;
    isEmergency?: boolean;
    customerLocation: string;
    matchingScore?: number;
    priority?: string;
  }) => request<{ booking: any }>('/bookings', { method: 'POST', body: data }),

  getMy: () => request<{ bookings: any[] }>('/bookings/my'),

  getById: (id: string) => request<{ booking: any }>(`/bookings/${id}`),

  updateStatus: (id: string, status: string) =>
    request<{ booking: any }>(`/bookings/${id}/status`, { method: 'PATCH', body: { status } }),

  accept: (id: string) =>
    request<{ booking: any }>(`/bookings/${id}/accept`, { method: 'POST' }),

  reject: (id: string) =>
    request<{ booking: any }>(`/bookings/${id}/reject`, { method: 'POST' }),

  confirmPayment: (id: string, paymentMethod: string) =>
    request<{ booking: any }>(`/bookings/${id}/payment`, { method: 'POST', body: { paymentMethod } }),

  rate: (id: string, rating: number, review?: string) =>
    request<any>(`/bookings/${id}/rating`, { method: 'POST', body: { rating, review } }),

  fileComplaint: (id: string, description: string) =>
    request<any>(`/bookings/${id}/complaint`, { method: 'POST', body: { description } }),

  claimWarranty: (id: string, reason: string) =>
    request<any>(`/bookings/${id}/warranty`, { method: 'POST', body: { reason } }),

  claimInsurance: (id: string, description: string, claimedAmount: number) =>
    request<any>(`/bookings/${id}/insurance`, { method: 'POST', body: { description, claimedAmount } }),
};

// ─── Matching ────────────────────────────────────────────────────────────────
export const matchingApi = {
  recommend: (data: { serviceName: string; subService?: string; isEmergency?: boolean }) =>
    request<{ matches: any[] }>('/matching/recommend', { method: 'POST', body: data }),
};

// ─── AI ──────────────────────────────────────────────────────────────────────
export const aiApi = {
  parseRequest: (text: string) =>
    request<any>('/ai/parse-request', { method: 'POST', body: { text }, auth: false }),
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: () => request<{ notifications: any[]; unreadCount: number }>('/notifications'),
  markRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => request<any>('/notifications/all/read', { method: 'PATCH' }),
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminApi = {
  getDashboard: () => request<any>('/admin/dashboard'),
  getWorkers: (params?: { search?: string; status?: string }) => {
    const qs = params
      ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString()
      : '';
    return request<{ workers: any[] }>(`/admin/workers${qs}`);
  },
  getPendingWorkers: () => request<{ workers: any[] }>('/admin/workers/pending'),
  approveWorker: (id: string) => request<any>(`/admin/workers/${id}/approve`, { method: 'PATCH' }),
  rejectWorker: (id: string) => request<any>(`/admin/workers/${id}/reject`, { method: 'PATCH' }),
  getAllBookings: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<{ bookings: any[] }>(`/admin/bookings${qs}`);
  },
  getWeeklyDemand: () => request<{ weekly: any[] }>('/admin/demand/weekly'),
  getHeatmap: () => request<{ heatmap: any[] }>('/admin/demand/heatmap'),
  getForecast: () => request<{ forecast: any[] }>('/admin/demand/forecast'),
  getWorkforceRecommendations: () => request<{ recommendations: any[] }>('/admin/workforce-recommendations'),
  getEconomics: () => request<any>('/admin/economics'),
  getWelfare: () => request<any>('/admin/welfare'),
};

// ─── Health ──────────────────────────────────────────────────────────────────
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export default { authApi, servicesApi, workersApi, bookingsApi, matchingApi, aiApi, notificationsApi, adminApi, checkHealth };
