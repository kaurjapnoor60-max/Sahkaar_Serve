import type { ReactNode } from 'react';
import { CheckCircle2, Star, AlertTriangle, ShieldCheck, Info, Heart } from 'lucide-react';

export function Avatar({ initials, color, size = 'md' }: { initials: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'h-9 w-9 text-xs' : size === 'lg' ? 'h-16 w-16 text-xl' : 'h-12 w-12 text-sm';
  return (
    <div className={`${dim} ${color} rounded-full grid place-items-center font-bold text-white shrink-0 shadow-sm`}>
      {initials}
    </div>
  );
}

export function Badge({
  children,
  variant = 'neutral',
  icon,
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'teal' | 'success' | 'warning' | 'danger' | 'neutral';
  icon?: ReactNode;
}) {
  const styles: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-700 ring-primary-200',
    secondary: 'bg-secondary-50 text-secondary-700 ring-secondary-200',
    teal: 'bg-teal-50 text-teal-700 ring-teal-200',
    success: 'bg-primary-50 text-primary-700 ring-primary-200',
    warning: 'bg-amber-50 text-amber-700 ring-amber-200',
    danger: 'bg-red-50 text-red-700 ring-red-200',
    neutral: 'bg-ink-100 text-ink-600 ring-ink-200',
  };
  return (
    <span className={`chip ring-1 ${styles[variant]}`}>
      {icon}
      {children}
    </span>
  );
}

export function VerifiedBadge({ label = 'Verified' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 ring-1 ring-primary-200">
      <ShieldCheck className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

export function RatingStars({ rating, showValue = true }: { rating: number; showValue?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      <span className="text-sm font-semibold text-ink-800">{rating.toFixed(1)}</span>
      {!showValue && <span className="sr-only">{rating}</span>}
    </span>
  );
}

export function StatTile({
  label,
  value,
  sub,
  icon,
  accent = 'primary',
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  icon?: ReactNode;
  accent?: 'primary' | 'secondary' | 'teal' | 'accent' | 'neutral';
}) {
  const accents: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-600',
    secondary: 'bg-secondary-50 text-secondary-600',
    teal: 'bg-teal-50 text-teal-600',
    accent: 'bg-accent-50 text-accent-600',
    neutral: 'bg-ink-100 text-ink-600',
  };
  return (
    <div className="card p-4 animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-ink-500">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink-900">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-ink-500">{sub}</p>}
        </div>
        {icon && <div className={`grid h-9 w-9 place-items-center rounded-xl ${accents[accent]}`}>{icon}</div>}
      </div>
    </div>
  );
}

export function ProgressBar({ value, color = 'bg-primary-500', track = 'bg-ink-100' }: { value: number; color?: string; track?: string }) {
  return (
    <div className={`h-2 w-full rounded-full ${track} overflow-hidden`}>
      <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export function NotificationDot({ type }: { type: 'success' | 'info' | 'coop' }) {
  const map = {
    success: <CheckCircle2 className="h-4 w-4 text-primary-600" />,
    info: <Info className="h-4 w-4 text-secondary-600" />,
    coop: <Heart className="h-4 w-4 text-teal-600" />,
  };
  return map[type];
}

export function EmptyState({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-100 text-ink-400">{icon}</div>
      <p className="text-sm font-semibold text-ink-700">{title}</p>
      {subtitle && <p className="text-xs text-ink-500 max-w-xs">{subtitle}</p>}
    </div>
  );
}

export { CheckCircle2, Star, AlertTriangle, ShieldCheck, Info, Heart };
