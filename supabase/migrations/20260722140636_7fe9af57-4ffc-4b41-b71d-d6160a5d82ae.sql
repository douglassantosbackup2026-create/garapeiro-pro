
-- Substitui a policy de INSERT em workshop-logos para incluir whitelist MIME e limite de tamanho
DROP POLICY IF EXISTS "Members upload workshop logos" ON storage.objects;
CREATE POLICY "Members upload workshop logos" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'workshop-logos'
    AND (storage.foldername(name))[1] = (current_workshop_id())::text
    AND coalesce(lower(metadata->>'mimetype'), '') IN ('image/png','image/jpeg','image/webp')
    AND coalesce((metadata->>'size')::bigint, 0) <= 2097152
  );

-- Também aplica no UPDATE (troca de logo)
DROP POLICY IF EXISTS "Members update workshop logos" ON storage.objects;
CREATE POLICY "Members update workshop logos" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'workshop-logos'
    AND (storage.foldername(name))[1] = (current_workshop_id())::text
  )
  WITH CHECK (
    bucket_id = 'workshop-logos'
    AND (storage.foldername(name))[1] = (current_workshop_id())::text
    AND coalesce(lower(metadata->>'mimetype'), '') IN ('image/png','image/jpeg','image/webp')
    AND coalesce((metadata->>'size')::bigint, 0) <= 2097152
  );
