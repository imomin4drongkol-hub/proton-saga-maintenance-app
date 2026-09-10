import { useState } from 'react';
import { Trash2, Search, Pencil, Check, X, Loader2, Fuel } from 'lucide-react';
import { supabase, type FuelRecord } from '@/lib/supabase';
import ReceiptThumbnail from '@/components/ReceiptThumbnail';

interface FuelTableProps {
  records: FuelRecord[];
  loading: boolean;
  onChanged: () => void;
}

const FUEL_TYPE_COLORS: Record<string, string> = {
  RON95: 'bg-green-50 text-green-700 ring-green-200',
  RON97: 'bg-blue-50 text-blue-700 ring-blue-200',
  Diesel: 'bg-amber-50 text-amber-700 ring-amber-200',
};

interface DisplayRow extends FuelRecord {
  distance_km: number | null;
  rm_per_km: number | null;
  km_per_liter: number | null;
}

function computeStats(records: FuelRecord[]): DisplayRow[] {
  const sorted = [...records].sort((a, b) =>
    a.fill_date < b.fill_date ? -1 : a.fill_date > b.fill_date ? 1 : 0,
  );
  return sorted.map((r, i) => {
    const prev = i > 0 ? sorted[i - 1] : null;
    const distance = prev ? r.mileage_km - prev.mileage_km : null;
    const rmPerKm =
      distance !== null && distance > 0
        ? Number(r.total_cost_rm) / distance
        : null;
    const kmPerLiter =
      distance !== null && distance > 0
        ? distance / Number(r.liters)
        : null;
    return {
      ...r,
      distance_km: distance,
      rm_per_km: rmPerKm,
      km_per_liter: kmPerLiter,
    };
  });
}

export default function FuelTable({ records, loading, onChanged }: FuelTableProps) {
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<FuelRecord>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const displayRows = computeStats(records);

  const filtered = displayRows.filter((r) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      r.fuel_type.toLowerCase().includes(q) ||
      (r.station ?? '').toLowerCase().includes(q) ||
      (r.notes ?? '').toLowerCase().includes(q) ||
      r.mileage_km.toString().includes(q)
    );
  });

  async function handleDelete(id: string) {
    setDeletingId(id);
    await supabase.from('fuel_records').delete().eq('id', id);
    setDeletingId(null);
    onChanged();
  }

  function startEdit(record: FuelRecord) {
    setEditingId(record.id);
    setEditValues({
      fill_date: record.fill_date,
      mileage_km: record.mileage_km,
      liters: record.liters,
      price_per_liter_rm: record.price_per_liter_rm,
      total_cost_rm: record.total_cost_rm,
      fuel_type: record.fuel_type,
      station: record.station ?? '',
      full_tank: record.full_tank,
      notes: record.notes ?? '',
    });
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues({});
    setEditError(null);
  }

  async function saveEdit(id: string) {
    setEditError(null);
    setSavingEdit(true);
    const updates = {
      fill_date: editValues.fill_date,
      mileage_km: editValues.mileage_km,
      liters: editValues.liters,
      price_per_liter_rm: editValues.price_per_liter_rm,
      total_cost_rm: editValues.total_cost_rm,
      fuel_type: editValues.fuel_type,
      station: (editValues.station ?? '').trim() || null,
      full_tank: editValues.full_tank,
      notes: (editValues.notes ?? '').trim() || null,
    };
    const { error } = await supabase
      .from('fuel_records')
      .update(updates)
      .eq('id', id);
    setSavingEdit(false);
    if (error) {
      setEditError(error.message);
      return;
    }
    cancelEdit();
    onChanged();
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const fmtRM = (v: number) =>
    `RM ${Number(v).toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const editInputClass =
    'w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Rekod Isi Petrol</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {filtered.length} rekod dipaparkan · RM/km dikira antara isi berturut
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari rekod..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:w-64"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-6 py-3 font-semibold">Tarikh</th>
              <th className="px-6 py-3 font-semibold">Petrol</th>
              <th className="px-6 py-3 text-right font-semibold">Mileage</th>
              <th className="px-6 py-3 text-right font-semibold">Jarak (km)</th>
              <th className="px-6 py-3 text-right font-semibold">Liter</th>
              <th className="px-6 py-3 text-right font-semibold">Kos (RM)</th>
              <th className="px-6 py-3 text-right font-semibold">km/L</th>
              <th className="px-6 py-3 text-right font-semibold">RM/km</th>
              <th className="px-6 py-3 font-semibold">Stesen</th>
              <th className="px-6 py-3 text-center font-semibold">Resit</th>
              <th className="px-6 py-3 text-right font-semibold">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={11} className="px-6 py-16 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                  <p className="mt-2 text-sm text-slate-400">Memuatkan rekod...</p>
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="px-6 py-16 text-center">
                  <Fuel className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-600">
                    {search
                      ? 'Tiada rekod sepadan dengan carian.'
                      : 'Belum ada rekod petrol.'}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {search
                      ? ''
                      : 'Tambah rekod pertama menggunakan borang di atas.'}
                  </p>
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map((record) => {
                const isEditing = editingId === record.id;
                return (
                  <tr key={record.id} className="transition hover:bg-slate-50/60">
                    {/* Tarikh */}
                    <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editValues.fill_date ?? ''}
                          onChange={(e) =>
                            setEditValues({ ...editValues, fill_date: e.target.value })
                          }
                          className={editInputClass}
                        />
                      ) : (
                        fmtDate(record.fill_date)
                      )}
                    </td>

                    {/* Petrol */}
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <select
                          value={editValues.fuel_type ?? 'RON95'}
                          onChange={(e) =>
                            setEditValues({ ...editValues, fuel_type: e.target.value })
                          }
                          className={editInputClass}
                        >
                          <option value="RON95">RON95</option>
                          <option value="RON97">RON97</option>
                          <option value="Diesel">Diesel</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                            FUEL_TYPE_COLORS[record.fuel_type] ??
                            'bg-slate-100 text-slate-700 ring-slate-300'
                          }`}
                        >
                          {record.fuel_type}
                        </span>
                      )}
                    </td>

                    {/* Mileage */}
                    <td className="whitespace-nowrap px-6 py-4 text-right tabular-nums text-slate-700">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          value={editValues.mileage_km ?? 0}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              mileage_km: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className={`${editInputClass} text-right`}
                        />
                      ) : (
                        record.mileage_km.toLocaleString('ms-MY')
                      )}
                    </td>

                    {/* Jarak */}
                    <td className="whitespace-nowrap px-6 py-4 text-right tabular-nums text-slate-500">
                      {record.distance_km !== null
                        ? record.distance_km.toLocaleString('ms-MY')
                        : '—'}
                    </td>

                    {/* Liter */}
                    <td className="whitespace-nowrap px-6 py-4 text-right tabular-nums text-slate-700">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          step="0.001"
                          value={editValues.liters ?? 0}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              liters: parseFloat(e.target.value) || 0,
                            })
                          }
                          className={`${editInputClass} text-right`}
                        />
                      ) : (
                        Number(record.liters).toFixed(3)
                      )}
                    </td>

                    {/* Kos */}
                    <td className="whitespace-nowrap px-6 py-4 text-right tabular-nums font-semibold text-slate-900">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={editValues.total_cost_rm ?? 0}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              total_cost_rm: parseFloat(e.target.value) || 0,
                            })
                          }
                          className={`${editInputClass} text-right`}
                        />
                      ) : (
                        fmtRM(record.total_cost_rm)
                      )}
                    </td>

                    {/* km/L */}
                    <td className="whitespace-nowrap px-6 py-4 text-right tabular-nums text-slate-600">
                      {record.km_per_liter !== null
                        ? record.km_per_liter.toFixed(2)
                        : '—'}
                    </td>

                    {/* RM/km */}
                    <td className="whitespace-nowrap px-6 py-4 text-right tabular-nums">
                      {record.rm_per_km !== null ? (
                        <span className="font-medium text-orange-600">
                          {record.rm_per_km.toFixed(4)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Stesen */}
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValues.station ?? ''}
                          onChange={(e) =>
                            setEditValues({ ...editValues, station: e.target.value })
                          }
                          className={editInputClass}
                          placeholder="—"
                        />
                      ) : (
                        record.station || <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Resit */}
                    <td className="px-6 py-4 text-center">
                      <ReceiptThumbnail receiptUrl={record.receipt_url} />
                    </td>

                    {/* Tindakan */}
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {editError && (
                            <span className="mr-2 text-xs text-red-600">
                              {editError}
                            </span>
                          )}
                          <button
                            onClick={() => saveEdit(record.id)}
                            disabled={savingEdit}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white transition hover:bg-green-700 disabled:opacity-60"
                            title="Simpan"
                          >
                            {savingEdit ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50"
                            title="Batal"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => startEdit(record)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            disabled={deletingId === record.id}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                            title="Padam"
                          >
                            {deletingId === record.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
