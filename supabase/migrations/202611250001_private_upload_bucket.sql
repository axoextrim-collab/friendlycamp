-- Supabase is used for Storage only in this deployment architecture.
-- User accounts and all application records remain on Render's persistent disk.
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('friendlycamp-uploads','friendlycamp-uploads',false,12582912,
 ARRAY['image/jpeg','image/png','image/webp','image/gif','audio/mpeg','audio/mp4','audio/ogg','audio/wav'])
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
 IF EXISTS(SELECT 1 FROM storage.buckets WHERE id='friendlycamp-uploads' AND public=true) THEN
  RAISE EXCEPTION 'friendlycamp-uploads already exists as public; select a dedicated private bucket';
 END IF;
END $$;
-- No anonymous read/write policy is created. Only the trusted server key accesses
-- this bucket. /uploads/<random-name> preserves the existing shared-link behavior.
