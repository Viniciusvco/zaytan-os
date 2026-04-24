-- Drop tabelas não usadas após simplificação para CRM-only
DROP TABLE IF EXISTS public.distribution_logs CASCADE;
DROP TABLE IF EXISTS public.lead_queue CASCADE;
DROP TABLE IF EXISTS public.campaign_clients CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.lead_distribution_config CASCADE;
DROP TABLE IF EXISTS public.juridico_cards CASCADE;
DROP TABLE IF EXISTS public.demands CASCADE;
DROP TABLE IF EXISTS public.financial_records CASCADE;
DROP TABLE IF EXISTS public.contracts CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.vendor_goals CASCADE;
DROP TABLE IF EXISTS public.client_visibility_config CASCADE;

-- Drop enums órfãos
DROP TYPE IF EXISTS public.distribution_rule CASCADE;
DROP TYPE IF EXISTS public.lead_queue_status CASCADE;
DROP TYPE IF EXISTS public.juridico_status CASCADE;
DROP TYPE IF EXISTS public.demand_priority CASCADE;
DROP TYPE IF EXISTS public.demand_specialty CASCADE;
DROP TYPE IF EXISTS public.demand_status CASCADE;
DROP TYPE IF EXISTS public.financial_type CASCADE;
DROP TYPE IF EXISTS public.payment_status CASCADE;
DROP TYPE IF EXISTS public.contract_status CASCADE;