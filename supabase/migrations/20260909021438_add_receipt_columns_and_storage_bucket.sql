-- Add receipt_url column to service_records and fuel_records
-- for storing Supabase Storage path to uploaded receipt images

ALTER TABLE service_records
  ADD COLUMN IF NOT EXISTS receipt_url text;

ALTER TABLE fuel_records
  ADD COLUMN IF NOT EXISTS receipt_url text;

-- Create storage bucket 'receipts' if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: allow public read + anon/auth insert/update/delete
DROP POLICY IF EXISTS "receipts_public_read" ON storage.objects;
CREATE POLICY "receipts_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'receipts');

DROP POLICY IF EXISTS "receipts_anon_insert" ON storage.objects;
CREATE POLICY "receipts_anon_insert" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'receipts');

DROP POLICY IF EXISTS "receipts_anon_update" ON storage.objects;
CREATE POLICY "receipts_anon_update" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'receipts') WITH CHECK (bucket_id = 'receipts');

DROP POLICY IF EXISTS "receipts_anon_delete" ON storage.objects;
CREATE POLICY "receipts_anon_delete" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'receipts');
