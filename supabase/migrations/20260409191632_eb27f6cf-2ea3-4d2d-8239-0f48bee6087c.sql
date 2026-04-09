
CREATE TABLE public.client_visibility_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
  hidden_views text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_visibility_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to client_visibility_config"
ON public.client_visibility_config FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can view own visibility config"
ON public.client_visibility_config FOR SELECT
USING (client_id = public.get_user_client_id(auth.uid()));

CREATE TRIGGER update_client_visibility_config_updated_at
BEFORE UPDATE ON public.client_visibility_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
