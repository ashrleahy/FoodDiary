export type EntryType = 'meal' | 'drink' | 'alcohol' | 'water';

export interface LogEntry {
  id: string;
  date: string;
  timestamp: string;
  type: EntryType;
  name: string;
  description?: string;
  calories: number;
  protein?: number;
  quantity?: number;
  unit?: string;
  isAIEstimated: boolean;
  isFavourite?: boolean;
  favouriteId?: string; // set when logged from a favourite (older entries only have the name)
  ml?: number;
}

export interface FavouriteFood {
  id: string;
  name: string;
  type: EntryType;
  calories: number;
  protein?: number;
  quantity: number;
  unit: string;
  ml?: number;
  emoji?: string;
}

export interface DayLog {
  date: string;
  entries: LogEntry[];
  totalCalories: number;
  totalProtein: number;
  totalWaterMl: number;
}

export interface AppState {
  entries: LogEntry[];
  favourites: FavouriteFood[];
  favouritesVersion?: number; // last master favourites list applied
  dailyCalorieGoal: number;
  dailyProteinGoal: number;
  dailyWaterGoalMl: number;
}
