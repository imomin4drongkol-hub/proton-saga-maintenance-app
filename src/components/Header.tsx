import { useState, type FormEvent } from 'react';
import { Car, ChevronDown, Plus, X, Loader2, Check } from 'lucide-react';
import { useVehicle } from '@/components/VehicleContext';
import { useToast } from '@/components/Toast';

export default function Header() {
  const {
    vehicles,
    activeVehicle,
    activeVehicleId,
    setActiveVehicleId,
    addVehicle,
    loading,
  } = useVehicle();
  const { showToast } = useToast();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    model: '',
    initial_odometer_km: 0,
  });

  async function handleAddVehicle(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.model.trim()) {
      showToast('Sila isi nama dan model kenderaan.', 'error');
      return;
    }
    setSaving(true);
    try {
      await addVehicle({
        name: form.name.trim(),
        model: form.model.trim(),
        initial_odometer_km: form.initial_odometer_km,
      });
      showToast('Kenderaan berjaya ditambah.', 'success');
      setForm({ name: '', model: '', initial_odometer_km: 0 });
      setShowAddForm(false);
    } catch (err) {
      showToast(`Ralat: ${(err as Error).message}`, 'error');
    }
    setSaving(false);
  }

  return (
    <header className="relative overflow-hidden bg-slate-900 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-6 py-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20">
              <Car className="h-7 w-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Log Penyelenggaraan Kereta
              </h1>
              <p className="mt-0.5 text-sm text-slate-400">
                Sistem Rekod Servis & Petrol
              </p>
            </div>
          </div>

          {/* Vehicle selector */}
          <div className="relative flex-shrink-0">
            {loading ? (
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                <span className="text-sm text-slate-400">Memuatkan...</span>
              </div>
            ) : vehicles.length === 0 ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
              >
                <Plus className="h-4 w-4" />
                Tambah Kenderaan
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex w-full items-center gap-2.5 rounded-xl bg-white/10 px-4 py-2.5 text-left backdrop-blur-sm transition hover:bg-white/20 sm:w-auto"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <Car className="h-4 w-4 text-orange-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {activeVehicle?.name ?? 'Pilih Kenderaan'}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {activeVehicle?.model ?? '—'}
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${
                      showDropdown ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {showDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 z-20 mt-2 w-72 overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-xl">
                      <div className="max-h-64 overflow-y-auto">
                        {vehicles.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => {
                              setActiveVehicleId(v.id);
                              setShowDropdown(false);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-700"
                          >
                            <Car className="h-4 w-4 flex-shrink-0 text-slate-400" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-white">
                                {v.name}
                              </p>
                              <p className="truncate text-xs text-slate-400">
                                {v.model}
                              </p>
                            </div>
                            {v.id === activeVehicleId && (
                              <Check className="h-4 w-4 flex-shrink-0 text-orange-400" />
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-slate-700">
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            setShowAddForm(true);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-orange-400 transition hover:bg-slate-700"
                        >
                          <Plus className="h-4 w-4" />
                          Tambah Kenderaan
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Add Vehicle Form Modal */}
        {showAddForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowAddForm(false)}
          >
            <form
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleAddVehicle}
              className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  Tambah Kenderaan Baru
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Nama Kenderaan
                </label>
                <input
                  type="text"
                  required
                  placeholder="cth. Kereta Saga"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Model
                </label>
                <input
                  type="text"
                  required
                  placeholder="cth. Proton Saga VVT MC2"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Odometer Awal (km)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  placeholder="cth. 0"
                  value={form.initial_odometer_km || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      initial_odometer_km: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {saving ? 'Menyimpan...' : 'Tambah Kenderaan'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
