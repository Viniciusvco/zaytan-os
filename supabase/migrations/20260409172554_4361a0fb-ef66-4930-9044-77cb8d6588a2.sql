
-- Allow clients to insert their own juridico cards (via CRM automation)
CREATE POLICY "Clients can insert own juridico cards"
  ON public.juridico_cards FOR INSERT
  TO authenticated
  WITH CHECK (client_id = get_user_client_id(auth.uid()));

-- Allow clients to insert own payment tracking
CREATE POLICY "Clients can insert own payments"
  ON public.payment_tracking FOR INSERT
  TO authenticated
  WITH CHECK (client_id = get_user_client_id(auth.uid()));
