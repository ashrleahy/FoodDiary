'use client';

import { useState, useRef, useEffect } from 'react';
import { LogEntry, FavouriteFood, EntryType } from '@/lib/types';
import { X, Sparkles, Loader } from 'lucide-react';

interface LogFormProps {
  favourites: FavouriteFood[];
  onSubmit: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  onClose: () => void;
  onLogFavourite: (fav: FavouriteFood) => void;
}

type Mode = 'ai' | 'favourite' | 'manual';

const TYPE_OPTIONS: { value: EntryType; label: string; emoji: string }[] = [
  { value: 'meal', label: 'Meal', emoji: '🍽️' },
  { value: 'drink', label: 'Drink', emoji: '🥤' },
  { value: 'alcohol', label: 'Alcohol', emoji: '🍺' },
  { value: 'water', label: 'Water', emoji: '💧' },
];

function getDateOptions(): { value: string; label: string }[] {
  const options = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const value = d.toISOString().split('T')[0];
    const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
    options.push({ value, label });
  }
  return options;
}

export default function LogForm({ favourites, onSubmit, onClose, onLogFavourite }: LogFormProps) {
  const [mode, setMode] = useState<Mode>('ai');
  const [type, setType] = useState<EntryType>('meal');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualCals, setManualCals] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualMl, setManualMl] = useState('');
  const [manualAlcohol, setManualAlcohol] = useState('');
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<{ calories: number; protein: number; confidence: string; notes: string; ml?: number; alcoholUnits?: number } | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dateOptions = getDateOptions();

  useEffect(() => {
    if (mode === 'ai' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [mode]);

  const estimateCalories = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setEstimate(null);
    setError('');
    try {
      const res = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim(), type }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setEstimate(data);
    } catch {
      setError('Could not estimate — check your API key or try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAISubmit = () => {
    if (!estimate) return;
    onSubmit({
      type,
      date: selectedDate,
      name: description.trim(),
      calories: estimate.calories,
      protein: estimate.protein,
      ml: estimate.ml,
      alcoholUnits: estimate.alcoholUnits,
      isAIEstimated: true,
    });
  };

  const handleManualSubmit = () => {
    const cals = parseInt(manualCals);
    if (!manualName.trim() || isNaN(cals)) return;
    onSubmit({
      type,
      date: selectedDate,
      name: manualName.trim(),
      calories: cals,
      protein: manualProtein ? parseInt(manualProtein) : undefined,
      ml: manualMl ? parseInt(manualMl) : undefined,
      alcoholUnits: manualAlcohol ? parseFloat(manualAlcohol) : undefined,
      isAIEstimated: false,
    });
  };

  const handleFavouriteLog = (fav: FavouriteFood) => {
    onSubmit({
      type: fav.type,
      date: selectedDate,
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
  };

  const confidenceColor = (c: string) => {
    if (c === 'high') return 'var(--accent-green)';
    if (c === 'medium') return 'var(--accent-amber)';
    return 'var(--accent-red)';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card fade-in w-full max-w-lg mx-2 mb-2 sm:mb-0" style={{ maxHeight: '90vh', overflow: 'auto' }}>
        <div className="flex items-center justify-between p-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold">Log entry</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Date selector */}
          <div>
            <label className="text-xs block mb-1.5" style={{ color: 'var(--text-muted)' }}>Date</label>
            <div className="flex gap-1.5 flex-wrap">
              {dateOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedDate(opt.value)}
                  style={{
                    padding: '5px 12px', borderRadius: 99, cursor: 'pointer',
                    fontFamily: 'var(--font-body)', fontSize: 12,
                    background: selectedDate === opt.value ? 'var(--accent-green)' : 'var(--bg)',
                    border: `1px solid ${selectedDate === opt.value ? 'var(--accent-green)' : 'var(--border)'}`,
                    color: selectedDate === opt.value ? '#0d0d0f' : 'var(--text-secondary)',
                    fontWeight: selectedDate === opt.value ? 600 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mode selector */}
          <div className="flex gap-1" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 3 }}>
            {(['ai', 'favourite', 'manual'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1, padding: '7px 4px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: mode === m ? 600 : 400,
                  background: mode === m ? 'var(--accent-green)' : 'transparent',
                  color: mode === m ? '#0d0d0f' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}
              >
                {m === 'ai' ? '✦ AI Estimate' : m === 'favourite' ? '⭐ Favourites' : '✏️ Manual'}
              </button>
            ))}
          </div>

          {/* Type selector */}
          {mode !== 'favourite' && (
            <div className="flex gap-2">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                    fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: type === opt.value ? 600 : 400,
                    background: type === opt.value ? 'var(--bg-card-hover)' : 'var(--bg)',
                    border: `1px solid ${type === opt.value ? 'var(--border-light)' : 'var(--border)'}`,
                    color: type === opt.value ? 'var(--text-primary)' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                    textAlign: 'center',
                  }}
                >
                  <div>{opt.emoji}</div>
                  <div>{opt.label}</div>
                </button>
              ))}
            </div>
          )}

          {/* AI mode */}
          {mode === 'ai' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  className="input-base"
                  placeholder={
                    type === 'meal' ? 'e.g. chicken schnitzel with chips and salad'
                    : type === 'alcohol' ? 'e.g. pint of IPA beer'
                    : type === 'water' ? 'e.g. glass of water'
                    : 'e.g. large oat flat white'
                  }
                  value={description}
                  onChange={e => { setDescription(e.target.value); setEstimate(null); }}
                  onKeyDown={e => { if (e.key === 'Enter') estimateCalories(); }}
                />
                <button
                  className="btn-primary flex items-center gap-1.5"
                  onClick={estimateCalories}
                  disabled={loading || !description.trim()}
                >
                  {loading ? <Loader size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {loading ? '' : 'Est.'}
                </button>
              </div>

              {error && <p className="text-sm" style={{ color: 'var(--accent-red)' }}>{error}</p>}

              {estimate && (
                <div className="fade-in" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex gap-4">
                      <div>
                        <span className="mono font-medium" style={{ fontSize: 26, color: 'var(--accent-green)' }}>{estimate.calories}</span>
                        <span className="text-sm ml-1" style={{ color: 'var(--text-secondary)' }}>kcal</span>
                      </div>
                      {estimate.protein > 0 && (
                        <div>
                          <span className="mono font-medium" style={{ fontSize: 26, color: 'var(--accent-purple)' }}>{estimate.protein}</span>
                          <span className="text-sm ml-1" style={{ color: 'var(--text-secondary)' }}>g protein</span>
                        </div>
                      )}
                    </div>
                    <span className="pill" style={{
                      background: `${confidenceColor(estimate.confidence)}22`,
                      color: confidenceColor(estimate.confidence),
                    }}>
                      {estimate.confidence}
                    </span>
                  </div>
                  {estimate.notes && (
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{estimate.notes}</p>
                  )}
                  {(estimate.ml || estimate.alcoholUnits) && (
                    <div className="flex gap-3 mt-2">
                      {estimate.ml && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>💧 {estimate.ml}ml</span>}
                      {estimate.alcoholUnits && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>🍺 {estimate.alcoholUnits} std drinks</span>}
                    </div>
                  )}
                  <button className="btn-primary w-full mt-3" onClick={handleAISubmit}>
                    Log this
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Favourites mode */}
          {mode === 'favourite' && (
            <div className="space-y-2">
              {favourites.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
                  No favourites yet. Add some in the Favourites tab.
                </p>
              ) : (
                favourites.map(fav => (
                  <button
                    key={fav.id}
                    className="card card-hover w-full text-left flex items-center justify-between gap-3"
                    style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                    onClick={() => handleFavouriteLog(fav)}
                  >
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: 22 }}>{fav.emoji || '🍽️'}</span>
                      <div>
                        <div className="text-sm font-medium">{fav.name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {fav.quantity} {fav.unit}
                          {fav.ml ? ` · ${fav.ml}ml` : ''}
                          {fav.alcoholUnits ? ` · ${fav.alcoholUnits} std` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 items-center">
                      <div>
                        <div className="mono text-sm font-medium" style={{ color: 'var(--accent-green)' }}>{fav.calories} kcal</div>
                        {fav.protein ? <div className="mono text-xs" style={{ color: 'var(--accent-purple)' }}>{fav.protein}g protein</div> : null}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Manual mode */}
          {mode === 'manual' && (
            <div className="space-y-3">
              <input className="input-base" placeholder="Name" value={manualName} onChange={e => setManualName(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <input className="input-base" type="number" placeholder="Calories (kcal)" value={manualCals} onChange={e => setManualCals(e.target.value)} />
                <input className="input-base" type="number" placeholder="Protein (g)" value={manualProtein} onChange={e => setManualProtein(e.target.value)} />
              </div>
              {(type === 'drink' || type === 'water' || type === 'alcohol') && (
                <input className="input-base" type="number" placeholder="Volume (ml) — optional" value={manualMl} onChange={e => setManualMl(e.target.value)} />
              )}
              {type === 'alcohol' && (
                <input className="input-base" type="number" step="0.1" placeholder="Standard drinks — optional" value={manualAlcohol} onChange={e => setManualAlcohol(e.target.value)} />
              )}
              <button className="btn-primary w-full" onClick={handleManualSubmit} disabled={!manualName.trim() || !manualCals}>
                Log entry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
