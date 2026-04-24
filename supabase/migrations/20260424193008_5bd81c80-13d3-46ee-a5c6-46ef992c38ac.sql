-- 1. Toggle para ocultar CRM por cliente
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS crm_hidden boolean NOT NULL DEFAULT false;

-- 2. Tabela de laudos avulsos
CREATE TABLE IF NOT EXISTS public.laudos_avulsos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  cpf text,
  consultor_name text,
  assessoria_name text,
  numero_proposta integer,
  laudo_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_laudos_avulsos_client ON public.laudos_avulsos(client_id);
CREATE INDEX IF NOT EXISTS idx_laudos_avulsos_created_by ON public.laudos_avulsos(created_by);
CREATE INDEX IF NOT EXISTS idx_laudos_avulsos_created_at ON public.laudos_avulsos(created_at DESC);

ALTER TABLE public.laudos_avulsos ENABLE ROW LEVEL SECURITY;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_laudos_avulsos_updated ON public.laudos_avulsos;
CREATE TRIGGER trg_laudos_avulsos_updated
  BEFORE UPDATE ON public.laudos_avulsos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
CREATE POLICY "Admins full access to laudos_avulsos"
  ON public.laudos_avulsos FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients can view own laudos_avulsos"
  ON public.laudos_avulsos FOR SELECT
  TO authenticated
  USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Clients can insert own laudos_avulsos"
  ON public.laudos_avulsos FOR INSERT
  TO authenticated
  WITH CHECK (client_id = get_user_client_id(auth.uid()));

-- 3. Bucket laudos (idempotente) + políticas de storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('laudos', 'laudos', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Public read laudos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'laudos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated upload laudos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'laudos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;