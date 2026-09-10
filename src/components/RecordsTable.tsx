import { useState } from 'react';
import { Trash2, Search, Pencil, Check, X, Loader2 } from 'lucide-react';
import { supabase, type ServiceRecord } from '@/lib/supabase';
import ReceiptThumbnail from '@/components/ReceiptThumbnail';

interface RecordsTableProps {
  records: ServiceRecord[];
  loading: boolean;
  onChanged: () => void;
}

const SERVICE_TYPE_COLORS: Record<string, string> = {
  'Servis Minor': 'bg-blue-50 text-blue-700 ring-blue-200',
  'Servis Major': 'bg-orange-50 text-orange-700 ring-orange-200',
  'Tukar Minyak Hitam': 'bg-amber-50 text-amber-700 ring-amber-200',
  'Tukar Penapis': 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  Brek: 'bg-red-50 text-red-700 ring-red-200',
  'Sistem Penyejuk': 'bg-teal-50 text-teal-700 ring-teal-200',
  'Pala Enjin': 'bg-purple-50 text-purple-700 ring-purple-200',
  Transmisi: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  Suspensi: 'bg-pink-50 text-pink-700 ring-pink-200',
  Pepasang: 'bg-green-50 text-green-700 ring-green-200',
  'Lain-lain': 'bg-slate-100 text-slate-700 ring-slate-300',
};

export default function RecordsTable({
  records,
  loading,
  onChanged,
}: RecordsTableProps) {
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<ServiceRecord>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const filtered = records.filter((r) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      r.service_type.toLowerCase().includes(q) ||
      (r.notes ?? '').toLowerCase().includes(q) ||
      r.mileage_km.toString().includes(q) ||
      r.cost_rm.toString().includes(q)
    );
  });

  async function handleDelete(id: string) {
    setDeletingId(id);
    await supabase.from('service_records').delete().eq('id', id);
    setDeletingId(null);
    onChanged();
  }

  function startEdit(record: ServiceRecord) {
    setEditingId(record.id);
    setEditValues({
      service_date: record.service_date,
      mileage_km: record.mileage_km,
      cost_rm: record.cost_rm,
      service_type: record.service_type,
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
      service_date: editValues.service_date,
      mileage_km: editValues.mileage_km,
      cost_rm: editValues.cost_rm,
      service_type: editValues.service_type,
      notes: (editValues.notes ?? '').trim() || null,
    };
    const { error } = await supabase
      .from('service_records')
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
          <h2 className="text-lg font-bold text-slate-900">Rekod Servis</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {filtered.length} rekod dipaparkan
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
              <th className="px-6 py-3 font-semibold">Jenis Servis</th>
              <th className="px-6 py-3 text-right font-semibold">Mileage (km)</th>
              <th className="px-6 py-3 text-right font-semibold">Kos (RM)</th>
              <th className="px-6 py-3 font-semibold">Catatan</th>
              <th className="px-6 py-3 text-center font-semibold">Resit</th>
              <th className="px-6 py-3 text-right font-semibold">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                  <p className="mt-2 text-sm text-slate-400">Memuatkan rekod...</p>
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <p className="text-sm font-medium text-slate-600">
                    {search ? 'Tiada rekod sepadan dengan carian.' : 'Belum ada rekod servis.'}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {search ? '' : 'Tambah rekod pertama menggunakan borang di atas.'}
                  </p>
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map((record) => {
                const isEditing = editingId === record.id;
                return (
                  <tr
                    key={record.id}
                    className="transition hover:bg-slate-50/60"
                  >
                    {/* Tarikh */}
                    <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editValues.service_date ?? ''}
                          onChange={(e) =>
                            setEditValues({ ...editValues, service_date: e.target.value })
                          }
                          className={editInputClass}
                        />
                      ) : (
                        fmtDate(record.service_date)
                      )}
                    </td>

                    {/* Jenis Servis */}
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValues.service_type ?? ''}
                          onChange={(e) =>
                            setEditValues({ ...editValues, service_type: e.target.value })
                          }
                          className={editInputClass}
                        />
                      ) : (
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                            SERVICE_TYPE_COLORS[record.service_type] ??
                            'bg-slate-100 text-slate-700 ring-slate-300'
                          }`}
                        >
                          {record.service_type}
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

                    {/* Kos */}
                    <td className="whitespace-nowrap px-6 py-4 text-right tabular-nums font-semibold text-slate-900">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={editValues.cost_rm ?? 0}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              cost_rm: parseFloat(e.target.value) || 0,
                            })
                          }
                          className={`${editInputClass} text-right`}
                        />
                      ) : (
                        fmtRM(record.cost_rm)
                      )}
                    </td>

                    {/* Catatan */}
                    <td className="max-w-xs px-6 py-4 text-slate-600">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValues.notes ?? ''}
                          onChange={(e) =>
                            setEditValues({ ...editValues, notes: e.target.value })
                          }
                          className={editInputClass}
                          placeholder="—"
                        />
                      ) : (
                        <span className="line-clamp-2">
                          {record.notes || <span className="text-slate-300">—</span>}
                        </span>
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
                            <span className="mr-2 text-xs text-red-600">{editError}</span>
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
