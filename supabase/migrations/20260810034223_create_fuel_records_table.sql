/*
# Create fuel_records table for Proton Saga VVT MC2 fuel log

1. New Tables
- `fuel_records`
  - `id` (uuid, primary key)
  - `fill_date` (date, not null) — tarikh isi petrol
  - `mileage_km` (integer, not null) — bacaan odometer semasa isi
  - `liters` (numeric(8,3), not null) — jumlah liter petrol
  - `price_per_liter_rm` (numeric(6,2), not null) — harga per liter RM
  - `total_cost_rm` (numeric(10,2), not null) — jumlah kos RM
  - `fuel_type` (text, not null) — jenis petrol (e.g. RON95, RON97)
  - `station` (text, nullable) — nama stesen minyak
  - `full_tank` (boolean, default true) — samada full tank atau tidak
  - `notes` (text, nullable) — catatan tambahan
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `fuel_records`.
- Allow anon + authenticated CRUD — single-tenant app with no sign-in screen.
- `USING (true)` is acceptable because the data is intentionally shared/public.
*/

CREATE TABLE IF NOT EXISTS fuel_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fill_date date NOT NULL,
  mileage_km integer NOT NULL CHECK (mileage_km >= 0),
  liters numeric(8,3) NOT NULL CHECK (liters > 0),
  price_per_liter_rm numeric(6,2) NOT NULL CHECK (price_per_liter_rm >= 0),
  total_cost_rm numeric(10,2) NOT NULL CHECK (total_cost_rm >= 0),
  fuel_type text NOT NULL DEFAULT 'RON95',
  station text,
  full_tank boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fuel_records_date ON fuel_records(fill_date DESC);

ALTER TABLE fuel_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_fuel_records" ON fuel_records;
CREATE POLICY "anon_select_fuel_records" ON fuel_records FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_fuel_records" ON fuel_records;
CREATE POLICY "anon_insert_fuel_records" ON fuel_records FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_fuel_records" ON fuel_records;
CREATE POLICY "anon_update_fuel_records" ON fuel_records FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_fuel_records" ON fuel_records;
CREATE POLICY "anon_delete_fuel_records" ON fuel_records FOR DELETE
  TO anon, authenticated USING (true);
