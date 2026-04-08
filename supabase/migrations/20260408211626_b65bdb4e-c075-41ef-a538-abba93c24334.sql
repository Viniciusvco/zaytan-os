
-- Add laudo_pdf_url to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS laudo_pdf_url text;

-- Create storage bucket for laudos
INSERT INTO storage.buckets (id, name, public) VALUES ('laudos', 'laudos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload laudos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'laudos');

CREATE POLICY "Anyone can view laudos"
ON storage.objects FOR SELECT
USING (bucket_id = 'laudos');

CREATE POLICY "Authenticated users can update laudos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'laudos');

CREATE POLICY "Authenticated users can delete laudos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'laudos');
