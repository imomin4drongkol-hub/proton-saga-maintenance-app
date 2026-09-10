/*
# Create service_records table for Proton Saga VVT MC2 maintenance log

1. New Tables
- `service_records`
  - `id` (uuid, primary key)
  - `service_date` (date, not null) — tarikh servis
  - `mileage_km` (integer, not null) — bacaan odometer dalam km
  - `cost_rm` (numeric(10,2), not null) — kos servis dalam Ringgit Malaysia
  - `service_type` (text, not null) — jenis servis (e.g. Minor, Major, Brake, etc.)
  - `notes` (text, nullable) — catatan tambahan
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `service_records`.
- Allow anon + authenticated CRUD — single-tenant app with no sign-in screen.
- `USING (true)` is acceptable because the data is intentionally shared/public.
*/

CREATE TABLE IF NOT EXISTS service_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_date date NOT NULL,
  mileage_km integer NOT NULL CHECK (mileage_km >= 0),
  cost_rm numeric(10,2) NOT NULL CHECK (cost_rm >= 0),
  service_type text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_records_date ON service_records(service_date DESC);

ALTER TABLE service_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_service_records" ON service_records;
CREATE POLICY "anon_select_service_records" ON service_records FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_service_records" ON service_records;
CREATE POLICY "anon_insert_service_records" ON service_records FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_service_records" ON service_records;
CREATE POLICY "anon_update_service_records" ON service_records FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_service_records" ON service_records;
CREATE POLICY "anon_delete_service_records" ON service_records FOR DELETE
  TO anon, authenticated USING (true);
