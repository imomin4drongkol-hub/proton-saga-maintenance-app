import { useState, useMemo, type FormEvent } from 'react';
import { Plus, Loader2, RotateCcw, Fuel, Calculator, Settings2, Gauge } from 'lucide-react';
import { supabase, type FuelRecordInput } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import ReceiptUpload from '@/components/ReceiptUpload';
import { useVehicle } from '@/components/VehicleContext';
import FuelGauge from '@/components/FuelGauge';
import {
  estimateLitersBeforeFill,
  estimateRangeKm,
  getAvgFuelEfficiency,
  estimateLitersAfterFill,
  getDefaultTankCapacity,
  getDefaultLowFuelWarning,
} from '@/lib/fuel-calc';

interface FuelFormProps {
  onSaved: () => void;
  fuelRecords: import('@/lib/supabase').FuelRecord[];
}

const FUEL_TYPES = ['RON95', 'RON97', 'Diesel'];

const STATIONS = [
  'Petron',
  'Petronas',
  'Shell',
  'BHPetrol',
  'Caltex',
  'Esso',
  'Mobil',
  'Lain-lain',
];

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export default function FuelForm({ onSaved, fuelRecords }: FuelFormProps) {
  const { showToast } = useToast();
  const { activeVehicle, activeVehicleId } = useVehicle();
  const [form, setForm] = useState<FuelRecordInput>({
    vehicle_id: activeVehicleId,
    fill_date: todayStr(),
    mileage_km: 0,
    liters: 0,
    price_per_liter_rm: 0,
    total_cost_rm: 0,
    fuel_type: 'RON95',
    station: '',
    full_tank: true,
    notes: '',
    receipt_url: null,
    fuel_bar_before: null,
    dashboard_range_km: null,
    est_remaining_liters: null,
    est_remaining_range_km: null,
  });
  const [autoCalc, setAutoCalc] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tankCapacity, setTankCapacity] = useState(getDefaultTankCapacity(activeVehicle));
  const [lowFuelWarning, setLowFuelWarning] = useState(getDefaultLowFuelWarning(activeVehicle));

  const avgEfficiency = useMemo(
    () => getAvgFuelEfficiency(fuelRecords),
    [fuelRecords],
  );

  const estLitersBefore = useMemo(() => {
    if (form.fuel_bar_before === null) return null;
    return estimateLitersBeforeFill(form.fuel_bar_before, tankCapacity);
  }, [form.fuel_bar_before, tankCapacity]);

  const estRangeBefore = useMemo(() => {
    if (form.dashboard_range_km !== null) return { value: form.dashboard_range_km, isEst: false };
    if (form.fuel_bar_before !== null && avgEfficiency !== null) {
      const r = estimateRangeKm(form.fuel_bar_before, tankCapacity, avgEfficiency);
      return r !== null ? { value: r, isEst: true } : null;
    }
    return null;
  }, [form.fuel_bar_before, form.dashboard_range_km, tankCapacity, avgEfficiency]);

  const estLitersAfter = useMemo(() => {
    if (estLitersBefore === null) return null;
    return estimateLitersAfterFill(estLitersBefore, Number(form.liters) || 0, tankCapacity);
  }, [estLitersBefore, form.liters, tankCapacity]);

  function reset() {
    setForm({
      vehicle_id: activeVehicleId,
      fill_date: todayStr(),
      mileage_km: 0,
      liters: 0,
      price_per_liter_rm: 0,
      total_cost_rm: 0,
      fuel_type: 'RON95',
      station: '',
      full_tank: true,
      notes: '',
      receipt_url: null,
      fuel_bar_before: null,
      dashboard_range_km: null,
      est_remaining_liters: null,
      est_remaining_range_km: null,
    });
  }

  function updateField(field: keyof FuelRecordInput, value: string | number | boolean | null) {
    const next = { ...form, [field]: value };
    if (autoCalc && (field === 'liters' || field === 'price_per_liter_rm')) {
      const liters = Number(next.liters) || 0;
      const price = Number(next.price_per_liter_rm) || 0;
      next.total_cost_rm = Math.round(liters * price * 100) / 100;
    }
    setForm(next);
  }

  function updateFuelBar(bar: number) {
    const next = { ...form, fuel_bar_before: bar };
    if (bar !== null && bar >= 0) {
      const liters = estimateLitersBeforeFill(bar, tankCapacity);
      next.est_remaining_liters = liters;
      if (form.dashboard_range_km === null && avgEfficiency !== null) {
        const range = estimateRangeKm(bar, tankCapacity, avgEfficiency);
        next.est_remaining_range_km = range;
      } else if (form.dashboard_range_km !== null) {
        next.est_remaining_range_km = null;
      }
    } else {
      next.est_remaining_liters = null;
      next.est_remaining_range_km = null;
    }
    setForm(next);
  }

  function updateDashboardRange(val: string) {
    const num = val === '' ? null : parseInt(val, 10) || null;
    const next = { ...form, dashboard_range_km: num };
    if (num !== null) {
      next.est_remaining_range_km = null;
    } else if (form.fuel_bar_before !== null && avgEfficiency !== null) {
      next.est_remaining_range_km = estimateRangeKm(form.fuel_bar_before, tankCapacity, avgEfficiency);
    }
    setForm(next);
  }

  async function saveSettings() {
    if (!activeVehicleId) return;
    const { error } = await supabase
      .from('vehicles')
      .update({
        tank_capacity_l: tankCapacity,
        low_fuel_warning_km: lowFuelWarning,
      })
      .eq('id', activeVehicleId);
    if (error) {
      showToast(`Ralat: ${error.message}`, 'error');
      return;
    }
    showToast('Tetapan tangki disimpan.', 'success');
    setShowSettings(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (form.mileage_km < 0) {
      showToast('Mileage tidak boleh negatif.', 'error');
      return;
    }
    if (form.liters <= 0) {
      showToast('Jumlah liter mesti lebih daripada 0.', 'error');
      return;
    }
    if (form.total_cost_rm <= 0) {
      showToast('Jumlah kos mesti lebih daripada 0.', 'error');
      return;
    }
    if (!form.fill_date) {
      showToast('Sila pilih tarikh isi petrol.', 'error');
      return;
    }
    if (form.fuel_bar_before === null) {
      showToast('Sila pilih baki petrol sebelum isi.', 'error');
      return;
    }
    if (!activeVehicleId) {
      showToast('Sila pilih kenderaan dahulu.', 'error');
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      vehicle_id: activeVehicleId,
      station: form.station?.trim() || null,
      notes: form.notes?.trim() || null,
    };
    const { error: insertError } = await supabase
      .from('fuel_records')
      .insert(payload);

    setSaving(false);

    if (insertError) {
      showToast(`Ralat: ${insertError.message}`, 'error');
      return;
    }

    showToast('Rekod petrol berjaya disimpan.', 'success');
    reset();
    onSaved();
  }

  const inputClass =
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
  const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

  const isLowFuel = estRangeBefore !== null && estRangeBefore.value <= lowFuelWarning;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
            <Fuel className="h-4.5 w-4.5" strokeWidth={2.5} />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Tambah Rekod Isi Petrol</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Tetapan
        </button>
      </div>

      {showSettings && (
        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Kapasiti Tangki (liter)</label>
              <input
                type="number"
                min={1}
                step={1}
                value={tankCapacity}
                onChange={(e) => setTankCapacity(parseFloat(e.target.value) || 40)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Had Amaran Petrol Rendah (km)</label>
              <input
                type="number"
                min={0}
                step={10}
                value={lowFuelWarning}
                onChange={(e) => setLowFuelWarning(parseInt(e.target.value, 10) || 80)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={saveSettings}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Simpan Tetapan
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Fuel gauge selector */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-orange-500" />
            <label className="text-sm font-semibold text-slate-700">
              Baki Petrol Sebelum Isi <span className="text-red-500">*</span>
            </label>
          </div>
          <FuelGauge
            value={form.fuel_bar_before ?? 0}
            onChange={updateFuelBar}
            size="lg"
          />
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="dashboard_range" className="mb-1 block text-xs font-medium text-slate-600">
                Range Dashboard (km) — opsyenal
              </label>
              <input
                id="dashboard_range"
                type="number"
                min={0}
                step={1}
                placeholder="cth. 45"
                value={form.dashboard_range_km ?? ''}
                onChange={(e) => updateDashboardRange(e.target.value)}
                className={`${inputClass} py-2`}
              />
            </div>
            <div className="flex flex-col justify-end">
              {estRangeBefore !== null && (
                <div className={`rounded-lg px-3 py-2 text-xs ${
                  isLowFuel
                    ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                    : 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                }`}>
                  {estRangeBefore.isEst ? 'Anggaran ' : ''}Baki Jarak: <strong>{estRangeBefore.value} km</strong>
                  {isLowFuel && ' — Petrol Rendah!'}
                </div>
              )}
              {estLitersBefore !== null && (
                <div className="mt-1 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
                  Anggaran liter sebelum isi: <strong>{estLitersBefore.toFixed(2)} L</strong>
                  {estLitersAfter !== null && (
                    <span className="ml-2">→ Selepas isi: <strong>{estLitersAfter.toFixed(2)} L</strong></span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="fill_date" className={labelClass}>
              Tarikh Isi
            </label>
            <input
              id="fill_date"
              type="date"
              required
              value={form.fill_date}
              onChange={(e) => updateField('fill_date', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="fuel_type" className={labelClass}>
              Jenis Petrol
            </label>
            <select
              id="fuel_type"
              required
              value={form.fuel_type}
              onChange={(e) => updateField('fuel_type', e.target.value)}
              className={inputClass}
            >
              {FUEL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="station" className={labelClass}>
              Stesen Minyak
            </label>
            <select
              id="station"
              value={form.station ?? ''}
              onChange={(e) => updateField('station', e.target.value)}
              className={inputClass}
            >
              <option value="">— Tidak ditentukan —</option>
              {STATIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="mileage_km" className={labelClass}>
              Mileage Semasa (km)
            </label>
            <input
              id="mileage_km"
              type="number"
              required
              min={0}
              step={1}
              placeholder="cth. 45000"
              value={form.mileage_km || ''}
              onChange={(e) =>
                updateField('mileage_km', parseInt(e.target.value, 10) || 0)
              }
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="liters" className={labelClass}>
              Jumlah Liter
            </label>
            <input
              id="liters"
              type="number"
              required
              min={0}
              step="0.001"
              placeholder="cth. 35.500"
              value={form.liters || ''}
              onChange={(e) =>
                updateField('liters', parseFloat(e.target.value) || 0)
              }
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="price_per_liter_rm" className={labelClass}>
              Harga per Liter (RM)
            </label>
            <input
              id="price_per_liter_rm"
              type="number"
              required
              min={0}
              step="0.01"
              placeholder="cth. 2.05"
              value={form.price_per_liter_rm || ''}
              onChange={(e) =>
                updateField('price_per_liter_rm', parseFloat(e.target.value) || 0)
              }
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="total_cost_rm" className={labelClass}>
              Jumlah Kos (RM)
            </label>
            <div className="relative">
              <input
                id="total_cost_rm"
                type="number"
                required
                min={0}
                step="0.01"
                placeholder="cth. 72.78"
                value={form.total_cost_rm || ''}
                onChange={(e) =>
                  updateField('total_cost_rm', parseFloat(e.target.value) || 0)
                }
                className={`${inputClass} ${autoCalc ? 'bg-slate-50' : ''}`}
                readOnly={autoCalc}
              />
              <button
                type="button"
                onClick={() => setAutoCalc(!autoCalc)}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                title={autoCalc ? 'Auto-kira dari liter × harga' : 'Kunci untuk input manual'}
              >
                <Calculator className="h-3 w-3" />
                {autoCalc ? 'Auto' : 'Manual'}
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Full Tank?</label>
            <div className="flex gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 has-[:checked]:text-blue-700">
                <input
                  type="radio"
                  name="full_tank"
                  checked={form.full_tank}
                  onChange={() => updateField('full_tank', true)}
                  className="h-4 w-4 accent-blue-600"
                />
                Full Tank
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 has-[:checked]:text-blue-700">
                <input
                  type="radio"
                  name="full_tank"
                  checked={!form.full_tank}
                  onChange={() => updateField('full_tank', false)}
                  className="h-4 w-4 accent-blue-600"
                />
                Separa
              </label>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="fuel_notes" className={labelClass}>
            Catatan Tambahan
          </label>
          <textarea
            id="fuel_notes"
            rows={2}
            placeholder="cth. Isi penuh di Petronas KL — jalan lancar"
            value={form.notes ?? ''}
            onChange={(e) => updateField('notes', e.target.value)}
            className={inputClass}
          />
        </div>

        <ReceiptUpload
          value={form.receipt_url}
          onChange={(url) => setForm({ ...form, receipt_url: url })}
          label="Resit Petrol"
        />

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {saving ? 'Menyimpan...' : 'Simpan Rekod'}
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
