
-- Add laudo_data jsonb column to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS laudo_data jsonb;

-- Create sequence for proposal numbers starting at 18392
CREATE SEQUENCE IF NOT EXISTS public.laudo_proposal_seq START WITH 18392 INCREMENT BY 1;
