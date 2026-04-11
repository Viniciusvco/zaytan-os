---
name: Motor Revisional (Lead Distribution Engine)
description: Automated lead distribution system with campaigns, proportional allocation (accumulated balance method), daily limits, stock, deduplication, and audit logging
type: feature
---
## Core Rules
- Leads distributed 1-to-1 using Largest Remainder (accumulated balance) method
- Daily limits per client; excess goes to Stock
- Stock per client, expires after N days (default 7), alert 24h before expiry
- Deduplication by phone/email before distribution
- Paused clients: leads go to their own stock, not redistributed
- Weight % auto-calculated from investment; admin can override manually (must sum to 100%)
- Client entry/exit: recalc proportions for future leads only, reset balances
- Atomicity: Pendente → Em Processamento → Distribuído; auto-retry after 5min stuck
- Full audit log per distribution event

## Tables
- campaigns, campaign_clients, lead_queue, distribution_logs
- Enums: lead_queue_status, distribution_rule

## Edge Function
- distribute-leads: actions = ingest, distribute, send_stock, expire_stock, metrics
