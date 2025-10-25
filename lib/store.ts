// lib/store.ts
export type IncidentState = 'pending' | 'revealed' | 'disputed' | 'resolved' | 'stale';

export type Incident = {
  id: string;
  state: IncidentState;
  title: string;
  location: string;
  plate: string;
  timestamp: string; // ISO
  evidenceHash?: string;
  cid?: string;
};

export type Report = {
  id: string;           // REP-xxxx
  description: string;
  fileName?: string;
  timestamp: string;    // ISO
};
export type Settings = {
  revealHours: number;   // plazo de revelación
  roles: { primary: boolean; secondary: boolean; verifier: boolean };
  metrics: { total: number; revealRate: number; avgResolutionH: number; activeDisputes: number };
};

const FEED_KEY = 'st_feed';
const REPORTS_KEY = 'st_reports';
const SETTINGS_KEY = 'st_settings';
const bus = new EventTarget();
export function onFeedChange(cb: () => void) {
  const handler = () => cb();
  bus.addEventListener('feed-changed', handler);
  return () => bus.removeEventListener('feed-changed', handler);
}
export function onReportsChange(cb: () => void) {
  const handler = () => cb();
  bus.addEventListener('reports-changed', handler);
  return () => bus.removeEventListener('reports-changed', handler);
}
export function getSettings(): Settings {
  const d: Settings = {
    revealHours: 24,
    roles: { primary: true, secondary: false, verifier: false },
    metrics: { total: 487, revealRate: 92.4, avgResolutionH: 4.2, activeDisputes: 2 },
  };
  try {
    const raw = (typeof window !== 'undefined') ? localStorage.getItem(SETTINGS_KEY) : null;
    return raw ? { ...d, ...JSON.parse(raw) } : d;
  } catch { return d; }
}
export function saveSettings(s: Settings) {
  if (typeof window !== 'undefined') localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}
function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}
function write<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getLocalFeed(): Incident[] { return read<Incident[]>(FEED_KEY, []); }
export function saveLocalFeed(items: Incident[]) { write(FEED_KEY, items); bus.dispatchEvent(new Event('feed-changed')); }
export function addIncident(inc: Incident) { saveLocalFeed([inc, ...getLocalFeed()]); }
export function updateIncident(id: string, patch: Partial<Incident>) {
  const next = getLocalFeed().map(i => i.id === id ? {...i, ...patch} : i);
  saveLocalFeed(next);
}

export function getReports(): Report[] { return read<Report[]>(REPORTS_KEY, []); }
export function saveReports(next: Report[]) { write(REPORTS_KEY, next); bus.dispatchEvent(new Event('reports-changed')); }
export function addReport(rep: Report) { saveReports([rep, ...getReports()]); }

export function clearAllForLogout() {
  write(FEED_KEY, []);
  write(REPORTS_KEY, []);
}
