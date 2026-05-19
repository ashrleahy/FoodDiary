'use client';

import { useState, useMemo } from 'react';
import { LogEntry } from '@/lib/types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { getLast7Days, getLast30Days, getEntriesForDate, sumCalories, sumProtein, sumWaterMl, sumAlcoholUnits, formatDateStr } from '@/lib/storage';
import { Trash2 } from 'lucide-react';

interface HistoryViewProps {
  entries: LogEntry[];
  calorieGoal: number;
  proteinGoal: number;
  onDelete: (id: string) => void;
}

type Period = '7d' | '30d' | 'months';
type Metric = 'cals' | 'protein' | 'water' | 'alcohol';

function shortDay(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short' }).slice(0, 3);
}

function shortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function getMonthlyData(entries: LogEntry[]) {
  const map: Record<string, { cals: number; protein: number; water: number; alcohol: number }> = {};
  const dayMap: Record<string, Set<string>> = {};
  entries.forEach(e => {
    const m = e.date.slice(0, 7);
    if (!map[m]) map[m] = { cals: 0, protein: 0, water: 0, alcohol: 0 };
    if (!dayMap[m]) dayMap[m] = new Set();
    map[m].cals += e.calories;
    map[m].protein += e.protein || 0;
    map[m].water += e.ml || 0;
    map[m].alcohol += e.alcoholUnits || 0;
    dayMap[m].add(e.date);
  });
  return Object.entries(map)
    .map(([month, d]) => {
      const days = dayMap[month]?.size || 1;
      return {
        label: new Date(month + '-01').toLocaleDateString('en-AU', { month: 'short', year: '2-digit' }),
        month,
        avgCals: Math.round(d.cals / days),
        avgProtein: Math.round(d.protein / days),
        totalWater: Math.round(d.water),
        totalAlcohol: parseFloat(d.alcohol.toFixed(1)),
        loggedDays: days,
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
        <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} className="mono text-sm font-medium" style={{ color: p.color || 'var(--accent-green)' }}>
            {p.value} {p.name}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function HistoryView({ entries, calorieGoal, proteinGoal, onDelete }: HistoryViewProps) {
  const [period, setPeriod] = useState<Period>('7d');
  const [metric, setMetric] = useState<Metric>('cals');
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const dailyData7 = useMemo(() => getLast7Days().map(date => {
    const e = getEntriesForDate(entries, date);
    return {
      date, label: shortDay(date),
      cals: sumCalories(e),
      protein: sumProtein(e),
      water: Math.round(sumWaterMl(e)),
      alcohol: parseFloat(sumAlcoholUnits(e).toFixed(1)),
    };
  }), [entries]);

  const dailyData30 = useMemo(() => getLast30Days().map(date => {
    const e = getEntriesForDate(entries, date);
    return {
      date, label: shortDate(date),
      cals: sumCalories(e),
      protein: sumProtein(e),
      water: Math.round(sumWaterMl(e)),
      alcohol: parseFloat(sumAlcoholUnits(e).toFixed(1)),
    };
  }), [entries]);

  const monthlyData = useMemo(() => getMonthlyData(entries), [entries]);

  const data = period === '7d' ? dailyData7 : period === '30d' ? dailyData30 : monthlyData;

  const metricKey = period === 'months'
    ? (metric === 'cals' ? 'avgCals' : metric === 'protein' ? 'avgProtein' : metric === 'water' ? 'totalWater' : 'totalAlcohol')
    : metric;

  const metricColor = metric === 'cals' ? 'var(--accent-green)'
    : metric === 'protein' ? 'var(--accent-purple)'
    : metric === 'water' ? 'var(--accent-blue)'
    : 'var(--accent-amber)';

  const metricUnit = metric === 'cals' ? 'kcal'
    : metric === 'protein' ? 'g protein'
    : metric === 'water' ? 'ml'
    : 'std drinks';

  const nonZero7 = dailyData7.filter(d => d.cals > 0);
  const avgCals = nonZero7.length > 0 ? Math.round(nonZero7.reduce((s, d) => s + d.cals, 0) / nonZero7.length) : 0;
  const avgProtein = nonZero7.length > 0 ? Math.round(nonZero7.reduce((s, d) => s + d.protein, 0) / nonZero7.length) : 0;
  const totalWeekCals = dailyData7.reduce((s, d) => s + d.cals, 0);
  const totalWeekAlcohol = parseFloat(dailyData7.reduce((s, d) => s + d.alcohol, 0).toFixed(1));

  const expandedEntries = expandedDate ? getEntriesForDate(entries, expandedDate) : [];

  const referenceValue = metric === 'cals' ? calorieGoal : metric === 'protein' ? proteinGoal : undefined;

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex gap-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 3 }}>
        {([['7d', 'Week'], ['30d', '30 days'], ['months', 'Months']] as [Period, string][]).map(([p, label]) => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            flex: 1, padding: '7px', borderRadius: 7, border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: period === p ? 600 : 400,
            background: period === p ? 'var(--accent-green)' : 'transparent',
            color: period === p ? '#0d0d0f' : 'var(--text-secondary)',
            transition: 'all 0.15s',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Metric selector */}
      <div className="flex gap-2">
        {([
          ['cals', '🔥', 'Calories'],
          ['protein', '💪', 'Protein'],
          ['water', '💧', 'Hydration'],
          ['alcohol', '🍺', 'Alcohol'],
        ] as [Metric, string, string][]).map(([m, emoji, label]) => {
          const color = m === 'cals' ? 'var(--accent-green)' : m === 'protein' ? 'var(--accent-purple)' : m === 'water' ? 'var(--accent-blue)' : 'var(--accent-amber)';
          return (
            <button key={m} onClick={() => setMetric(m)} style={{
              flex: 1, padding: '6px 2px', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 11,
              background: metric === m ? `${color}22` : 'var(--bg-card)',
              color: metric === m ? color : 'var(--text-muted)',
              border: `1px solid ${metric === m ? color : 'var(--border)'}`,
              transition: 'all 0.15s',
            }}>
              {emoji} {label}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {period === 'months' ? 'Monthly averages' : period === '7d' ? 'Last 7 days' : 'Last 30 days'}
          </p>
          {period === '7d' && metric === 'cals' && avgCals > 0 && (
            <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>avg {avgCals} kcal/day</span>
          )}
          {period === '7d' && metric === 'protein' && avgProtein > 0 && (
            <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>avg {avgProtein}g/day</span>
          )}
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barCategoryGap="30%">
            <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            {referenceValue && period !== 'months' && (
              <ReferenceLine y={referenceValue} stroke="var(--border-light)" strokeDasharray="4 4" />
            )}
            <Bar dataKey={metricKey} name={metricUnit} radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => {
                const val = (entry as any)[metricKey] || 0;
                const isOver = (metric === 'cals' || metric === 'protein') && period !== 'months' && referenceValue && val > referenceValue;
                return (
                  <Cell
                    key={i}
                    fill={isOver ? 'var(--accent-amber)' : metricColor}
                    fillOpacity={val === 0 ? 0.15 : 0.85}
                    cursor={period !== 'months' ? 'pointer' : 'default'}
                    onClick={() => {
                      if ('date' in entry && period !== 'months') {
                        setExpandedDate(expandedDate === entry.date ? null : entry.date);
                      }
                    }}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly summary */}
      {period === '7d' && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'week cals', value: totalWeekCals.toLocaleString(), color: 'var(--accent-green)' },
            { label: 'avg kcal/day', value: avgCals, color: 'var(--accent-green)' },
            { label: 'avg protein', value: `${avgProtein}g`, color: 'var(--accent-purple)' },
            { label: 'std drinks', value: totalWeekAlcohol, color: totalWeekAlcohol > 14 ? 'var(--accent-red)' : 'var(--accent-amber)' },
          ].map(stat => (
            <div key={stat.label} className="card p-3 text-center">
              <div className="mono font-medium" style={{ fontSize: 16, color: stat.color }}>{stat.value}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded day detail */}
      {expandedDate && expandedEntries.length > 0 && (
        <div className="card p-4 fade-in">
          <p className="text-sm font-medium mb-3">{formatDateStr(expandedDate)}</p>
          <div className="space-y-2">
            {expandedEntries.map(e => (
              <div key={e.id} className="flex items-center justify-between gap-2">
                <div className="text-sm flex-1" style={{ color: 'var(--text-secondary)' }}>
                  {e.type === 'meal' ? '🍽️' : e.type === 'alcohol' ? '🍺' : e.type === 'water' ? '💧' : '🥤'} {e.name}
                  {e.isAIEstimated && <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>✦</span>}
                </div>
                <div className="flex items-center gap-3">
                  {e.protein ? <span className="mono text-xs" style={{ color: 'var(--accent-purple)' }}>{e.protein}g</span> : null}
                  <span className="mono text-sm" style={{ color: 'var(--accent-green)' }}>{e.calories} kcal</span>
                  <button
                    onClick={() => onDelete(e.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }} className="flex items-center justify-between">
              <div className="text-sm font-semibold">Total</div>
              <div className="flex gap-3">
                <span className="mono text-sm" style={{ color: 'var(--accent-purple)' }}>{sumProtein(expandedEntries)}g protein</span>
                <span className="mono text-sm font-semibold" style={{ color: 'var(--accent-green)' }}>{sumCalories(expandedEntries)} kcal</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
