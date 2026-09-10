import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { supabase, type Vehicle, type VehicleInput } from '@/lib/supabase';

interface VehicleContextValue {
  vehicles: Vehicle[];
  activeVehicle: Vehicle | null;
  activeVehicleId: string | null;
  loading: boolean;
  setActiveVehicleId: (id: string | null) => void;
  addVehicle: (input: VehicleInput) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  refreshVehicles: () => Promise<void>;
}

const VehicleContext = createContext<VehicleContextValue | null>(null);

const STORAGE_KEY = 'active-vehicle-id';

export function VehicleProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeVehicleId, setActiveVehicleIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching vehicles:', error.message);
    }
    setVehicles(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    if (vehicles.length === 0) return;
    const stored = localStorage.getItem(STORAGE_KEY);
    const exists = stored && vehicles.some((v) => v.id === stored);
    if (exists) {
      setActiveVehicleIdState(stored);
    } else if (vehicles.length > 0) {
      setActiveVehicleIdState(vehicles[0].id);
    }
  }, [vehicles]);

  const setActiveVehicleId = useCallback((id: string | null) => {
    setActiveVehicleIdState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const addVehicle = useCallback(
    async (input: VehicleInput) => {
      const { data, error } = await supabase
        .from('vehicles')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      await fetchVehicles();
      if (data) setActiveVehicleId(data.id);
    },
    [fetchVehicles, setActiveVehicleId],
  );

  const deleteVehicle = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) throw error;
      await fetchVehicles();
    },
    [fetchVehicles],
  );

  const activeVehicle =
    vehicles.find((v) => v.id === activeVehicleId) ?? null;

  return (
    <VehicleContext.Provider
      value={{
        vehicles,
        activeVehicle,
        activeVehicleId,
        loading,
        setActiveVehicleId,
        addVehicle,
        deleteVehicle,
        refreshVehicles: fetchVehicles,
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicle() {
  const ctx = useContext(VehicleContext);
  if (!ctx) throw new Error('useVehicle must be used within VehicleProvider');
  return ctx;
}
