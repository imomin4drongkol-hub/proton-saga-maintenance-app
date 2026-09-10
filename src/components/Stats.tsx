import { Calendar, Gauge, Wallet, FileText } from 'lucide-react';
import type { ServiceRecord } from '@/lib/supabase';

interface StatsProps {
  records: ServiceRecord[];
}

export default function Stats({ records }: StatsProps) {
  const totalRecords = records.length;
  const totalCost = records.reduce((sum, r) => sum + Number(r.cost_rm), 0);
  const latestMileage = records.reduce(
    (max, r) => (r.mileage_km > max ? r.mileage_km : max),
    0,
  );
  const lastService = records
    .map((r) => r.service_date)
    .sort((a, b) => (a < b ? 1 : -1))[0];

  const cards = [
    {
      label: 'Jumlah Rekod',
      value: totalRecords.toString(),
      hint: 'rekod servis',
      icon: FileText,
      color: 'blue',
    },
    {
      label: 'Jumlah Kos',
      value: `RM ${totalCost.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      hint: 'keseluruhan',
      icon: Wallet,
      color: 'orange',
    },
    {
      label: 'Mileage Terkini',
      value: latestMileage.toLocaleString('ms-MY'),
      hint: 'km',
      icon: Gauge,
      color: 'green',
    },
    {
      label: 'Servis Terakhir',
      value: lastService
        ? new Date(lastService).toLocaleDateString('ms-MY', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : '—',
      hint: 'tarikh',
      icon: Calendar,
      color: 'slate',
    },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
    orange: 'bg-orange-500/10 text-orange-400 ring-orange-500/20',
    green: 'bg-green-500/10 text-green-400 ring-green-500/20',
    slate: 'bg-slate-500/10 text-slate-300 ring-slate-500/20',
  };

  return (
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
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
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
  );
}
