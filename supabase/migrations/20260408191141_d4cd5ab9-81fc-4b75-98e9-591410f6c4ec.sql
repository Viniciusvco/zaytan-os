
-- Fix admin policy to include WITH CHECK for inserts
DROP POLICY IF EXISTS "Admins full access to leads" ON public.leads;
CREATE POLICY "Admins full access to leads" ON public.leads
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow clients to insert leads for themselves
CREATE POLICY "Clients can insert own leads" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (client_id = public.get_user_client_id(auth.uid()));
