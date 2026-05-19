'use client';

import { useState } from 'react';
import { FavouriteFood, EntryType } from '@/lib/types';
import { Trash2, Plus } from 'lucide-react';

interface FavouritesManagerProps {
  favourites: FavouriteFood[];
  onAdd: (fav: Omit<FavouriteFood, 'id'>) => void;
  onDelete: (id: string) => void;
  onLog: (fav: FavouriteFood) => void;
}

const TYPE_OPTIONS: { value: EntryType; label: string; emoji: string }[] = [
  { value: 'meal', label: 'Meal', emoji: '🍽️' },
  { value: 'drink', label: 'Drink', emoji: '🥤' },
  { value: 'alcohol', label: 'Alcohol', emoji: '🍺' },
  { value: 'water', label: 'Water', emoji: '💧' },
];

const EMOJI_OPTIONS = ['🍽️', '🥩', '🍗', '🐟', '🥗', '🥙', '🌮', '🍜', '🍣', '🍱', '🥚', '🧇', '🥞', '🍞', '🧀', '🍕', '🍔', '🌯', '🥣', '🫐', '🥤', '☕', '🧋', '🍵', '🧃', '💧', '🍺', '🍻', '🍷', '🥂', '🍸', '🥃'];

export default function FavouritesManager({ favourites, onAdd, onDelete, onLog }: FavouritesManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<EntryType>('meal');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('serving');
  const [ml, setMl] = useState('');
  const [alcoholUnits, setAlcoholUnits] = useState('');
  const [emoji, setEmoji] = useState('🍽️');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [filterType, setFilterType] = useState<EntryType | 'all'>('all');

  const filtered = filterType === 'all' ? favourites : favourites.filter(f => f.type === filterType);

  const resetForm = () => {
    setName(''); setCalories(''); setProtein(''); setQuantity('1');
    setUnit('serving'); setMl(''); setAlcoholUnits(''); setEmoji('🍽️');
    setShowForm(false);
  };

  const handleSubmit = () => {
    const cals = parseInt(calories);
    if (!name.trim() || isNaN(cals)) return;
    onAdd({
      name: name.trim(),
      type,
      calories: cals,
      protein: protein ? parseInt(protein) : undefined,
      quantity: parseFloat(quantity) || 1,
      unit: unit.trim() || 'serving',
      ml: ml ? parseInt(ml) : undefined,
      alcoholUnits: alcoholUnits ? parseFloat(alcoholUnits) : undefined,
      emoji,
    });
    resetForm();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {favourites.length} favourite{favourites.length !== 1 ? 's' : ''}
        </p>
        <button className="btn-primary flex items-center gap-1.5 text-sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} /> Add favourite
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card p-4 fade-in space-y-3">
          <h3 className="font-semibold text-sm">New favourite</h3>

          {/* Emoji + name */}
          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                style={{
                  width: 44, height: 44, borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--bg-input)', fontSize: 22, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                {emoji}
              </button>
              {showEmojiPicker && (
                <div className="absolute left-0 top-12 z-20 card p-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2, width: 228 }}>
                  {EMOJI_OPTIONS.map(e => (
                    <button key={e} onClick={() => { setEmoji(e); setShowEmojiPicker(false); }}
                      style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4 }}>
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input className="input-base" placeholder="Name (e.g. Flat white)" value={name} onChange={e => setName(e.target.value)} />
          </div>

          {/* Type */}
          <div className="flex gap-1.5">
            {TYPE_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setType(opt.value)} style={{
                flex: 1, padding: '6px 2px', borderRadius: 7, cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 11,
                background: type === opt.value ? 'var(--bg-card-hover)' : 'var(--bg)',
                border: `1px solid ${type === opt.value ? 'var(--border-light)' : 'var(--border)'}`,
                color: type === opt.value ? 'var(--text-primary)' : 'var(--text-muted)',
              }}>
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>

          {/* Calories + protein */}
          <div className="grid grid-cols-2 gap-2">
            <input className="input-base" type="number" placeholder="Calories (kcal)" value={calories} onChange={e => setCalories(e.target.value)} />
            <input className="input-base" type="number" placeholder="Protein (g)" value={protein} onChange={e => setProtein(e.target.value)} />
          </div>

          {/* Quantity + unit */}
          <div className="grid grid-cols-2 gap-2">
            <input className="input-base" type="number" placeholder="Qty" value={quantity} onChange={e => setQuantity(e.target.value)} />
            <input className="input-base" placeholder="Unit (e.g. cup)" value={unit} onChange={e => setUnit(e.target.value)} />
          </div>

          {/* Liquid fields */}
          {(type === 'drink' || type === 'water' || type === 'alcohol') && (
            <div className="grid grid-cols-2 gap-2">
              <input className="input-base" type="number" placeholder="ml (optional)" value={ml} onChange={e => setMl(e.target.value)} />
              {type === 'alcohol' && (
                <input className="input-base" type="number" step="0.1" placeholder="Std drinks" value={alcoholUnits} onChange={e => setAlcoholUnits(e.target.value)} />
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button className="btn-primary flex-1" onClick={handleSubmit} disabled={!name.trim() || !calories}>
              Save favourite
            </button>
            <button className="btn-ghost" onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-1.5 flex-wrap">
        {(['all', 'meal', 'drink', 'alcohol', 'water'] as const).map(t => (
          <button key={t} onClick={() => setFilterType(t)} style={{
            padding: '4px 12px', borderRadius: 99, cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 12,
            background: filterType === t ? 'var(--accent-green)' : 'var(--bg-card)',
            border: `1px solid ${filterType === t ? 'var(--accent-green)' : 'var(--border)'}`,
            color: filterType === t ? '#0f0f11' : 'var(--text-muted)',
            fontWeight: filterType === t ? 600 : 400,
            transition: 'all 0.15s',
          }}>
            {t === 'all' ? 'All' : t === 'meal' ? '🍽️ Meals' : t === 'drink' ? '🥤 Drinks' : t === 'alcohol' ? '🍺 Alcohol' : '💧 Water'}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {favourites.length === 0 ? 'No favourites yet — add commonly eaten foods for quick logging.' : 'No items in this category.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(fav => (
            <div key={fav.id} className="card card-hover flex items-center justify-between gap-3" style={{ padding: '10px 14px' }}>
              <div className="flex items-center gap-3 flex-1">
                <span style={{ fontSize: 24 }}>{fav.emoji || '🍽️'}</span>
                <div>
                  <div className="text-sm font-medium">{fav.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {fav.quantity} {fav.unit}
                    {fav.ml ? ` · ${fav.ml}ml` : ''}
                    {fav.alcoholUnits ? ` · ${fav.alcoholUnits} std` : ''}
                    <span className="pill ml-1.5" style={{ fontSize: 10, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '1px 5px' }}>
                      {fav.type}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="mono text-sm font-medium" style={{ color: 'var(--accent-green)' }}>{fav.calories} kcal</div>
                  {fav.protein ? <div className="mono text-xs" style={{ color: 'var(--accent-purple)' }}>{fav.protein}g protein</div> : null}
                </div>
                <button onClick={() => onLog(fav)} style={{
                  background: 'var(--accent-green)', border: 'none', borderRadius: 6,
                  color: '#0f0f11', padding: '4px 10px', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}>
                  Log
                </button>
                <button onClick={() => onDelete(fav.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
