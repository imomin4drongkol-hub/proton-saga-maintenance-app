import { Fuel, AlertTriangle, TrendingDown, Info } from 'lucide-react';
import type { FuelRecord } from '@/lib/supabase';
import { computeRefuelPattern, getEffectiveRange, getDefaultLowFuelWarning } from '@/lib/fuel-calc';
import { useVehicle } from '@/components/VehicleContext';

interface RefuelPatternCardProps {
  records: FuelRecord[];
}

export default function RefuelPatternCard({ records }: RefuelPatternCardProps) {
  const { activeVehicle } = useVehicle();
  const lowFuelThreshold = getDefaultLowFuelWarning(activeVehicle);
  const pattern = computeRefuelPattern(records, lowFuelThreshold);

  if (pattern.totalFills === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
          <Fuel className="h-4 w-4" strokeWidth={2.5} />
        </div>
        <h3 className="text-base font-bold text-slate-900">Tahap Isi Semula Biasa</h3>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-center gap-1.5">
            <TrendingDown className="h-3.5 w-3.5 text-slate-500" />
            <p className="text-xs font-medium text-slate-500">Purata Baki Range</p>
          </div>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 tabular-nums">
            {pattern.avgRangeBeforeFill !== null
              ? `${pattern.avgRangeBeforeFill}`
              : '—'}
            <span className="ml-1 text-sm font-normal text-slate-400">km</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-400">sebelum isi petrol</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-center gap-1.5">
            <Fuel className="h-3.5 w-3.5 text-red-500" />
            <p className="text-xs font-medium text-slate-500">Isi Ketika Petrol Rendah</p>
          </div>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 tabular-nums">
            {pattern.lowFuelFillCount}
            <span className="ml-1 text-sm font-normal text-slate-400">/ {pattern.totalFills}</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-400">rekod ({pattern.lowFuelPercentage}%)</p>
        </div>

        <div className={`rounded-xl p-4 ${pattern.lowFuelPercentage > 30 ? 'bg-red-50' : 'bg-green-50'}`}>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className={`h-3.5 w-3.5 ${pattern.lowFuelPercentage > 30 ? 'text-red-500' : 'text-green-500'}`} />
            <p className={`text-xs font-medium ${pattern.lowFuelPercentage > 30 ? 'text-red-600' : 'text-green-600'}`}>Status Tabiat</p>
          </div>
          <p className={`mt-1.5 text-lg font-bold ${pattern.lowFuelPercentage > 30 ? 'text-red-700' : 'text-green-700'}`}>
            {pattern.lowFuelPercentage > 30 ? 'Perhatian' : 'Baik'}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {pattern.lowFuelPercentage > 30 ? 'kerap isi terlalu kosong' : 'tabiat isi sihat'}
          </p>
        </div>
      </div>

      {pattern.showAdvice && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50 p-3.5 ring-1 ring-amber-200">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
          <p className="text-xs leading-relaxed text-amber-800">
            Lebih 30% pengisian anda dibuat ketika petrol rendah (bar merah).
            Kerap beroperasi dengan paras petrol sangat rendah boleh menyebabkan
            pam minyak cepat rosak kerana pam mengecil panas tanpa petrol sebagai penyejuk.
            Disarankan isi petrol apabila baki range masih melebihi {lowFuelThreshold} km.
          </p>
        </div>
      )}
    </div>
  );
}
