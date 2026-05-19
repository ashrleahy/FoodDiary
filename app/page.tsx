'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, LogEntry, FavouriteFood } from '@/lib/types';
import { loadFromBlob, saveToBlob, generateId, getTodayStr, getEntriesForDate, sumCalories, sumProtein, sumWaterMl, sumAlcoholUnits, DEFAULT_STATE } from '@/lib/storage';
import LogForm from '@/components/LogForm';
import TodayFeed from '@/components/TodayFeed';
import HistoryView from '@/components/HistoryView';
import FavouritesManager from '@/components/FavouritesManager';
import DayStats from '@/components/DayStats';
import { UtensilsCrossed, History, Star, Settings } from 'lucide-react';

type Tab = 'today' | 'history' | 'favourites' | 'settings';

export default function Home() {
  const [passphrase, setPassphrase] = useState<string | null>(null);
  const [passphraseInput, setPassphraseInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [state, setState] = useState<AppState | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [showLogForm, setShowLogForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  // Load passphrase from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('fdp');
    if (stored) setPassphrase(stored);
  }, []);

  // Load data when passphrase is set
  useEffect(() => {
    if (!passphrase) return;
    loadFromBlob(passphrase).then(data => {
      if (data === null) {
        setAuthError('Wrong passphrase');
        setPassphrase(null);
        sessionStorage.removeItem('fdp');
      } else {
        setState(data);
      }
    });
  }, [passphrase]);

  const handleLogin = async () => {
    setAuthError('');
    const res = await fetch('/api/data', {
      headers: { 'x-passphrase': passphraseInput },
    });
    if (res.status === 401) {
      setAuthError('Wrong passphrase, try again.');
      return;
    }
    sessionStorage.setItem('fdp', passphraseInput);
    setPassphrase(passphraseInput);
  };

  const persistState = useCallback((newState: AppState, phrase: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    saveTimer.current = setTimeout(async () => {
      await saveToBlob(phrase, newState);
      setSaving(false);
    }, 1000);
  }, []);

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState(prev => {
      if (!prev || !passphrase) return prev;
      const next = { ...prev, ...updates };
      persistState(next, passphrase);
      return next;
    });
  }, [passphrase, persistState]);

  const addEntry = useCallback((entry: Omit<LogEntry, 'id' | 'date' | 'timestamp'>) => {
    const today = getTodayStr();
    const newEntry: LogEntry = {
      ...entry,
      id: generateId(),
      date: today,
      timestamp: new Date().toISOString(),
    };
    setState(prev => {
      if (!prev || !passphrase) return prev;
      const next = { ...prev, entries: [newEntry, ...prev.entries] };
      persistState(next, passphrase);
      return next;
    });
    setShowLogForm(false);
  }, [passphrase, persistState]);

  const deleteEntry = useCallback((id: string) => {
    setState(prev => {
      if (!prev || !passphrase) return prev;
      const next = { ...prev, entries: prev.entries.filter(e => e.id !== id) };
      persistState(next, passphrase);
      return next;
    });
  }, [passphrase, persistState]);

  const addFavourite = useCallback((fav: Omit<FavouriteFood, 'id'>) => {
    const newFav: FavouriteFood = { ...fav, id: generateId() };
    setState(prev => {
      if (!prev || !passphrase) return prev;
      const next = { ...prev, favourites: [...prev.favourites, newFav] };
      persistState(next, passphrase);
      return next;
    });
  }, [passphrase, persistState]);

  const deleteFavourite = useCallback((id: string) => {
    setState(prev => {
      if (!prev || !passphrase) return prev;
      const next = { ...prev, favourites: prev.favourites.filter(f => f.id !== id) };
      persistState(next, passphrase);
      return next;
    });
  }, [passphrase, persistState]);

  const logFavourite = useCallback((fav: FavouriteFood) => {
    addEntry({
      type: fav.type,
      name: fav.name,
      calories: fav.calories,
      protein: fav.protein,
      quantity: fav.quantity,
      unit: fav.unit,
      ml: fav.ml,
      alcoholUnits: fav.alcoholUnits,
      isAIEstimated: false,
      isFavourite: true,
    });
  }, [addEntry]);

  // Login screen
  if (!passphrase) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <div className="card p-8 w-full max-w-sm">
          <div className="mb-6 text-center">
            <span className="mono font-medium text-2xl" style={{ color: 'var(--accent-green)' }}>cal</span>
            <span className="mono font-medium text-2xl" style={{ color: 'var(--text-secondary)' }}>tracker</span>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Enter your passphrase to continue</p>
          </div>
          <div className="space-y-3">
            <input
              className="input-base"
              type="password"
              placeholder="Passphrase"
              value={passphraseInput}
              onChange={e => setPassphraseInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
              autoFocus
            />
            {authError && <p className="text-sm" style={{ color: 'var(--accent-red)' }}>{authError}</p>}
            <button className="btn-primary w-full" onClick={handleLogin} disabled={!passphraseInput}>
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[var(--text-muted)] mono text-sm shimmer">loading...</div>
      </div>
    );
  }

  const todayStr = getTodayStr();
  const todayEntries = getEntriesForDate(state.entries, todayStr);
  const todayCals = sumCalories(todayEntries);
  const todayProtein = sumProtein(todayEntries);
  const todayWater = sumWaterMl(todayEntries);
  const todayAlcohol = sumAlcoholUnits(todayEntries);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'today', label: 'Today', icon: <UtensilsCrossed size={15} /> },
    { id: 'history', label: 'History', icon: <History size={15} /> },
    { id: 'favourites', label: 'Favourites', icon: <Star size={15} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={15} /> },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }} className="sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <span className="mono font-medium text-lg" style={{ color: 'var(--accent-green)' }}>cal</span>
              <span className="mono font-medium text-lg" style={{ color: 'var(--text-secondary)' }}>tracker</span>
            </div>
            {saving && <span className="text-xs shimmer" style={{ color: 'var(--text-muted)' }}>saving...</span>}
          </div>
          <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setShowLogForm(true)}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Log
          </button>
        </div>
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="flex gap-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 3 }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 flex-1 justify-center py-1.5 text-sm rounded-[7px] transition-all"
                style={{
                  color: activeTab === tab.id ? '#0d0d0f' : 'var(--text-secondary)',
                  border: 'none',
                  background: activeTab === tab.id ? 'var(--accent-green)' : 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {activeTab === 'today' && (
          <div className="fade-in space-y-4">
            <DayStats
              calories={todayCals}
              protein={todayProtein}
              waterMl={todayWater}
              alcoholUnits={todayAlcohol}
              calorieGoal={state.dailyCalorieGoal}
              proteinGoal={state.dailyProteinGoal}
              waterGoalMl={state.dailyWaterGoalMl}
            />

            {state.favourites.length > 0 && (
              <div>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Quick log</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {state.favourites.slice(0, 10).map(fav => (
                    <button
                      key={fav.id}
                      onClick={() => logFavourite(fav)}
                      className="card card-hover flex-shrink-0 px-3 py-2 text-left"
                      style={{ cursor: 'pointer', border: 'none', fontFamily: 'var(--font-body)' }}
                    >
                      <div style={{ fontSize: 18 }}>{fav.emoji || '🍽️'}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)', maxWidth: 70, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fav.name}</div>
                      <div className="mono text-xs" style={{ color: 'var(--accent-green)' }}>{fav.calories}k</div>
                      {fav.protein ? <div className="mono text-xs" style={{ color: 'var(--accent-purple)' }}>{fav.protein}p</div> : null}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <TodayFeed entries={todayEntries} onDelete={deleteEntry} />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="fade-in">
            <HistoryView entries={state.entries} calorieGoal={state.dailyCalorieGoal} proteinGoal={state.dailyProteinGoal} />
          </div>
        )}

        {activeTab === 'favourites' && (
          <div className="fade-in">
            <FavouritesManager
              favourites={state.favourites}
              onAdd={addFavourite}
              onDelete={deleteFavourite}
              onLog={logFavourite}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="fade-in space-y-4">
            <div className="card p-4">
              <h2 className="font-semibold mb-4" style={{ fontSize: 15 }}>Goals</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Daily calorie goal</label>
                  <input type="number" className="input-base" value={state.dailyCalorieGoal}
                    onChange={e => updateState({ dailyCalorieGoal: parseInt(e.target.value) || 3300 })} />
                </div>
                <div>
                  <label className="text-sm block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Daily protein goal (g)</label>
                  <input type="number" className="input-base" value={state.dailyProteinGoal}
                    onChange={e => updateState({ dailyProteinGoal: parseInt(e.target.value) || 160 })} />
                </div>
                <div>
                  <label className="text-sm block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Daily water goal (ml)</label>
                  <input type="number" className="input-base" value={state.dailyWaterGoalMl}
                    onChange={e => updateState({ dailyWaterGoalMl: parseInt(e.target.value) || 2000 })} />
                </div>
              </div>
            </div>

            <div className="card p-4">
              <h2 className="font-semibold mb-2" style={{ fontSize: 15 }}>Data</h2>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Your data is synced to Vercel Blob storage.</p>
              <div className="flex gap-2 flex-wrap">
                <button className="btn-ghost text-sm" onClick={() => {
                  const data = JSON.stringify(state, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `caltracker_export_${getTodayStr()}.json`;
                  a.click();
                }}>Export JSON</button>
                <button className="btn-ghost text-sm" style={{ color: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}
                  onClick={() => { if (confirm('Clear all logged entries? Favourites will be kept.')) updateState({ entries: [] }); }}>
                  Clear entries
                </button>
                <button className="btn-ghost text-sm" onClick={() => {
                  sessionStorage.removeItem('fdp');
                  setPassphrase(null);
                  setState(null);
                }}>
                  Lock
                </button>
              </div>
            </div>

            <div className="card p-4">
              <h2 className="font-semibold mb-2" style={{ fontSize: 15 }}>About</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                CalTracker uses Claude AI to estimate calories and protein. AI estimates are marked with ✦. Data syncs across devices via Vercel Blob.
              </p>
            </div>
          </div>
        )}
      </main>

      {showLogForm && (
        <LogForm
          favourites={state.favourites}
          onSubmit={addEntry}
          onClose={() => setShowLogForm(false)}
          onLogFavourite={logFavourite}
        />
      )}
    </div>
  );
}
