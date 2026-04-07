
-- Add contract_start_date to profiles for retroactive date tracking
ALTER TABLE public.profiles ADD COLUMN contract_start_date date;

-- Add due_day to financial_records for MRR due day tracking
ALTER TABLE public.financial_records ADD COLUMN due_day integer;

-- Add mrr_start_date to financial_records
ALTER TABLE public.financial_records ADD COLUMN mrr_start_date date;
