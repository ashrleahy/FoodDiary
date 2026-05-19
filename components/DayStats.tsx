'use client';

interface DayStatsProps {
  calories: number;
  protein: number;
  waterMl: number;
  alcoholUnits: number;
  calorieGoal: number;
  proteinGoal: number;
  waterGoalMl: number;
}

function Ring({ value, max, color, size = 64 }: { value: number; max: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const dash = pct * circ;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={5} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
    </svg>
  );
}

export default function DayStats({ calories, protein, waterMl, alcoholUnits, calorieGoal, proteinGoal, waterGoalMl }: DayStatsProps) {
  const remaining = calorieGoal - calories;
  const calPct = Math.round((calories / calorieGoal) * 100);
  const proteinPct = Math.round((protein / proteinGoal) * 100);

  return (
    <div className="card p-4 space-y-4">
      {/* Calories */}
      <div className="flex items-start justify-between">
        <div>
          <div className="mono font-medium" style={{ fontSize: 36, lineHeight: 1, color: 'var(--accent-green)' }}>
            {calories.toLocaleString()}
          </div>
          <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            of {calorieGoal.toLocaleString()} kcal
            {remaining > 0
              ? <span> · <span style={{ color: 'var(--accent-green)' }}>{remaining.toLocaleString()} left</span></span>
              : <span> · <span style={{ color: 'var(--accent-amber)' }}>{Math.abs(remaining).toLocaleString()} over</span></span>
            }
          </div>
        </div>
        <div className="relative flex items-center justify-center" style={{ width: 64, height: 64 }}>
          <Ring value={calories} max={calorieGoal} color={calPct > 100 ? 'var(--accent-amber)' : 'var(--accent-green)'} />
          <span className="mono absolute text-xs font-medium" style={{ color: calPct > 100 ? 'var(--accent-amber)' : 'var(--accent-green)' }}>
            {calPct}%
          </span>
        </div>
      </div>

      {/* Calorie progress bar */}
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
        <div style={{
          height: '100%',
          width: `${Math.min(calPct, 100)}%`,
          background: calPct > 100 ? 'var(--accent-amber)' : 'var(--accent-green)',
          borderRadius: 2,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-3">
        {/* Protein */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <span>💪</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Protein</span>
          </div>
          <div className="mono font-medium" style={{ fontSize: 18, color: 'var(--accent-purple)' }}>
            {protein}g
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>of {proteinGoal}g</div>
          <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginTop: 6 }}>
            <div style={{
              height: '100%',
              width: `${Math.min(proteinPct, 100)}%`,
              background: 'var(--accent-purple)',
              borderRadius: 2,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        {/* Hydration */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <span>💧</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Hydration</span>
          </div>
          <div className="mono font-medium" style={{ fontSize: 18, color: 'var(--accent-blue)' }}>
            {waterMl >= 1000 ? `${(waterMl / 1000).toFixed(1)}L` : `${waterMl}ml`}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>of {waterGoalMl >= 1000 ? `${waterGoalMl / 1000}L` : `${waterGoalMl}ml`}</div>
          <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginTop: 6 }}>
            <div style={{
              height: '100%',
              width: `${Math.min((waterMl / waterGoalMl) * 100, 100)}%`,
              background: 'var(--accent-blue)',
              borderRadius: 2,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        {/* Alcohol */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <span>🍺</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Alcohol</span>
          </div>
          <div className="mono font-medium" style={{ fontSize: 18, color: alcoholUnits > 2 ? 'var(--accent-amber)' : 'var(--text-secondary)' }}>
            {alcoholUnits.toFixed(1)}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>std drinks</div>
          {alcoholUnits > 0 && (
            <div className="flex gap-0.5 mt-2 flex-wrap">
              {Array.from({ length: Math.min(Math.ceil(alcoholUnits), 10) }).map((_, i) => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: 1,
                  background: i < 2 ? 'var(--accent-green)' : i < 4 ? 'var(--accent-amber)' : 'var(--accent-red)',
                }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
