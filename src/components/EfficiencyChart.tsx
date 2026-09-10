import { useMemo } from 'react';
import { LineChart as LineChartIcon, TrendingUp, TrendingDown, Gauge } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { FuelRecord } from '@/lib/supabase';

interface EfficiencyChartProps {
  records: FuelRecord[];
}

interface ChartPoint {
  date: string;
  label: string;
  shortDate: string;
  kmPerLiter: number;
  liters: number;
  distance: number;
  station: string | null;
}

function computeEfficiencyTrend(records: FuelRecord[]): ChartPoint[] {
  const sorted = [...records].sort((a, b) =>
    a.fill_date < b.fill_date ? -1 : a.fill_date > b.fill_date ? 1 : 0,
  );

  const points: ChartPoint[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    if (prev.full_tank && curr.full_tank) {
      const distance = curr.mileage_km - prev.mileage_km;
      if (distance > 0 && Number(curr.liters) > 0) {
        const kmPerLiter = distance / Number(curr.liters);
        const d = new Date(curr.fill_date);
        points.push({
          date: curr.fill_date,
          label: d.toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: '2-digit' }),
          shortDate: d.toLocaleDateString('ms-MY', { day: '2-digit', month: 'short' }),
          kmPerLiter: Math.round(kmPerLiter * 100) / 100,
          liters: Number(curr.liters),
          distance,
          station: curr.station,
        });
      }
    }
  }

  return points;
}

export default function EfficiencyChart({ records }: EfficiencyChartProps) {
  const { chartData, avg, maxPoint, minPoint } = useMemo(() => {
    const points = computeEfficiencyTrend(records);
    const avgValue =
      points.length > 0
        ? points.reduce((s, p) => s + p.kmPerLiter, 0) / points.length
        : null;

    let max: ChartPoint | null = null;
    let min: ChartPoint | null = null;

    for (const p of points) {
      if (p.kmPerLiter > 0) {
        if (!max || p.kmPerLiter > max.kmPerLiter) max = p;
        if (!min || p.kmPerLiter < min.kmPerLiter) min = p;
      }
    }

    return { chartData: points, avg: avgValue, maxPoint: max, minPoint: min };
  }, [records]);

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
            <LineChartIcon className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <h3 className="text-base font-bold text-slate-900">Trend Kecekapan km/L</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <LineChartIcon className="h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">
            Perlukan sekurang-kurangnya 2 isian Full Tank
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Graf trend kecekapan akan dipaparkan selepas ada 2 atau lebih isian Full Tank berturut
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Title + average badge */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
            <LineChartIcon className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Trend Kecekapan km/L</h3>
            <p className="text-xs text-slate-500">Hanya isian Full Tank berturut-turut</p>
          </div>
        </div>
        {avg !== null && (
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2 ring-1 ring-slate-200">
            <Gauge className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-xs font-medium text-slate-500">Purata</p>
              <p className="text-sm font-bold text-slate-700 tabular-nums">{avg.toFixed(2)} km/L</p>
            </div>
          </div>
        )}
      </div>

      {/* Min / Max stat cards */}
      {(maxPoint || minPoint) && (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {maxPoint && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                <TrendingUp className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Penjimatan Maksimum
                </p>
                <p className="mt-0.5 text-lg font-bold text-emerald-800 tabular-nums">
                  {maxPoint.kmPerLiter.toFixed(2)} km/L
                </p>
                <p className="mt-0.5 truncate text-xs text-emerald-600">
                  {maxPoint.shortDate}
                  {maxPoint.station ? ` · ${maxPoint.station}` : ''}
                </p>
              </div>
            </div>
          )}

          {minPoint && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/80 p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-600">
                <TrendingDown className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                  Penjimatan Minimum
                </p>
                <p className="mt-0.5 text-lg font-bold text-red-800 tabular-nums">
                  {minPoint.kmPerLiter.toFixed(2)} km/L
                </p>
                <p className="mt-0.5 truncate text-xs text-red-600">
                  {minPoint.shortDate}
                  {minPoint.station ? ` · ${minPoint.station}` : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="mt-5 h-56 w-full overflow-hidden sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
              angle={chartData.length > 6 ? -20 : 0}
              textAnchor={chartData.length > 6 ? 'end' : 'middle'}
              height={chartData.length > 6 ? 50 : 30}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
              formatter={(value) => [`${Number(value).toFixed(2)} km/L`, 'Kecekapan']}
            />
            {maxPoint && (
              <ReferenceLine
                y={maxPoint.kmPerLiter}
                stroke="#10b981"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{
                  value: `Max ${maxPoint.kmPerLiter.toFixed(2)}`,
                  position: 'right',
                  fill: '#059669',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
            )}
            {minPoint && (
              <ReferenceLine
                y={minPoint.kmPerLiter}
                stroke="#ef4444"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{
                  value: `Min ${minPoint.kmPerLiter.toFixed(2)}`,
                  position: 'right',
                  fill: '#dc2626',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
            )}
            {avg !== null && (
              <ReferenceLine
                y={Math.round(avg * 100) / 100}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                label={{
                  value: `Purata ${avg.toFixed(2)}`,
                  position: 'left',
                  fill: '#64748b',
                  fontSize: 10,
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="kmPerLiter"
              name="km/L"
              stroke="#22c55e"
              strokeWidth={2.5}
              dot={{ fill: '#22c55e', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {chartData.length} titik data · pengiraan: (mileage semasa − mileage sebelum) ÷ liter isian terbaharu
      </p>
    </div>
  );
}
