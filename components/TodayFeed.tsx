'use client';

import { LogEntry, EntryType } from '@/lib/types';
import { Trash2 } from 'lucide-react';

interface TodayFeedProps {
  entries: LogEntry[];
  onDelete: (id: string) => void;
}

const TYPE_EMOJI: Record<EntryType, string> = {
  meal: '🍽️',
  drink: '🥤',
  alcohol: '🍺',
  water: '💧',
};

const TYPE_COLOR: Record<EntryType, string> = {
  meal: 'var(--accent-green)',
  drink: 'var(--accent-blue)',
  alcohol: 'var(--accent-amber)',
  water: 'var(--accent-blue)',
};

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
}

export default function TodayFeed({ entries, onDelete }: TodayFeedProps) {
  if (entries.length === 0) {
    return (
      <div className="card" style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🍽️</div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nothing logged yet today</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Tap + Log to get started</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Today's log</p>
      <div className="space-y-2">
        {entries.map(entry => (
          <div
            key={entry.id}
            className="card card-hover fade-in flex items-center justify-between gap-3"
            style={{ padding: '10px 14px' }}
          >
            <div className="flex items-center gap-3">
              <div style={{
                width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'center', background: `${TYPE_COLOR[entry.type]}18`,
                fontSize: 18, flexShrink: 0,
              }}>
                {TYPE_EMOJI[entry.type]}
              </div>
              <div>
                <div className="text-sm font-medium flex items-center gap-1.5">
                  {entry.name}
                  {entry.isAIEstimated && (
                    <span className="pill" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '1px 6px', fontSize: 10 }}>
                      ✦ AI
                    </span>
                  )}
                  {entry.isFavourite && (
                    <span style={{ fontSize: 11, color: 'var(--accent-amber)' }}>⭐</span>
                  )}
                </div>
                <div className="flex gap-3 mt-0.5">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatTime(entry.timestamp)}</span>
                  {entry.protein ? <span className="text-xs mono" style={{ color: 'var(--accent-purple)' }}>{entry.protein}g protein</span> : null}
                  {entry.ml ? <span className="text-xs" style={{ color: 'var(--text-muted)' }}>💧 {entry.ml}ml</span> : null}
                  {entry.alcoholUnits ? <span className="text-xs" style={{ color: 'var(--text-muted)' }}>🍺 {entry.alcoholUnits} std</span> : null}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="mono text-sm font-medium" style={{ color: TYPE_COLOR[entry.type] }}>
                  {entry.calories} kcal
                </div>
              </div>
              <button
                onClick={() => onDelete(entry.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 4 }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
