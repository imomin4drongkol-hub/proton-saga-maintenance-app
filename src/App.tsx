import { useCallback, useEffect, useMemo, useState } from 'react';
import { Wrench, Fuel as FuelIcon, LayoutDashboard } from 'lucide-react';
import { supabase, type ServiceRecord, type FuelRecord } from '@/lib/supabase';
import {
  exportServiceCSV,
  exportServicePDF,
  exportFuelCSV,
  exportFuelPDF,
} from '@/lib/export';
import { ToastProvider } from '@/components/Toast';
import { VehicleProvider, useVehicle } from '@/components/VehicleContext';
import Header from '@/components/Header';
import Stats from '@/components/Stats';
import ServiceForm from '@/components/ServiceForm';
import RecordsTable from '@/components/RecordsTable';
import FuelStats from '@/components/FuelStats';
import FuelForm from '@/components/FuelForm';
import FuelTable from '@/components/FuelTable';
import ExportButtons from '@/components/ExportButtons';
import ServiceReminder from '@/components/ServiceReminder';
import CostAnalytics from '@/components/CostAnalytics';
import CPKCard from '@/components/CPKCard';
import EfficiencyCard from '@/components/EfficiencyCard';
import EfficiencyChart from '@/components/EfficiencyChart';

type Tab = 'dashboard' | 'service' | 'fuel';

function AppContent() {
  const { activeVehicleId, activeVehicle, vehicles, loading: loadingVehicles } = useVehicle();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [loadingService, setLoadingService] = useState(true);
  const [loadingFuel, setLoadingFuel] = useState(true);

  const fetchServiceRecords = useCallback(async () => {
    if (!activeVehicleId) {
      setServiceRecords([]);
      setLoadingService(false);
      return;
    }
    setLoadingService(true);
    const { data, error } = await supabase
      .from('service_records')
      .select('*')
      .eq('vehicle_id', activeVehicleId)
      .order('service_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching service records:', error.message);
    setServiceRecords(data ?? []);
    setLoadingService(false);
  }, [activeVehicleId]);

  const fetchFuelRecords = useCallback(async () => {
    if (!activeVehicleId) {
      setFuelRecords([]);
      setLoadingFuel(false);
      return;
    }
    setLoadingFuel(true);
    const { data, error } = await supabase
      .from('fuel_records')
      .select('*')
      .eq('vehicle_id', activeVehicleId)
      .order('fill_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching fuel records:', error.message);
    setFuelRecords(data ?? []);
    setLoadingFuel(false);
  }, [activeVehicleId]);

  useEffect(() => {
    fetchServiceRecords();
    fetchFuelRecords();
  }, [fetchServiceRecords, fetchFuelRecords]);

  const latestMileage = useMemo(() => {
    return [
      ...serviceRecords.map((r) => r.mileage_km),
      ...fuelRecords.map((r) => r.mileage_km),
    ].reduce((max, km) => (km > max ? km : max), 0);
  }, [serviceRecords, fuelRecords]);

  const tabs: { id: Tab; label: string; icon: typeof Wrench }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'service', label: 'Log Servis', icon: Wrench },
    { id: 'fuel', label: 'Log Petrol', icon: FuelIcon },
  ];

  const noVehicle = vehicles.length === 0 && !loadingVehicles;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Banner Image */}
      <div className="mx-auto max-w-6xl px-6 pt-6">
        <div className="relative overflow-hidden rounded-2xl shadow-lg">
          <img
            src="/Gemini_Generated_Image_ws8bx2ws8bx2ws8b.png"
            alt={activeVehicle?.model ?? 'Kenderaan'}
            className="h-48 w-full object-cover sm:h-64 md:h-72"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-orange-400">
              Log Penyelenggaraan
            </p>
            <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
              {activeVehicle?.model ?? 'Proton Saga VVT MC2'}
            </h2>
            <p className="mt-0.5 text-sm text-slate-300">
              {activeVehicle ? activeVehicle.name : 'Sistem rekod servis & petrol'}
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        {noVehicle ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-lg font-bold text-slate-900">Belum ada kenderaan</p>
            <p className="mt-2 text-sm text-slate-500">
              Klik butang "+ Tambah Kenderaan" di bahagian atas untuk menambah kenderaan pertama anda.
            </p>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm sm:inline-flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                      active
                        ? tab.id === 'service'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : tab.id === 'fuel'
                            ? 'bg-orange-600 text-white shadow-sm'
                            : 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <ServiceReminder latestMileage={latestMileage} vehicleId={activeVehicleId} />
                <CPKCard
                  serviceRecords={serviceRecords}
                  fuelRecords={fuelRecords}
                />
                <CostAnalytics
                  serviceRecords={serviceRecords}
                  fuelRecords={fuelRecords}
                />
                <EfficiencyCard records={fuelRecords} />
                <div>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                    Ringkasan Servis
                  </h3>
                  <Stats records={serviceRecords} />
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                    Ringkasan Petrol
                  </h3>
                  <FuelStats records={fuelRecords} />
                </div>
              </div>
            )}

            {/* Service Tab */}
            {activeTab === 'service' && (
              <div className="space-y-6">
                <ServiceReminder latestMileage={latestMileage} vehicleId={activeVehicleId} />
                <div className="flex items-center justify-end">
                  <ExportButtons
                    onCSV={() => exportServiceCSV(serviceRecords)}
                    onPDF={() => exportServicePDF(serviceRecords)}
                    disabled={serviceRecords.length === 0}
                    label="Export Servis"
                  />
                </div>
                <Stats records={serviceRecords} />
                <ServiceForm onSaved={fetchServiceRecords} />
                <RecordsTable
                  records={serviceRecords}
                  loading={loadingService}
                  onChanged={fetchServiceRecords}
                />
              </div>
            )}

            {/* Fuel Tab */}
            {activeTab === 'fuel' && (
              <div className="space-y-6">
                <div className="flex items-center justify-end">
                  <ExportButtons
                    onCSV={() => exportFuelCSV(fuelRecords)}
                    onPDF={() => exportFuelPDF(fuelRecords)}
                    disabled={fuelRecords.length === 0}
                    label="Export Petrol"
                  />
                </div>
                <FuelStats records={fuelRecords} />
                <EfficiencyChart records={fuelRecords} />
                <FuelForm onSaved={fetchFuelRecords} />
                <FuelTable
                  records={fuelRecords}
                  loading={loadingFuel}
                  onChanged={fetchFuelRecords}
                />
              </div>
            )}
          </>
        )}
      </main>
      <footer className="mx-auto max-w-6xl px-6 pb-8 text-center text-xs text-slate-400">
        Log Penyelenggaraan {activeVehicle?.model ?? 'Kereta'}
      </footer>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <VehicleProvider>
        <AppContent />
      </VehicleProvider>
    </ToastProvider>
  );
}

export default App;
