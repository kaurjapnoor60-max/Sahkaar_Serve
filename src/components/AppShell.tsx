import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Handshake, Bell, LogOut, Menu, X, Globe } from 'lucide-react';
import type { Role } from '@/types';
import { NOTIFICATIONS } from '@/data';
import { NotificationDot } from './ui';
import { useI18n, LANG_LABELS, LANG_CODES } from '@/i18n';
import type { Language } from '@/types';

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
}

export function AppShell({
  role,
  nav,
  active,
  onNavigate,
  onExit,
  user,
  children,
}: {
  role: Role;
  nav: NavItem[];
  active: string;
  onNavigate: (id: string) => void;
  onExit: () => void;
  user: { name: string; subtitle: string; initials: string; color: string };
  children: ReactNode;
}) {
  const { lang, setLang, t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const unread = NOTIFICATIONS.filter((n) => n.unread).length;

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [active]);

  const roleLabel = role === 'customer' ? 'Customer' : role === 'worker' ? 'Worker' : 'Administrator';
  const roleColor = role === 'customer' ? 'bg-primary-50 text-primary-700 ring-primary-200' : role === 'worker' ? 'bg-secondary-50 text-secondary-700 ring-secondary-200' : 'bg-teal-50 text-teal-700 ring-teal-200';

  const NavList = ({ onClick }: { onClick?: () => void }) => (
    <nav className="space-y-1">
      {nav.map((item) => (
        <button
          key={item.id}
          onClick={() => { onNavigate(item.id); onClick?.(); }}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            active === item.id
              ? 'bg-primary-50 text-primary-700'
              : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
          }`}
        >
          <span className={active === item.id ? 'text-primary-600' : 'text-ink-400'}>{item.icon}</span>
          {t(item.label)}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-ink-50/60">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-ink-200/70 bg-white lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-4">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-600 text-white shadow-sm">
            <Handshake className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-base font-bold leading-none text-ink-900">SahkaarServe</p>
            <p className="mt-1 text-[10px] font-medium text-ink-400">{t('Cooperative Service Platform')}</p>
          </div>
        </div>
        <div className="px-3 py-2">
          <span className={`chip ring-1 ${roleColor}`}>{roleLabel} View</span>
        </div>
        <div className="mt-2 flex-1 overflow-y-auto px-3">
          <NavList />
        </div>
        <div className="border-t border-ink-200/70 p-3">
          <div className="flex items-center gap-2.5 rounded-xl p-2">
            <div className={`grid h-9 w-9 place-items-center rounded-full ${user.color} text-xs font-bold text-white`}>{user.initials}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-900">{user.name}</p>
              <p className="truncate text-xs text-ink-500">{user.subtitle}</p>
            </div>
          </div>
          <button onClick={onExit} className="btn-ghost mt-1 w-full justify-start text-ink-500 hover:text-danger">
            <LogOut className="h-4 w-4" /> {t('Exit demo')}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-card-lg animate-slide-up">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-600 text-white"><Handshake className="h-5 w-5" /></div>
                <p className="font-display text-base font-bold text-ink-900">SahkaarServe</p>
              </div>
              <button onClick={() => setMobileOpen(false)} className="btn-ghost p-2"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-3 py-2"><span className={`chip ring-1 ${roleColor}`}>{roleLabel} View</span></div>
            <div className="mt-2 flex-1 overflow-y-auto px-3"><NavList onClick={() => setMobileOpen(false)} /></div>
            <div className="border-t border-ink-200/70 p-3">
              <button onClick={onExit} className="btn-ghost w-full justify-start text-ink-500"><LogOut className="h-4 w-4" /> {t('Exit demo')}</button>
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-ink-200/60 bg-white/85 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(true)} className="btn-ghost p-2 lg:hidden"><Menu className="h-5 w-5" /></button>
              <div className="lg:hidden flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-600 text-white"><Handshake className="h-4 w-4" /></div>
                <p className="font-display text-sm font-bold text-ink-900">SahkaarServe</p>
              </div>
              <p className="hidden text-sm font-semibold text-ink-800 lg:block">{nav.find((n) => n.id === active) ? t(nav.find((n) => n.id === active)!.label) : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setShowLang((s) => !s)} className="btn-ghost flex items-center gap-1 p-2 text-sm font-medium">
                  <Globe className="h-5 w-5" />
                  <span className="hidden sm:inline">{LANG_LABELS[lang]}</span>
                </button>
                {showLang && (
                  <div className="absolute right-0 mt-2 w-40 card-md p-2 animate-scale-in">
                    <p className="px-3 py-2 text-xs font-semibold text-ink-500">Language / भाषा / ਭਾਸ਼ਾ</p>
                    {LANG_CODES.map((code: Language) => (
                      <button
                        key={code}
                        onClick={() => { setLang(code); setShowLang(false); }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition ${lang === code ? 'bg-primary-50 text-primary-700' : 'text-ink-600 hover:bg-ink-50'}`}
                      >
                        {LANG_LABELS[code]}
                        {lang === code && <span className="h-2 w-2 rounded-full bg-primary-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button onClick={() => setShowNotif((s) => !s)} className="btn-ghost relative p-2">
                  <Bell className="h-5 w-5" />
                  {unread > 0 && <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-danger text-[9px] font-bold text-white">{unread}</span>}
                </button>
                {showNotif && (
                  <div className="absolute right-0 mt-2 w-80 card-md p-2 animate-scale-in">
                    <p className="px-3 py-2 text-xs font-semibold text-ink-500">Notifications</p>
                    {NOTIFICATIONS.map((n) => (
                      <div key={n.id} className="flex gap-3 rounded-xl px-3 py-2.5 hover:bg-ink-50">
                        <NotificationDot type={n.type} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-ink-900">{n.title}</p>
                          <p className="text-xs text-ink-600">{n.body}</p>
                          <p className="mt-0.5 text-[10px] text-ink-400">{n.time}</p>
                        </div>
                        {n.unread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-500" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className={`hidden h-9 w-9 place-items-center rounded-full ${user.color} text-xs font-bold text-white sm:grid`}>{user.initials}</div>
            </div>
          </div>
        </header>

        <main ref={mainRef} className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
