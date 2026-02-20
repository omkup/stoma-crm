
-- Add storage_path column to photo_protocols
ALTER TABLE public.photo_protocols ADD COLUMN storage_path text;

-- Backfill storage_path from file_url for existing rows (extract path after /object/public/photo-protocols/)
UPDATE public.photo_protocols
SET storage_path = regexp_replace(file_url, '^.*/object/public/photo-protocols/', '')
WHERE storage_path IS NULL AND file_url IS NOT NULL;

-- Storage RLS policies for photo-protocols bucket
-- Doctors can upload to their visit order folders
CREATE POLICY "Doctor upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'photo-protocols'
  AND has_role(auth.uid(), 'doctor'::app_role)
);

-- Doctors can read their own uploaded photos
CREATE POLICY "Doctor read own photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'photo-protocols'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'doctor'::app_role)
  )
);

-- Admin can delete photos
CREATE POLICY "Admin delete photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'photo-protocols'
  AND has_role(auth.uid(), 'admin'::app_role)
);
