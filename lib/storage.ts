import { AppState, LogEntry, FavouriteFood } from './types';

// Master favourites list. Bump MASTER_FAVOURITES_VERSION after editing this
// list to push it to existing data on next load (see applyMasterFavourites).
export const MASTER_FAVOURITES_VERSION = 1;

const DEFAULT_FAVOURITES: FavouriteFood[] = [
  { id: 'master_1', name: 'Yoghurt - Pouch/Tub', type: 'meal', calories: 95, protein: 15, quantity: 1, unit: 'serve', emoji: '🫐' },
  { id: 'master_2', name: 'Yoghurt and Berries', type: 'meal', calories: 180, protein: 25, quantity: 1, unit: 'serve', emoji: '🫐' },
  { id: 'master_3', name: 'Coopers Mild', type: 'alcohol', calories: 127, protein: 1, quantity: 1, unit: 'serve', emoji: '🍺' },
  { id: 'master_4', name: 'XXXX Gold', type: 'alcohol', calories: 109, protein: 1, quantity: 1, unit: 'serve', emoji: '🍺' },
  { id: 'master_5', name: 'Heineken Silver', type: 'alcohol', calories: 88, protein: 1, quantity: 1, unit: 'serve', emoji: '🍺' },
  { id: 'master_6', name: 'Coopers Pale', type: 'alcohol', calories: 145, protein: 1, quantity: 1, unit: 'serve', emoji: '🍺' },
  { id: 'master_7', name: 'Heineken Lager', type: 'alcohol', calories: 132, protein: 1, quantity: 1, unit: 'serve', emoji: '🍺' },
  { id: 'master_8', name: 'Spaghetti Bolognese', type: 'meal', calories: 1100, protein: 70, quantity: 1, unit: 'serve', emoji: '🍜' },
  { id: 'master_9', name: 'Ragu Pasta', type: 'meal', calories: 900, protein: 55, quantity: 1, unit: 'serve', emoji: '🍜' },
  { id: 'master_10', name: 'Protein Shake', type: 'drink', calories: 220, protein: 30, quantity: 1, unit: 'serve', emoji: '🥤' },
  { id: 'master_11', name: 'Red Wine', type: 'alcohol', calories: 125, quantity: 1, unit: 'serve', emoji: '🍷' },
  { id: 'master_12', name: 'Home Flat White', type: 'drink', calories: 100, protein: 5, quantity: 1, unit: 'serve', emoji: '☕' },
  { id: 'master_13', name: 'Burger', type: 'meal', calories: 1100, protein: 56, quantity: 1, unit: 'serve', emoji: '🍔' },
  { id: 'master_14', name: 'Chocolate Milk', type: 'drink', calories: 170, protein: 8, quantity: 1, unit: 'serve', emoji: '🧃' },
  { id: 'master_15', name: 'Instant Coffee', type: 'drink', calories: 50, protein: 2, quantity: 1, unit: 'serve', emoji: '☕' },
  { id: 'master_16', name: 'Crusty Bread', type: 'meal', calories: 180, protein: 4, quantity: 1, unit: 'serve', emoji: '🍞' },
  { id: 'master_17', name: 'Tacos', type: 'meal', calories: 750, protein: 50, quantity: 1, unit: 'serve', emoji: '🌮' },
];

export const DEFAULT_STATE: AppState = {
  entries: [],
  favourites: DEFAULT_FAVOURITES,
  favouritesVersion: MASTER_FAVOURITES_VERSION,
  dailyCalorieGoal: 3300,
  dailyProteinGoal: 160,
  dailyWaterGoalMl: 2000,
};

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// All diary dates are Adelaide calendar dates (YYYY-MM-DD), regardless of
// where the code runs. Never derive a date with toISOString() on "now" — that
// gives the UTC date, which lags Adelaide until 9:30/10:30am.
const ADELAIDE_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Australia/Adelaide',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function getTodayStr(): string {
  return ADELAIDE_DATE.format(new Date());
}

// Pure calendar arithmetic on a YYYY-MM-DD string (no time zone involved).
export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// Adelaide date `daysAgo` days before today.
export function getDateStr(daysAgo = 0): string {
  return addDays(getTodayStr(), -daysAgo);
}

export function getEntriesForDate(entries: LogEntry[], date: string): LogEntry[] {
  return entries
    .filter(e => e.date === date)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function sumCalories(entries: LogEntry[]): number {
  return entries.reduce((sum, e) => sum + e.calories, 0);
}

export function sumProtein(entries: LogEntry[]): number {
  return entries.reduce((sum, e) => sum + (e.protein || 0), 0);
}

export function sumWaterMl(entries: LogEntry[]): number {
  return entries
    .filter(e => e.type === 'water' || e.type === 'drink')
    .reduce((sum, e) => sum + (e.ml || 0), 0);
}

function getLastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) days.push(getDateStr(i));
  return days;
}

export function getLast7Days(): string[] {
  return getLastNDays(7);
}

export function getLast30Days(): string[] {
  return getLastNDays(30);
}

// Order favourites by how often they were logged in the last 30 days, then by
// most recent use, then by the order they were added. Matches on favouriteId,
// or on name for entries logged before favouriteId existed.
export function sortFavouritesByUse(favourites: FavouriteFood[], entries: LogEntry[]): FavouriteFood[] {
  const cutoff = getDateStr(29);
  const byId = new Map(favourites.map(f => [f.id, f]));
  const byName = new Map(favourites.map(f => [f.name.trim().toLowerCase(), f]));
  const count = new Map<string, number>();
  const lastUsed = new Map<string, string>();

  for (const e of entries) {
    const fav = (e.favouriteId && byId.get(e.favouriteId)) || byName.get(e.name.trim().toLowerCase());
    if (!fav) continue;
    if (e.timestamp > (lastUsed.get(fav.id) ?? '')) lastUsed.set(fav.id, e.timestamp);
    if (e.date >= cutoff) count.set(fav.id, (count.get(fav.id) ?? 0) + 1);
  }

  const order = new Map(favourites.map((f, i) => [f.id, i]));
  return [...favourites].sort((a, b) =>
    (count.get(b.id) ?? 0) - (count.get(a.id) ?? 0) ||
    (lastUsed.get(b.id) ?? '').localeCompare(lastUsed.get(a.id) ?? '') ||
    order.get(a.id)! - order.get(b.id)!
  );
}

export function formatDateStr(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

// API helpers
// `loaded` is true only when real saved data came back. Callers must not run
// one-off migrations that save when it's false, or defaults could overwrite the diary.
export async function loadFromBlob(): Promise<{ state: AppState; loaded: boolean }> {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error('Failed to load');
    const data = await res.json();
    if (!data) return { state: DEFAULT_STATE, loaded: false };
    return { state: { ...DEFAULT_STATE, ...data }, loaded: true };
  } catch {
    return { state: DEFAULT_STATE, loaded: false };
  }
}

// Replace favourites with the master list once per MASTER_FAVOURITES_VERSION.
// Existing favourites with the same name keep their id (usage history) and ml.
export function applyMasterFavourites(state: AppState): { state: AppState; changed: boolean } {
  if ((state.favouritesVersion ?? 0) >= MASTER_FAVOURITES_VERSION) return { state, changed: false };
  const key = (n: string) => n.trim().toLowerCase();
  const existing = new Map(state.favourites.map(f => [key(f.name), f]));
  const favourites = DEFAULT_FAVOURITES.map(m => {
    const old = existing.get(key(m.name));
    return old ? { ...m, id: old.id, ml: old.ml } : { ...m };
  });
  return { state: { ...state, favourites, favouritesVersion: MASTER_FAVOURITES_VERSION }, changed: true };
}

export async function saveToBlob(state: AppState): Promise<void> {
  try {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
  } catch {
    console.error('Failed to save');
  }
}
