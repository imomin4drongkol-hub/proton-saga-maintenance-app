/*
# Create service_targets table for sticker-based service reminders

1. New Tables
- `service_targets`
  - `id` (uuid, primary key)
  - `item_name` (text, not null) — jenis item servis dari sticker (cth. "Minyak Enjin", "Minyak Gearbox ATF")
  - `target_odometer_km` (integer, nullable) — sasaran odometer dari sticker (km)
  - `target_date` (date, nullable) — sasaran tarikh servis berikutnya dari sticker
  - `notes` (text, nullable) — catatan tambahan
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now()) — masa kemas kini terakhir

2. Security
- Enable RLS on `service_targets`.
- Allow anon + authenticated CRUD — single-tenant app with no sign-in screen.
- `USING (true)` is acceptable because the data is intentionally shared/public.
*/

CREATE TABLE IF NOT EXISTS service_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  target_odometer_km integer CHECK (target_odometer_km IS NULL OR target_odometer_km >= 0),
  target_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_targets_item ON service_targets(item_name);

ALTER TABLE service_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_service_targets" ON service_targets;
CREATE POLICY "anon_select_service_targets" ON service_targets FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_service_targets" ON service_targets;
CREATE POLICY "anon_insert_service_targets" ON service_targets FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_service_targets" ON service_targets;
CREATE POLICY "anon_update_service_targets" ON service_targets FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_service_targets" ON service_targets;
CREATE POLICY "anon_delete_service_targets" ON service_targets FOR DELETE
  TO anon, authenticated USING (true);
