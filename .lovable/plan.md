## Plano: RBAC por Cliente + CRM Jurídico + Performance + Contratos

### Contexto
Vendedor/Supervisor/Gerente são hierarquias **dentro de cada cliente** (empresa), separadas dos roles da agência (admin/colaborador/cliente).

### 1. Banco de Dados (Migrações)

**Enum `client_role_type`**: vendedor | supervisor | gerente

**Tabela `client_user_roles`** — Hierarquia dentro de cada cliente:
- `client_id`, `user_id` (profile), `client_role` (vendedor/supervisor/gerente)
- RLS: Admin full, usuários veem seus próprios roles

**Enum `juridico_status`**: analise_documentacao | protocolo_administrativo | ajuizado | concluido

**Tabela `juridico_cards`** — Cards do CRM Jurídico:
- `lead_id`, `client_id`, `status` (juridico_status)
- `laudo_url`, `contrato_url`, `notes`, `assigned_to`
- RLS: Admin full, clientes veem os seus

**Tabela `payment_tracking`** — Controle de pagamentos:
- `lead_id`, `client_id`, `seller_name`, `valor_parcela`, `due_date`, `paid` (bool), `paid_date`
- RLS: Admin full, clientes veem os seus

### 2. Automação: Comercial → Jurídico
Ao mover lead para `fechado` no CRM:
- Criar `juridico_card` automaticamente com laudo e dados
- Criar `payment_tracking` com valor da venda

### 3. Novas Páginas

**`/crm-juridico`** — Kanban: Análise de Documentação → Protocolo Administrativo → Ajuizado → Concluído

**`/performance`** — Dashboard com gráficos de vendas por vendedor, taxa de conversão, visão por role

**Contratos/Pagamentos** — Tabela com status de pagamento, switch para "Liquidado", destaque vermelho para inadimplentes

### 4. RBAC na UI
- Vendedor: seus leads, seus contratos, suas métricas
- Supervisor: dados da equipe, comparativos
- Gerente/Admin: tudo + exportação

### Sem alterações nos roles da agência
Os roles admin/colaborador/cliente da agência permanecem inalterados.
