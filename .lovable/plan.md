
# Zaytan OS — Migração para Produção

## Fase 1: Banco de Dados (Migração SQL)

### Tabelas a criar:

**profiles** — Perfis de usuário
- user_id (ref auth.users), full_name, phone, avatar_url, role (admin/colaborador/cliente), colaborador_type (gestor/designer/cs), active

**clients** — Clientes da agência
- name, email, phone, company, logo_url, primary_color, onboarding_complete, active, assigned_to (ref profiles)

**contracts** — Contratos
- client_id (ref clients), title, start_date, end_date, setup_value, mrr_value, status (rascunho/ativo/cancelado/aguardando), weekly_investment (usado na distribuição de leads)

**products** — Catálogo de produtos
- name, description, category, min_price, max_price, recurrence, active

**leads** — Leads do CRM
- client_id (ref clients), name, email, phone, source, status (novo/contatado/qualificado/proposta/fechado/perdido), value, loss_reason, notes, created_at

**lead_distribution_config** — Config de distribuição
- client_id (ref clients), investment_amount, period_start, period_end, active

**financial_records** — Lançamentos financeiros
- client_id, type (receita/despesa), category, description, amount, due_date, paid_date, status (pendente/pago/atrasado)

**demands** — Demandas/Kanban
- client_id, assigned_to (ref profiles), title, description, status (backlog/em_progresso/revisao/concluido), priority, specialty (trafego/design/cs), due_date

**user_roles** — Roles separadas (segurança)
- user_id (ref auth.users), role (admin/moderator/user)

### RLS Policies:
- Admin: acesso total
- Colaborador: acesso apenas a demandas/leads dos clientes atribuídos
- Cliente: acesso apenas aos próprios leads, contratos e financeiro

---

## Fase 2: Autenticação

- Tela de Login (email + senha)
- Admin cria usuários (não tem signup público)
- Após login, redireciona baseado no role do perfil
- Página de gestão de usuários no Admin (já existe, conectar ao Supabase)

---

## Fase 3: Páginas Funcionais (remover mocks)

### Admin:
- **Financeiro**: CRUD real de lançamentos financeiros
- **Produtos**: CRUD real de produtos
- **Contratos**: CRUD real + campo de investimento semanal para distribuição
- **CRM (Admin)**: Pipeline geral de todos os leads
- **Performance**: Métricas reais dos leads por cliente
- **Usuários**: Criar/editar/desativar usuários

### Cliente:
- **Dashboard**: Métricas reais (leads recebidos, taxa conversão)
- **CRM**: Leads distribuídos automaticamente, movimentação real
- **Demandas**: Kanban real

---

## Fase 4: Distribuição de Leads

- Lógica: `leads_do_cliente = (investimento_cliente / total_investimentos) × total_leads`
- Config na aba Contratos (investimento semanal por cliente)
- Webhook endpoint (Edge Function) para receber leads do Meta Ads
- Edge Function distribui leads proporcionalmente e insere na tabela `leads`

---

## Fase 5: Integração Meta Ads (Webhook)

- Edge Function `receive-leads` que recebe webhook do Meta
- Distribui leads entre clientes conforme investimento
- Insere no Supabase em tempo real
- Admin configura webhook URL no Meta Ads

---

## Ordem de Implementação

1. Migração SQL (todas as tabelas + RLS)
2. Autenticação + Login + Profiles
3. Conectar páginas Admin ao Supabase (Financeiro, Produtos, Contratos, Usuários)
4. Conectar CRM + Dashboard do Cliente ao Supabase
5. Edge Function de distribuição de leads
6. Manter "Em breve" em: Academy, Feedbacks, Minha Equipe, Suporte, Onboarding, todas as telas do Colaborador

---

## Notas
- Páginas "Em breve" mantêm mockups + alerta amarelo
- Disable signup público (admin cria contas)
- Auto-confirm email habilitado (admin cria, já vem confirmado)
