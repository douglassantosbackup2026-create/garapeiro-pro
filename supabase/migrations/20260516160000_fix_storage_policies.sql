-- Remove permissive storage policies left from initial migration
-- These were never dropped when scoped policies were added in 20260516151010
DROP POLICY IF EXISTS "Logos publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete logos" ON storage.objects;
