import { useMemo } from 'react';
import { Gauge, Route, Wallet } from 'lucide-react';
import type { ServiceRecord, FuelRecord } from '@/lib/supabase';

interface CPKCardProps {
  serviceRecords: ServiceRecord[];
  fuelRecords: FuelRecord[];
}

export default function CPKCard({ serviceRecords, fuelRecords }: CPKCardProps) {
  const { cpk, totalCost, totalDistance, minKm, maxKm } = useMemo(() => {
    const allMileages = [
      ...serviceRecords.map((r) => r.mileage_km),
      ...fuelRecords.map((r) => r.mileage_km),
    ];

    const totalFuelCost = fuelRecords.reduce((s, r) => s + Number(r.total_cost_rm), 0);
    const totalServiceCost = serviceRecords.reduce((s, r) => s + Number(r.cost_rm), 0);
    const cost = totalFuelCost + totalServiceCost;

    const min = allMileages.length > 0 ? Math.min(...allMileages) : 0;
    const max = allMileages.length > 0 ? Math.max(...allMileages) : 0;
    const distance = max - min;

    const cpkValue = distance > 0 ? cost / distance : null;

    return {
      cpk: cpkValue,
      totalCost: cost,
      totalDistance: distance,
      minKm: min,
      maxKm: max,
    };
  }, [serviceRecords, fuelRecords]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">Cost Per Kilometer</p>
          <p className="mt-1.5 text-3xl font-bold text-white tabular-nums">
            {cpk !== null ? `RM ${cpk.toFixed(4)}` : '—'}
            <span className="ml-1.5 text-lg font-medium text-slate-400">/km</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Jumlah kos ÷ jarak odometer
          </p>
        </div>
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
          <Gauge className="h-6 w-6 text-orange-400" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Wallet className="h-3 w-3" />
            Jumlah Kos
          </div>
          <p className="mt-1 text-sm font-bold text-white tabular-nums">
            RM {totalCost.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Route className="h-3 w-3" />
            Jarak
          </div>
          <p className="mt-1 text-sm font-bold text-white tabular-nums">
            {totalDistance > 0
              ? `${totalDistance.toLocaleString('ms-MY')} km`
              : '—'}
          </p>
        </div>
        <div className="rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Gauge className="h-3 w-3" />
            Odometer
          </div>
          <p className="mt-1 text-sm font-bold text-white tabular-nums">
            {minKm > 0
              ? `${minKm.toLocaleString('ms-MY')}–${maxKm.toLocaleString('ms-MY')}`
              : '—'}
          </p>
        </div>
      </div>

      {cpk === null && (
        <p className="mt-3 rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-400">
          CPK akan dikira apabila ada sekurang-kurangnya 2 bacaan odometer berbeza.
        </p>
      )}
    </div>
  );
}
