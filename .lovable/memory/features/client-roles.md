---
name: Client role hierarchy system
description: Gerente/Supervisor/Vendedor hierarchy within each client, with visibility rules
type: feature
---
- `client_user_roles` table has `supervisor_id` to link vendedores to supervisors
- `vendor_goals` table tracks monthly sales targets per vendedor per client
- `ClientRoleContext` provides hierarchy-aware visibility:
  - Gerente: sees all team members
  - Supervisor: sees only their vendedores
  - Vendedor: sees their supervisor's team
- Client sidebar includes: Dashboard (ranking), CRM, Performance, Contratos, Gestão de Acessos
- Routes: `/client-performance`, `/client-users`
