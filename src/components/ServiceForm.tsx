import { useState, type FormEvent } from 'react';
import { Plus, Loader2, RotateCcw } from 'lucide-react';
import { supabase, type ServiceRecordInput } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import ReceiptUpload from '@/components/ReceiptUpload';
import { useVehicle } from '@/components/VehicleContext';

interface ServiceFormProps {
  onSaved: () => void;
}

const SERVICE_TYPES = [
  'Servis Minor',
  'Servis Major',
  'Tukar Minyak Hitam',
  'Tukar Penapis',
  'Brek',
  'Sistem Penyejuk',
  'Pala Enjin',
  'Transmisi',
  'Suspensi',
  'Pepasang',
  'Lain-lain',
];

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export default function ServiceForm({ onSaved }: ServiceFormProps) {
  const { showToast } = useToast();
  const { activeVehicleId } = useVehicle();
  const [form, setForm] = useState<ServiceRecordInput>({
    vehicle_id: activeVehicleId,
    service_date: todayStr(),
    mileage_km: 0,
    cost_rm: 0,
    service_type: 'Servis Minor',
    notes: '',
    receipt_url: null,
  });
  const [saving, setSaving] = useState(false);

  function reset() {
    setForm({
      vehicle_id: activeVehicleId,
      service_date: todayStr(),
      mileage_km: 0,
      cost_rm: 0,
      service_type: 'Servis Minor',
      notes: '',
      receipt_url: null,
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (form.mileage_km < 0) {
      showToast('Mileage tidak boleh negatif.', 'error');
      return;
    }
    if (form.cost_rm < 0) {
      showToast('Kos tidak boleh negatif.', 'error');
      return;
    }
    if (!form.service_date) {
      showToast('Sila pilih tarikh servis.', 'error');
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
      notes: form.notes?.trim() || null,
    };
    const { error: insertError } = await supabase
      .from('service_records')
      .insert(payload);

    setSaving(false);

    if (insertError) {
      showToast(`Ralat: ${insertError.message}`, 'error');
      return;
    }

    showToast('Rekod servis berjaya disimpan.', 'success');
    reset();
    onSaved();
  }

  const inputClass =
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
  const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
          <Plus className="h-4.5 w-4.5" strokeWidth={2.5} />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Tambah Rekod Servis</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="service_date" className={labelClass}>
              Tarikh Servis
            </label>
            <input
              id="service_date"
              type="date"
              required
              value={form.service_date}
              onChange={(e) =>
                setForm({ ...form, service_date: e.target.value })
              }
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="service_type" className={labelClass}>
              Jenis Servis
            </label>
            <select
              id="service_type"
              required
              value={form.service_type}
              onChange={(e) =>
                setForm({ ...form, service_type: e.target.value })
              }
              className={inputClass}
            >
              {SERVICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="mileage_km" className={labelClass}>
              Mileage (km)
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
                setForm({ ...form, mileage_km: parseInt(e.target.value, 10) || 0 })
              }
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="cost_rm" className={labelClass}>
              Kos (RM)
            </label>
            <input
              id="cost_rm"
              type="number"
              required
              min={0}
              step="0.01"
              placeholder="cth. 120.50"
              value={form.cost_rm || ''}
              onChange={(e) =>
                setForm({ ...form, cost_rm: parseFloat(e.target.value) || 0 })
              }
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className={labelClass}>
            Catatan Tambahan
          </label>
          <textarea
            id="notes"
            rows={2}
            placeholder="cth. Tukar minyak enjin Petronas Syntium 5W-30 + penapis udara"
            value={form.notes ?? ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className={inputClass}
          />
        </div>

        <ReceiptUpload
          value={form.receipt_url}
          onChange={(url) => setForm({ ...form, receipt_url: url })}
          label="Resit / Invois Servis"
        />

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
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
