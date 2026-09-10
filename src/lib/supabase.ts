import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Vehicle {
  id: string;
  name: string;
  model: string;
  initial_odometer_km: number;
  created_at: string;
}

export type VehicleInput = Omit<Vehicle, 'id' | 'created_at'>;

export interface ServiceRecord {
  id: string;
  vehicle_id: string | null;
  service_date: string;
  mileage_km: number;
  cost_rm: number;
  service_type: string;
  notes: string | null;
  receipt_url: string | null;
  created_at: string;
}

export type ServiceRecordInput = Omit<ServiceRecord, 'id' | 'created_at'>;

export interface FuelRecord {
  id: string;
  vehicle_id: string | null;
  fill_date: string;
  mileage_km: number;
  liters: number;
  price_per_liter_rm: number;
  total_cost_rm: number;
  fuel_type: string;
  station: string | null;
  full_tank: boolean;
  notes: string | null;
  receipt_url: string | null;
  created_at: string;
}

export type FuelRecordInput = Omit<FuelRecord, 'id' | 'created_at'>;

export interface ServiceTarget {
  id: string;
  vehicle_id: string | null;
  item_name: string;
  target_odometer_km: number | null;
  target_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ServiceTargetInput = Omit<
  ServiceTarget,
  'id' | 'created_at' | 'updated_at'
>;
