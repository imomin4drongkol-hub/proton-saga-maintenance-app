import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  CalendarClock,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  Sticker,
  Save,
} from 'lucide-react';
import { supabase, type ServiceTarget } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

interface ServiceReminderProps {
  latestMileage: number;
  vehicleId: string | null;
}

const COMMON_ITEMS = [
  'Minyak Enjin',
  'Minyak Gearbox ATF',
  'Penapis Udara',
  'Penapis Minyak',
  'Penapis AC',
  'Brake Pad Depan',
  'Brake Pad Belakang',
  'Coolant',
  'Spark Plug',
  'Tayar',
  'Battery',
  'Lain-lain',
];

const WARNING_KM = 1000;
const WARNING_DAYS = 14;

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function getKmStatus(
  targetKm: number | null,
  currentKm: number,
): {
  kmRemaining: number | null;
  isOverdue: boolean;
  isWarning: boolean;
  progress: number;
} {
  if (targetKm === null) return { kmRemaining: null, isOverdue: false, isWarning: false, progress: 0 };
  const remaining = targetKm - currentKm;
  const progress = Math.min(100, Math.round((currentKm / targetKm) * 100));
  return {
    kmRemaining: remaining,
    isOverdue: remaining <= 0,
    isWarning: remaining > 0 && remaining <= WARNING_KM,
    progress,
  };
}

function getDateStatus(
  targetDate: string | null,
): {
  daysRemaining: number | null;
  isOverdue: boolean;
  isWarning: boolean;
} {
  if (!targetDate) return { daysRemaining: null, isOverdue: false, isWarning: false };
  const target = new Date(targetDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const days = daysBetween(now, target);
  return {
    daysRemaining: days,
    isOverdue: days < 0,
    isWarning: days >= 0 && days <= WARNING_DAYS,
  };
}

function getItemStatus(target: ServiceTarget, currentKm: number) {
  const km = getKmStatus(target.target_odometer_km, currentKm);
  const dt = getDateStatus(target.target_date);
  const isOverdue = km.isOverdue || dt.isOverdue;
  const isWarning = !isOverdue && (km.isWarning || dt.isWarning);
  return { km, dt, isOverdue, isWarning };
}

export default function ServiceReminder({ latestMileage, vehicleId }: ServiceReminderProps) {
  const { showToast } = useToast();
  const [targets, setTargets] = useState<ServiceTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    item_name: 'Minyak Enjin',
    target_odometer_km: '' as string | number,
    target_date: '',
    notes: '',
  });

  const fetchTargets = useCallback(async () => {
    if (!vehicleId) {
      setTargets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('service_targets')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: true });
    if (error) {
      showToast('Gagal memuatkan sasaran servis.', 'error');
    }
    setTargets(data ?? []);
    setLoading(false);
  }, [showToast, vehicleId]);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  function resetForm() {
    setForm({
      item_name: 'Minyak Enjin',
      target_odometer_km: '',
      target_date: '',
      notes: '',
    });
    setEditingId(null);
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(target: ServiceTarget) {
    setForm({
      item_name: target.item_name,
      target_odometer_km: target.target_odometer_km ?? '',
      target_date: target.target_date ?? '',
      notes: target.notes ?? '',
    });
    setEditingId(target.id);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.item_name.trim()) {
      showToast('Sila masukkan nama item.', 'error');
      return;
    }

    const payload = {
      vehicle_id: vehicleId,
      item_name: form.item_name.trim(),
      target_odometer_km:
        form.target_odometer_km === '' ? null : Number(form.target_odometer_km),
      target_date: form.target_date || null,
      notes: form.notes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    setSaving(true);

    if (editingId) {
      const { error } = await supabase
        .from('service_targets')
        .update(payload)
        .eq('id', editingId);
      setSaving(false);
      if (error) {
        showToast(`Ralat: ${error.message}`, 'error');
        return;
      }
      showToast('Sasaran servis berjaya dikemaskini.', 'success');
    } else {
      const { error } = await supabase
        .from('service_targets')
        .insert(payload);
      setSaving(false);
      if (error) {
        showToast(`Ralat: ${error.message}`, 'error');
        return;
      }
      showToast('Sasaran servis berjaya ditambah.', 'success');
    }

    setShowForm(false);
    resetForm();
    fetchTargets();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const { error } = await supabase.from('service_targets').delete().eq('id', id);
    setDeletingId(null);
    if (error) {
      showToast('Gagal memadam sasaran.', 'error');
      return;
    }
    showToast('Sasaran servis dipadam.', 'info');
    fetchTargets();
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const inputClass =
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
  const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

  const sortedTargets = [...targets].sort((a, b) => {
    const aStatus = getItemStatus(a, latestMileage);
    const bStatus = getItemStatus(b, latestMileage);
    if (aStatus.isOverdue && !bStatus.isOverdue) return -1;
    if (!aStatus.isOverdue && bStatus.isOverdue) return 1;
    if (aStatus.isWarning && !bStatus.isWarning) return -1;
    if (!aStatus.isWarning && bStatus.isWarning) return 1;
    return 0;
  });

  const overdueCount = targets.filter((t) => getItemStatus(t, latestMileage).isOverdue).length;
  const warningCount = targets.filter((t) => {
    const s = getItemStatus(t, latestMileage);
    return s.isWarning && !s.isOverdue;
  }).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <Sticker className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Peringatan Servis (Sticker)
            </h3>
            <p className="text-sm text-slate-500">
              Sasaran dari sticker servis — baki mileage & hari dikira automatik
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {overdueCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
              <AlertTriangle className="h-3.5 w-3.5" />
              {overdueCount} tertunggak
            </span>
          )}
          {warningCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
              <Bell className="h-3.5 w-3.5" />
              {warningCount} hampir tamat
            </span>
          )}
          {!showForm && (
            <button
              onClick={openAddForm}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Tambah
            </button>
          )}
        </div>
      </div>

      {/* Current mileage badge */}
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5">
        <Gauge className="h-4 w-4 text-slate-400" />
        <span className="text-sm text-slate-500">Odometer Terkini:</span>
        <span className="text-sm font-bold text-slate-800 tabular-nums">
          {latestMileage.toLocaleString('ms-MY')} km
        </span>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4 rounded-xl border border-blue-200 bg-blue-50/40 p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              {editingId ? 'Edit Sasaran Servis' : 'Tambah Sasaran Servis'}
            </p>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="item_name" className={labelClass}>
                Jenis Item
              </label>
              <select
                id="item_name"
                value={form.item_name}
                onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                className={inputClass}
              >
                {COMMON_ITEMS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="target_odometer_km" className={labelClass}>
                Sasaran Odometer (km)
              </label>
              <input
                id="target_odometer_km"
                type="number"
                min={0}
                step={1}
                placeholder="cth. 55000"
                value={form.target_odometer_km}
                onChange={(e) =>
                  setForm({ ...form, target_odometer_km: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="target_date" className={labelClass}>
                Sasaran Tarikh
              </label>
              <input
                id="target_date"
                type="date"
                value={form.target_date}
                onChange={(e) => setForm({ ...form, target_date: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="target_notes" className={labelClass}>
                Catatan
              </label>
              <input
                id="target_notes"
                type="text"
                placeholder="cth. Petronas Syntium 5W-30"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingId ? (
                <Save className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {editingId ? 'Simpan' : 'Tambah'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Targets list */}
      <div className="mt-4 space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        )}

        {!loading && sortedTargets.length === 0 && !showForm && (
          <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center">
            <Sticker className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-600">
              Belum ada sasaran servis dari sticker
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Klik "Tambah" untuk masukkan sasaran odometer & tarikh dari sticker servis anda
            </p>
          </div>
        )}

        {!loading &&
          sortedTargets.map((target) => {
            const status = getItemStatus(target, latestMileage);
            const { km, dt, isOverdue, isWarning } = status;

            let borderColor = 'border-slate-200';
            let bgColor = 'bg-white';
            let badgeBg = 'bg-green-50 text-green-700 ring-green-200';
            let BadgeIcon = CheckCircle2;
            let badgeLabel = 'On Track';

            if (isOverdue) {
              borderColor = 'border-red-300';
              bgColor = 'bg-red-50/40';
              badgeBg = 'bg-red-100 text-red-700 ring-red-300';
              BadgeIcon = AlertTriangle;
              badgeLabel = 'Tertunggak';
            } else if (isWarning) {
              borderColor = 'border-amber-300';
              bgColor = 'bg-amber-50/40';
              badgeBg = 'bg-amber-100 text-amber-700 ring-amber-300';
              BadgeIcon = Bell;
              badgeLabel = 'Hampir Tamat';
            }

            const kmProgress = km.progress;

            return (
              <div
                key={target.id}
                className={`rounded-xl border ${borderColor} ${bgColor} p-4 transition`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        {target.item_name}
                      </h4>
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badgeBg}`}
                      >
                        <BadgeIcon className="h-3 w-3" />
                        {badgeLabel}
                      </span>
                    </div>
                    {target.notes && (
                      <p className="mt-0.5 text-xs text-slate-500">{target.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditForm(target)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(target.id)}
                      disabled={deletingId === target.id}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-500 transition hover:bg-red-100 disabled:opacity-60"
                      title="Padam"
                    >
                      {deletingId === target.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Stats row */}
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {/* Target Odometer */}
                  <div>
                    <p className="text-xs font-medium text-slate-400">Sasaran Odometer</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-800 tabular-nums">
                      {target.target_odometer_km !== null
                        ? `${target.target_odometer_km.toLocaleString('ms-MY')} km`
                        : '—'}
                    </p>
                  </div>

                  {/* Baki Mileage */}
                  <div>
                    <p className="text-xs font-medium text-slate-400">Baki Mileage</p>
                    <p
                      className={`mt-0.5 text-sm font-bold tabular-nums ${
                        km.kmRemaining === null
                          ? 'text-slate-400'
                          : km.isOverdue
                            ? 'text-red-600'
                            : km.isWarning
                              ? 'text-amber-600'
                              : 'text-green-600'
                      }`}
                    >
                      {km.kmRemaining !== null
                        ? km.kmRemaining > 0
                          ? `${km.kmRemaining.toLocaleString('ms-MY')} km lagi`
                          : `${Math.abs(km.kmRemaining).toLocaleString('ms-MY')} km melebihi`
                        : '—'}
                    </p>
                  </div>

                  {/* Target Date */}
                  <div>
                    <p className="text-xs font-medium text-slate-400">Sasaran Tarikh</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-800">
                      {target.target_date ? fmtDate(target.target_date) : '—'}
                    </p>
                  </div>

                  {/* Baki Hari */}
                  <div>
                    <p className="text-xs font-medium text-slate-400">Baki Hari</p>
                    <p
                      className={`mt-0.5 text-sm font-bold tabular-nums ${
                        dt.daysRemaining === null
                          ? 'text-slate-400'
                          : dt.isOverdue
                            ? 'text-red-600'
                            : dt.isWarning
                              ? 'text-amber-600'
                              : 'text-green-600'
                      }`}
                    >
                      {dt.daysRemaining !== null
                        ? dt.daysRemaining > 0
                          ? `${dt.daysRemaining} hari lagi`
                          : `${Math.abs(dt.daysRemaining)} hari lewat`
                        : '—'}
                    </p>
                  </div>
                </div>

                {/* Progress bar (only if target odometer set) */}
                {target.target_odometer_km !== null && (
                  <div className="mt-3">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOverdue
                            ? 'bg-red-500'
                            : isWarning
                              ? 'bg-amber-500'
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, kmProgress)}%` }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Gauge className="h-3 w-3" />
                        {latestMileage.toLocaleString('ms-MY')} km
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        {target.target_odometer_km.toLocaleString('ms-MY')} km
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
