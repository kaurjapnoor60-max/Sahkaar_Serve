import { useState, useEffect } from 'react';
import { RoleSelect } from '@/components/RoleSelect';
import { AuthScreen } from '@/components/AuthScreen';
import { CustomerDashboard } from '@/components/CustomerDashboard';
import { WorkerDashboard } from '@/components/WorkerDashboard';
import { AdminDashboard } from '@/components/AdminDashboard';
import { BookingProvider } from '@/store';
import { I18nProvider } from '@/i18n';
import type { Role } from '@/types';
import { getStoredUser, getToken, clearSession } from '@/lib/auth';

interface SessionUser {
  name: string;
  mobile: string;
  email?: string;
  role: Role;
  category?: import('@/types').ServiceCategory;
  skills?: string[];
  experience?: number;
  serviceArea?: string;
  pendingVerification?: boolean;
}

export default function App() {
  return (
    <I18nProvider>
      <AppInner />
    </I18nProvider>
  );
}

function AppInner() {
  const [role, setRole] = useState<Role | null>(null);
  const [session, setSession] = useState<SessionUser | null>(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = getToken();
    const stored = getStoredUser();
    if (token && stored) {
      setRole(stored.role as Role);
      setSession({
        name: stored.name,
        mobile: stored.phone || '',
        email: stored.email,
        role: stored.role,
      });
    }
  }, []);

  function handleExit() {
    clearSession();
    setSession(null);
    setRole(null);
    // Scroll to top on exit
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (!role) {
    return (
      <RoleSelect
        onSelect={setRole}
        onAdminLogin={(user) => {
          setRole('admin');
          if (user) setSession(user);
        }}
      />
    );
  }

  if (role === 'admin') {
    return (
      <BookingProvider>
        <AdminDashboard role={role} onExit={handleExit} />
      </BookingProvider>
    );
  }

  if (!session) {
    return (
      <AuthScreen
        role={role}
        onBack={() => setRole(null)}
        onSuccess={(u) => setSession(u)}
      />
    );
  }

  return (
    <BookingProvider>
      {role === 'customer' && <CustomerDashboard role={role} onExit={handleExit} user={session} />}
      {role === 'worker' && <WorkerDashboard role={role} onExit={handleExit} user={session} />}
    </BookingProvider>
  );
}
