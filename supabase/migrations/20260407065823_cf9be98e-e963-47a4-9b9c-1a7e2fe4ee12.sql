ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS seller_tag text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS financing_type text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS installment_value text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_entry_date timestamptz;