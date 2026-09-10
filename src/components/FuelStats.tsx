import { Fuel, Gauge, TrendingUp, Wallet, BarChart3 } from 'lucide-react';
import type { FuelRecord } from '@/lib/supabase';

interface FuelStatsProps {
  records: FuelRecord[];
}

interface EfficiencyCalc {
  totalDistance: number;
  totalLiters: number;
  avgKmPerLiter: number | null;
  avgLPer100km: number | null;
}

function computeFullTankEfficiency(records: FuelRecord[]): EfficiencyCalc {
  const sorted = [...records].sort((a, b) =>
    a.fill_date < b.fill_date ? -1 : a.fill_date > b.fill_date ? 1 : 0,
  );

  let totalDistance = 0;
  let totalLiters = 0;

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    if (prev.full_tank && curr.full_tank) {
      const distance = curr.mileage_km - prev.mileage_km;
      if (distance > 0) {
        totalDistance += distance;
        totalLiters += Number(curr.liters);
      }
    }
  }

  const avgKmPerLiter =
    totalDistance > 0 && totalLiters > 0 ? totalDistance / totalLiters : null;
  const avgLPer100km =
    totalDistance > 0 && totalLiters > 0
      ? (totalLiters / totalDistance) * 100
      : null;

  return { totalDistance, totalLiters, avgKmPerLiter, avgLPer100km };
}

export default function FuelStats({ records }: FuelStatsProps) {
  const totalFills = records.length;
  const totalCost = records.reduce((s, r) => s + Number(r.total_cost_rm), 0);
  const totalLiters = records.reduce((s, r) => s + Number(r.liters), 0);

  const efficiency = computeFullTankEfficiency(records);

  const sorted = [...records].sort((a, b) =>
    a.fill_date < b.fill_date ? -1 : 1,
  );
  const odometerDistance =
    sorted.length > 1
      ? sorted[sorted.length - 1].mileage_km - sorted[0].mileage_km
      : 0;

  const avgRMperKm =
    odometerDistance > 0 ? totalCost / odometerDistance : null;
  const latestMileage = records.reduce(
    (max, r) => (r.mileage_km > max ? r.mileage_km : max),
    0,
  );

  const fullTankCount = records.filter((r) => r.full_tank).length;

  const cards = [
    {
      label: 'Jumlah Isi',
      value: totalFills.toString(),
      hint: `${fullTankCount} full tank`,
      icon: Fuel,
      color: 'orange',
    },
    {
      label: 'Jumlah Kos',
      value: `RM ${totalCost.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      hint: `${totalLiters.toFixed(1)} L keseluruhan`,
      icon: Wallet,
      color: 'blue',
    },
    {
      label: 'Purata km/L',
      value:
        efficiency.avgKmPerLiter !== null
          ? efficiency.avgKmPerLiter.toFixed(2)
          : '—',
      hint:
        efficiency.totalDistance > 0
          ? `over ${efficiency.totalDistance.toLocaleString('ms-MY')} km (full tank)`
          : 'perlukan 2 isi penuh',
      icon: Gauge,
      color: 'green',
    },
    {
      label: 'Purata L/100km',
      value:
        efficiency.avgLPer100km !== null
          ? efficiency.avgLPer100km.toFixed(2)
          : '—',
      hint:
        efficiency.totalLiters > 0
          ? `${efficiency.totalLiters.toFixed(1)} L / ${efficiency.totalDistance.toLocaleString('ms-MY')} km`
          : 'perlukan 2 isi penuh',
      icon: BarChart3,
      color: 'slate',
    },
  ];

  const colorMap: Record<string, string> = {
    orange: 'bg-orange-500/10 text-orange-500 ring-orange-500/20',
    blue: 'bg-blue-500/10 text-blue-500 ring-blue-500/20',
    green: 'bg-green-500/10 text-green-500 ring-green-500/20',
    slate: 'bg-slate-500/10 text-slate-500 ring-slate-500/20',
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-1.5 text-xl font-bold text-slate-900 truncate">
                    {card.value}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">{card.hint}</p>
                </div>
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ring-1 ${colorMap[card.color]}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Efficiency detail bar */}
      {efficiency.avgKmPerLiter !== null && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
              <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Analisis Kecekapan Bahan Api
            </h3>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs font-medium text-slate-500">km/L</p>
              <p className="mt-1 text-lg font-bold text-green-600 tabular-nums">
                {efficiency.avgKmPerLiter.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">L/100km</p>
              <p className="mt-1 text-lg font-bold text-slate-800 tabular-nums">
                {efficiency.avgLPer100km!.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">RM/km</p>
              <p className="mt-1 text-lg font-bold text-orange-600 tabular-nums">
                {avgRMperKm !== null ? `RM ${avgRMperKm.toFixed(4)}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Mileage</p>
              <p className="mt-1 text-lg font-bold text-slate-800 tabular-nums">
                {latestMileage.toLocaleString('ms-MY')} km
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            * Pengiraan km/L dan L/100km hanya menggunakan isian Full Tank berturut-turut
            ({fullTankCount} rekod) untuk ketepatan — kaedah standard industri.
          </p>
        </div>
      )}
    </div>
  );
}
