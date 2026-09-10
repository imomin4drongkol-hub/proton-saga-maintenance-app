import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingDown, Calendar } from 'lucide-react';
import type { ServiceRecord, FuelRecord } from '@/lib/supabase';

interface CostAnalyticsProps {
  serviceRecords: ServiceRecord[];
  fuelRecords: FuelRecord[];
}

interface MonthData {
  month: string;
  label: string;
  petrol: number;
  servis: number;
  total: number;
}

const MONTH_NAMES_MS = [
  'Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis',
];

export default function CostAnalytics({
  serviceRecords,
  fuelRecords,
}: CostAnalyticsProps) {
  const { chartData, avgMonthly, totalPetrol, totalService, monthCount } = useMemo(() => {
    const monthMap = new Map<string, MonthData>();

    function getOrCreateMonth(yearMonth: string): MonthData {
      if (monthMap.has(yearMonth)) return monthMap.get(yearMonth)!;
      const [year, month] = yearMonth.split('-');
      const monthIdx = parseInt(month, 10) - 1;
      const data: MonthData = {
        month: yearMonth,
        label: `${MONTH_NAMES_MS[monthIdx]} ${year.slice(2)}`,
        petrol: 0,
        servis: 0,
        total: 0,
      };
      monthMap.set(yearMonth, data);
      return data;
    }

    for (const r of fuelRecords) {
      const ym = r.fill_date.slice(0, 7);
      const entry = getOrCreateMonth(ym);
      entry.petrol += Number(r.total_cost_rm);
      entry.total += Number(r.total_cost_rm);
    }

    for (const r of serviceRecords) {
      const ym = r.service_date.slice(0, 7);
      const entry = getOrCreateMonth(ym);
      entry.servis += Number(r.cost_rm);
      entry.total += Number(r.cost_rm);
    }

    const sorted = [...monthMap.values()].sort((a, b) =>
      a.month < b.month ? -1 : 1,
    );

    const totalPetrol = sorted.reduce((s, m) => s + m.petrol, 0);
    const totalService = sorted.reduce((s, m) => s + m.servis, 0);
    const monthCount = sorted.length;
    const avgMonthly = monthCount > 0 ? (totalPetrol + totalService) / monthCount : 0;

    return {
      chartData: sorted,
      avgMonthly,
      totalPetrol,
      totalService,
      monthCount,
    };
  }, [serviceRecords, fuelRecords]);

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-500/10 text-slate-500">
            <TrendingDown className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <h3 className="text-base font-bold text-slate-900">Analisis Kos Bulanan</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">
            Belum ada data untuk analisis
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Tambah rekod servis atau petrol untuk melihat trend perbelanjaan bulanan
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-500/10 text-slate-500">
            <TrendingDown className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Analisis Kos Bulanan</h3>
            <p className="text-xs text-slate-500">Trend perbelanjaan Petrol vs Servis</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:text-right">
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-xs font-medium text-slate-500">Purata/Bulan</p>
            <p className="mt-0.5 text-sm font-bold text-slate-800 tabular-nums">
              RM {avgMonthly.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-xl bg-orange-50 px-3 py-2">
            <p className="text-xs font-medium text-orange-600">Petrol</p>
            <p className="mt-0.5 text-sm font-bold text-orange-700 tabular-nums">
              RM {totalPetrol.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-xl bg-blue-50 px-3 py-2">
            <p className="text-xs font-medium text-blue-600">Servis</p>
            <p className="mt-0.5 text-sm font-bold text-blue-700 tabular-nums">
              RM {totalService.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `RM${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
              formatter={(value) => `RM ${Number(value).toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
              iconType="circle"
            />
            <Bar dataKey="petrol" name="Petrol" fill="#f97316" radius={[6, 6, 0, 0]} maxBarSize={50} />
            <Bar dataKey="servis" name="Servis" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Purata RM/bulan dikira dari {monthCount} bulan dengan data — jumlah keseluruhan dibahagikan dengan bilangan bulan.
      </p>
    </div>
  );
}
