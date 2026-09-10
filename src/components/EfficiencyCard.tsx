import { useMemo } from 'react';
import { Gauge, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { FuelRecord } from '@/lib/supabase';

interface EfficiencyCardProps {
  records: FuelRecord[];
}

interface EfficiencyPoint {
  date: string;
  label: string;
  kmPerLiter: number;
  liters: number;
  distance: number;
}

function computeEfficiencyTrend(records: FuelRecord[]): EfficiencyPoint[] {
  const sorted = [...records].sort((a, b) =>
    a.fill_date < b.fill_date ? -1 : a.fill_date > b.fill_date ? 1 : 0,
  );

  const points: EfficiencyPoint[] = [];

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
          label: d.toLocaleDateString('ms-MY', { day: '2-digit', month: 'short' }),
          kmPerLiter: Math.round(kmPerLiter * 100) / 100,
          liters: Number(curr.liters),
          distance,
        });
      }
    }
  }

  return points;
}

export default function EfficiencyCard({ records }: EfficiencyCardProps) {
  const { trend, avgKmPerLiter, recentAvg, trendDirection } = useMemo(() => {
    const fullTankTrend = computeEfficiencyTrend(records);
    const avg =
      fullTankTrend.length > 0
        ? fullTankTrend.reduce((s, p) => s + p.kmPerLiter, 0) / fullTankTrend.length
        : null;

    const recent = fullTankTrend.slice(-5);
    const recentAvgValue =
      recent.length > 0
        ? recent.reduce((s, p) => s + p.kmPerLiter, 0) / recent.length
        : null;

    let direction: 'up' | 'down' | 'flat' = 'flat';
    if (recent.length >= 2) {
      const first = recent[0].kmPerLiter;
      const last = recent[recent.length - 1].kmPerLiter;
      const diff = last - first;
      if (diff > 0.3) direction = 'up';
      else if (diff < -0.3) direction = 'down';
    }

    return {
      trend: fullTankTrend,
      avgKmPerLiter: avg,
      recentAvg: recentAvgValue,
      trendDirection: direction,
    };
  }, [records]);

  if (trend.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
            <Gauge className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Purata Kecekapan km/L</h3>
            <p className="text-xs text-slate-500">Berdasarkan 3-5 isian Full Tank terkini</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Gauge className="h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">
            Perlukan sekurang-kurangnya 2 isian Full Tank
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Tambah rekod petrol dengan pilihan "Full Tank" untuk mengaktifkan pengiraan kecekapan
          </p>
        </div>
      </div>
    );
  }

  const TrendIcon = trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Gauge;
  const trendColor =
    trendDirection === 'up' ? 'text-green-600' : trendDirection === 'down' ? 'text-red-600' : 'text-slate-500';
  const trendLabel =
    trendDirection === 'up' ? 'Meningkat' : trendDirection === 'down' ? 'Menurun' : 'Stabil';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
            <Gauge className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Purata Kecekapan km/L</h3>
            <p className="text-xs text-slate-500">Berdasarkan {Math.min(5, trend.length)} isian Full Tank terkini</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-medium text-slate-500">Purata Keseluruhan</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">
              {avgKmPerLiter !== null ? avgKmPerLiter.toFixed(2) : '—'}
              <span className="ml-1 text-sm font-medium text-slate-400">km/L</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-slate-500">5 Isian Terkini</p>
            <div className="flex items-center gap-1.5">
              <p className={`text-2xl font-bold tabular-nums ${trendColor}`}>
                {recentAvg !== null ? recentAvg.toFixed(2) : '—'}
              </p>
              <TrendIcon className={`h-5 w-5 ${trendColor}`} />
            </div>
            <p className={`text-xs font-medium ${trendColor}`}>{trendLabel}</p>
          </div>
        </div>
      </div>

      {trend.length >= 2 && (
        <div className="mt-5 h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                formatter={(value) => [`${Number(value).toFixed(2)} km/L`, 'Kecekapan']}
              />
              <Line
                type="monotone"
                dataKey="kmPerLiter"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={{ fill: '#22c55e', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
