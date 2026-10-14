/*
# Add fuel remaining-before-fill fields and fuel settings

1. New Columns on `fuel_records`
- `fuel_bar_before` (smallint, nullable) — number of fuel gauge bars remaining before fill (0–7)
- `dashboard_range_km` (integer, nullable) — actual range reading from car dashboard in km
- `est_remaining_liters` (numeric(8,3), nullable) — estimated liters remaining before fill
- `est_remaining_range_km` (integer, nullable) — estimated remaining range in km

2. New Columns on `vehicles`
- `tank_capacity_l` (numeric(6,2), default 40) — fuel tank capacity in liters
- `low_fuel_warning_km` (integer, default 80) — low fuel warning threshold in km

3. Security
- No new tables; existing RLS policies on fuel_records and vehicles cover the new columns.

4. Notes
- All new columns are nullable so existing records continue to work.
- Defaults on vehicles ensure new vehicles get sensible values without app changes.
*/

ALTER TABLE fuel_records
  ADD COLUMN IF NOT EXISTS fuel_bar_before smallint CHECK (fuel_bar_before >= 0 AND fuel_bar_before <= 7);

ALTER TABLE fuel_records
  ADD COLUMN IF NOT EXISTS dashboard_range_km integer CHECK (dashboard_range_km >= 0);

ALTER TABLE fuel_records
  ADD COLUMN IF NOT EXISTS est_remaining_liters numeric(8,3) CHECK (est_remaining_liters >= 0);

ALTER TABLE fuel_records
  ADD COLUMN IF NOT EXISTS est_remaining_range_km integer CHECK (est_remaining_range_km >= 0);

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS tank_capacity_l numeric(6,2) NOT NULL DEFAULT 40.00 CHECK (tank_capacity_l > 0);

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS low_fuel_warning_km integer NOT NULL DEFAULT 80 CHECK (low_fuel_warning_km >= 0);
