import { AppState, LogEntry, FavouriteFood } from './types';

const DEFAULT_FAVOURITES: FavouriteFood[] = [
  {
    id: 'fav_1', name: 'Weetbix Bowl', type: 'meal',
    calories: 485, protein: 52,
    quantity: 1, unit: 'bowl', emoji: '🥣',
  },
  {
    id: 'fav_2', name: 'Protein Shake', type: 'drink',
    calories: 335, protein: 45,
    quantity: 1, unit: 'shake', ml: 350, emoji: '🥤',
  },
  {
    id: 'fav_3', name: 'Pre Pack Lunch', type: 'meal',
    calories: 400, protein: 30,
    quantity: 1, unit: 'pack', emoji: '🍱',
  },
  {
    id: 'fav_4', name: 'Yoghurt & Berries', type: 'meal',
    calories: 230, protein: 10,
    quantity: 1, unit: 'bowl', emoji: '🫐',
  },
  {
    id: 'fav_5', name: 'Flat White', type: 'drink',
    calories: 120, protein: 6,
    quantity: 1, unit: 'cup', ml: 220, emoji: '☕',
  },
  {
    id: 'fav_6', name: 'Instant Coffee', type: 'drink',
    calories: 50, protein: 2,
    quantity: 1, unit: 'cup', ml: 200, emoji: '☕',
  },
  {
    id: 'fav_7', name: 'Coopers Mild Ale', type: 'alcohol',
    calories: 105, protein: 1,
    quantity: 1, unit: 'can', ml: 375, alcoholUnits: 1.0, emoji: '🍺',
  },
  {
    id: 'fav_8', name: 'Coopers Pale Ale', type: 'alcohol',
    calories: 135, protein: 2,
    quantity: 1, unit: 'can', ml: 375, alcoholUnits: 1.4, emoji: '🍺',
  },
  {
    id: 'fav_9', name: 'Heineken', type: 'alcohol',
    calories: 140, protein: 2,
    quantity: 1, unit: 'bottle', ml: 330, alcoholUnits: 1.3, emoji: '🍺',
  },
  {
    id: 'fav_10', name: 'Red Wine (large)', type: 'alcohol',
    calories: 150, protein: 0,
    quantity: 1, unit: 'glass', ml: 180, alcoholUnits: 2.1, emoji: '🍷',
  },
];

export const DEFAULT_STATE: AppState = {
  entries: [],
  favourites: DEFAULT_FAVOURITES,
  dailyCalorieGoal: 3300,
  dailyProteinGoal: 160,
  dailyWaterGoalMl: 2000,
};

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
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

export function sumAlcoholUnits(entries: LogEntry[]): number {
  return entries
    .filter(e => e.type === 'alcohol')
    .reduce((sum, e) => sum + (e.alcoholUnits || 0), 0);
}

export function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export function formatDateStr(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

// API helpers
export async function loadFromBlob(passphrase: string): Promise<AppState> {
  try {
    const res = await fetch('/api/data', {
      headers: { 'x-passphrase': passphrase },
    });
    if (!res.ok) throw new Error('Failed to load');
    const data = await res.json();
    if (!data) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...data };
  } catch {
    return DEFAULT_STATE;
  }
}

export async function saveToBlob(passphrase: string, state: AppState): Promise<void> {
  try {
    await fetch('/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-passphrase': passphrase,
      },
      body: JSON.stringify(state),
    });
  } catch {
    console.error('Failed to save');
  }
}
