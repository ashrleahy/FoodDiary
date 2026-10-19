import { EntryType, FavouriteFood } from './types';

export type ParsedFavourite = Omit<FavouriteFood, 'id'>;

const ALCOHOL = /\b(beer|lager|ale|stout|pilsner|ipa|wine|ros[eé]|champagne|prosecco|spritz|gin|vodka|rum|whisk(e)?y|bourbon|cider|coopers|xxxx|heineken|carlton|vb|corona|peroni|asahi|stella|furphy|great northern|hahn|tooheys)\b/i;
const DRINK = /\b(coffee|flat white|latte|cappuccino|espresso|long black|tea|chai|shake|smoothie|milk|juice|soda|cola|coke|kombucha|drink)\b/i;
const WATER = /\bwater\b/i;

export function guessType(name: string): EntryType {
  if (WATER.test(name)) return 'water';
  if (ALCOHOL.test(name) && !/\bmilk\b/i.test(name)) return 'alcohol';
  if (DRINK.test(name)) return 'drink';
  return 'meal';
}

export function guessEmoji(name: string, type: EntryType): string {
  const n = name.toLowerCase();
  if (type === 'alcohol') return /wine/.test(n) ? '🍷' : '🍺';
  if (type === 'water') return '💧';
  if (/coffee|flat white|latte|cappuccino/.test(n)) return '☕';
  if (/shake|smoothie/.test(n)) return '🥤';
  if (/chocolate milk|milk/.test(n)) return '🧃';
  if (type === 'drink') return '🥤';
  if (/yoghurt|yogurt|berr/.test(n)) return '🫐';
  if (/spag|pasta|ragu|noodle/.test(n)) return '🍜';
  if (/burger/.test(n)) return '🍔';
  if (/taco/.test(n)) return '🌮';
  if (/bread|toast/.test(n)) return '🍞';
  if (/weetbix|cereal|oats|porridge/.test(n)) return '🥣';
  if (/egg/.test(n)) return '🥚';
  if (/salad/.test(n)) return '🥗';
  if (/pizza/.test(n)) return '🍕';
  return '🍽️';
}

// Accepts lines of "name<TAB or comma>kcal<TAB or comma>protein".
// Header lines and anything without a numeric calorie value are skipped.
export function parseFavouritesList(text: string): { items: ParsedFavourite[]; skipped: string[] } {
  const items: ParsedFavourite[] = [];
  const skipped: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const parts = (line.includes('\t') ? line.split('\t') : line.split(',')).map(p => p.trim()).filter(Boolean);
    if (parts.length < 2) { skipped.push(line); continue; }
    const kcal = Number(parts[1]);
    const protein = parts.length > 2 ? Number(parts[2]) : NaN;
    if (!parts[0] || !Number.isFinite(kcal)) { skipped.push(line); continue; }
    const name = parts[0];
    const type = guessType(name);
    items.push({
      name,
      type,
      calories: Math.round(kcal),
      protein: Number.isFinite(protein) && protein > 0 ? Math.round(protein) : undefined,
      quantity: 1,
      unit: 'serve',
      emoji: guessEmoji(name, type),
    });
  }
  return { items, skipped };
}
