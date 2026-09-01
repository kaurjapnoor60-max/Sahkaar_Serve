import { useState } from 'react';
import { WEEKLY_DEMAND, FORECAST, REVENUE_SPLIT, DEMAND_AREAS } from '@/data';

export function BarChart({ data, height = 160, accent = 'primary' }: { data: { day: string; demand: number }[]; height?: number; accent?: 'primary' | 'secondary' }) {
  const max = Math.max(...data.map((d) => d.demand));
  const color = accent === 'primary' ? 'bg-primary-500' : 'bg-secondary-500';
  const barH = height - 24;
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d) => (
        <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
          <div className="relative flex w-full items-end justify-center" style={{ height: barH }}>
            <div
              className={`w-full max-w-[28px] rounded-t-lg ${color} transition-all duration-700 hover:opacity-90`}
              style={{ height: `${(d.demand / max) * 100}%`, minHeight: 4 }}
              title={`${d.day}: ${d.demand}`}
            >
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-ink-600">{d.demand}</span>
            </div>
          </div>
          <span className="text-[10px] font-medium text-ink-500">{d.day}</span>
        </div>
      ))}
    </div>
  );
}

export function WeeklyDemandChart() {
  return <BarChart data={WEEKLY_DEMAND} height={180} />;
}

export function ForecastChart() {
  const max = Math.max(...FORECAST.map((d) => Math.max(d.predicted, d.actual ?? 0)));
  const chartH = 200;
  const barH = chartH - 24;
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1.5" style={{ height: chartH }}>
        {FORECAST.map((d) => (
          <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
            <div className="relative flex w-full items-end justify-center gap-0.5" style={{ height: barH }}>
              <div
                className="w-2.5 rounded-t bg-secondary-400/70 transition-all duration-700"
                style={{ height: `${((d.actual ?? 0) / max) * 100}%`, minHeight: d.actual == null ? 0 : 4 }}
                title={`Actual: ${d.actual ?? '—'}`}
              />
              <div
                className="w-2.5 rounded-t bg-primary-500 transition-all duration-700"
                style={{ height: `${(d.predicted / max) * 100}%`, minHeight: 4 }}
                title={`Predicted: ${d.predicted}`}
              />
            </div>
            <span className="text-[9px] font-medium text-ink-500">{d.day}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs text-ink-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-primary-500" /> AI Predicted</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-secondary-400/70" /> Actual</span>
      </div>
    </div>
  );
}

export function DonutChart({ size = 180 }: { size?: number }) {
  const total = REVENUE_SPLIT.reduce((a, s) => a + s.value, 0);
  let offset = 0;
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          {REVENUE_SPLIT.map((seg) => {
            const dash = (seg.value / total) * circumference;
            const el = (
              <circle
                key={seg.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={14}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
              />
            );
            offset += dash;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="font-display text-2xl font-bold text-ink-900">82%</p>
            <p className="text-[10px] font-medium text-ink-500">to workers</p>
          </div>
        </div>
      </div>
      <div className="space-y-2.5">
        {REVENUE_SPLIT.map((seg) => (
          <div key={seg.label} className="flex items-center justify-between gap-6">
            <span className="inline-flex items-center gap-2 text-sm text-ink-700">
              <span className="h-3 w-3 rounded-full" style={{ background: seg.color }} />
              {seg.label}
            </span>
            <span className="text-sm font-semibold text-ink-900">{seg.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeatmapGrid() {
  const services = ['plumbing', 'electrical', 'cleaning', 'carpentry', 'painting', 'technical'] as const;
  const labels: Record<string, string> = { plumbing: 'Plumbing', electrical: 'Electrical', cleaning: 'Cleaning', carpentry: 'Carpentry', painting: 'Painting', technical: 'Technical' };
  const max = Math.max(...DEMAND_AREAS.flatMap((a) => services.map((s) => a[s])));
  const [selected, setSelected] = useState<{ area: string; service: string; value: number } | null>(null);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="text-left text-xs font-semibold text-ink-500 pb-2">Area</th>
              {services.map((s) => (
                <th key={s} className="px-1 text-center text-xs font-semibold text-ink-500 pb-2">{labels[s]}</th>
              ))}
              <th className="px-1 text-center text-xs font-semibold text-ink-500 pb-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {DEMAND_AREAS.map((area) => (
              <tr key={area.area}>
                <td className="whitespace-nowrap pr-2 text-xs font-medium text-ink-700">{area.area}</td>
                {services.map((s) => {
                  const v = area[s];
                  const intensity = v / max;
                  const bg = `rgba(18,183,106,${(0.12 + intensity * 0.75).toFixed(2)})`;
                  return (
                    <td key={s}>
                      <button
                        onClick={() => setSelected({ area: area.area, service: labels[s], value: v })}
                        className="grid h-10 min-w-[44px] place-items-center rounded-lg text-xs font-semibold text-ink-900 transition hover:scale-105 hover:ring-2 hover:ring-primary-400"
                        style={{ background: bg }}
                        title={`${labels[s]} — ${area.area}: ${v} requests`}
                      >
                        {v}
                      </button>
                    </td>
                  );
                })}
                <td className="grid h-10 min-w-[52px] place-items-center rounded-lg bg-ink-900 text-xs font-bold text-white">{area.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="card-md animate-slide-up border-primary-200 bg-primary-50/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-sm font-bold text-ink-900">{selected.service} demand in {selected.area}</p>
              <p className="mt-0.5 text-sm text-ink-600">{selected.value} service requests in the past week</p>
            </div>
            <button onClick={() => setSelected(null)} className="btn-ghost text-xs">Close</button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-ink-200 p-3">
              <p className="text-[10px] font-medium text-ink-500">Demand level</p>
              <p className="mt-0.5 text-sm font-bold text-ink-900">{selected.value > 70 ? 'High' : selected.value > 40 ? 'Medium' : 'Low'}</p>
            </div>
            <div className="rounded-xl border border-ink-200 p-3">
              <p className="text-[10px] font-medium text-ink-500">Available workers</p>
              <p className="mt-0.5 text-sm font-bold text-ink-900">{Math.ceil(selected.value / 20)} nearby</p>
            </div>
            <div className="rounded-xl border border-ink-200 p-3">
              <p className="text-[10px] font-medium text-ink-500">Avg response</p>
              <p className="mt-0.5 text-sm font-bold text-ink-900">{selected.value > 70 ? '35 min' : '20 min'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
