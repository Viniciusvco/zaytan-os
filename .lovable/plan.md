

# Zaytan OS v7.0 — Refatoração Estratégica

## Resumo

Transformar o sistema em uma plataforma com foco em onboarding, priorização por performance, workspaces dinâmicos por especialidade e uma academia de treinamento. Todas as mudanças são frontend-only com dados mock.

---

## Arquitetura de Mudanças

### Arquivos Novos
- `src/pages/Academy.tsx` — Trilha de treinamento + Base de Conhecimento (SOPs)
- `src/components/NotificationBell.tsx` — Sino de notificações no header
- `src/pages/Feedbacks.tsx` — Formulários de feedback semanal/mensal (visão cliente)

### Arquivos Modificados
- `src/contexts/RoleContext.tsx` — Adicionar campo `onboardingComplete` e `trainingComplete` por colaborador
- `src/components/AppLayout.tsx` — Adicionar NotificationBell no header + dropdown "Simular Visão" para admin
- `src/components/AppSidebar.tsx` — Sidebar dinâmica por subtipo de colaborador; adicionar Academy
- `src/pages/Dashboard.tsx` — 3 refatorações:
  - **Cliente**: Onboarding fixo no topo até concluído + card "Próximos Passos" + gráficos de tendência
  - **Admin**: Dashboard Mestre consolidado (tabs: Visão Geral / Financeiro / Clientes / Contratos) com KPIs (MRR, LTV, Churn, Onboarding)
  - **Colaborador**: Workspace dinâmico por especialidade (Gestor→Ranking Performance, Designer→Tarefas SLA, CS→Alertas Feedback)
- `src/pages/Onboarding.tsx` — Sem mudanças grandes, já funciona bem
- `src/pages/Performance.tsx` — Transformar em Ranking de Performance Crítica (tabela ordenada por status de saúde, com coluna "Diagnóstico & Plano de Ação" editável)
- `src/pages/Produtos.tsx` — Adicionar campos `minPrice` e `maxPrice`; validação de range no comercial
- `src/pages/Demandas.tsx` — Cores por especialidade (Tráfego=Azul, Design=Roxo, CS=Verde); auto-filtro por subtipo de colaborador
- `src/pages/Comercial.tsx` — Bloquear valores abaixo do mínimo do produto; exceção com flag admin

---

## Detalhamento por Bloco

### 1. Visão do Cliente (Client Portal)
- **Dashboard.tsx (ClientDashboard)**: Verificar `onboardingComplete` — se falso, renderizar componente Onboarding inline como seção fixa no topo. Adicionar card "Próximos Passos / Status da Estratégia" com texto editável pelo admin. Gráfico de tendência comparando semana atual vs anterior.
- **Feedbacks.tsx**: Formulário com campos: Qualidade do Atendimento (1-5 estrelas), Entrega dos Funcionários (1-5), Satisfação Geral (1-5), Comentário. Separar em tabs Semanal/Mensal. Histórico de feedbacks enviados.
- **NotificationBell.tsx**: Ícone de sino no header com badge de contagem. Dropdown com lista de notificações mock (feedback pendente, reunião próxima, etc). Triggers automáticos para feedback semanal/mensal baseados em data.

### 2. Dashboard Admin Mestre
- Consolidar Dashboard + Financeiro + Clientes + Contratos em uma única visão com tabs internas:
  - **Visão Geral**: KPIs (MRR Total, LTV Médio, Churn Rate, Projetos em Onboarding) + gráfico de receita
  - **Financeiro**: Conteúdo atual do Financeiro.tsx embutido
  - **Clientes**: Tabela resumida de clientes com status
  - **Contratos**: Tabela resumida de contratos com alertas de vencimento
- Manter as páginas individuais (Financeiro, Clientes, Contratos) acessíveis pela sidebar, mas o Dashboard será o hub unificado.
- **Gestão de Onboarding**: Seção dentro da tab Clientes mostrando apenas clientes em onboarding, clicável para modal com briefing + status de acessos.

### 3. Motor de Performance (Ranking)
- Refatorar `Performance.tsx` para exibir uma tabela/ranking ordenada automaticamente por severidade (clientes críticos no topo).
- Colunas: Nome, CPL, CTR, Budget Gasto (%), Status (badge colorido), Diagnóstico & Plano de Ação (campo de texto editável inline).
- Manter o motor de regras (`evaluateRules`) existente como base.

### 4. Catálogo de Produtos — Preço Range
- Adicionar `minPrice` e `maxPrice` à interface `Product`.
- UI: dois campos lado a lado no modal de edição.
- Regra: no módulo Comercial, vendedor seleciona valor dentro do range. Se abaixo do mínimo, botão desabilitado + mensagem "Requer aprovação Admin".

### 5. Workspaces Dinâmicos por Colaborador
- **Sidebar**: Filtrar itens baseado em `colaboradorType`:
  - Gestor: Dashboard (Ranking Performance) + Demandas (filtro: Tráfego, Pixel/API) + Academy (Contingência, Escala)
  - Designer: Dashboard (Tarefas por SLA) + Demandas (filtro: Design, LP, Vídeo) + Academy (Criativos)
  - CS/Atendimento: Dashboard (Alertas Feedback + Onboarding Status) + Demandas (visão completa) + Academy (Processo atendimento)
- **Demandas.tsx**: Cores de borda por tag (Tráfego=Azul `border-blue-500`, Design=Roxo `border-purple-500`, CS=Verde `border-green-500`). Auto-filtrar cards por especialidade do colaborador logado.
- **Simulador de Perfil (Admin)**: Dropdown no header ao lado do role switcher atual, permitindo "Simular Visão" como qualquer subtipo.

### 6. Academy (Onboarding de Colaboradores)
- **Academy.tsx** com duas seções:
  - **Trilha de Boas-Vindas**: Cards de vídeo/conteúdo obrigatórios (marcar como concluído). Trilhas por cargo com conteúdo mock. Barra de progresso.
  - **Base de Conhecimento (SOPs)**: Lista de documentos com título, categoria, link. Check de "lido" por usuário.
- **Trava de Operação**: Se `trainingComplete === false`, a sidebar mostra apenas Academy. Outras páginas redirecionam para Academy com mensagem "Complete o treinamento obrigatório".

### 7. Feedbacks → Alertas no CS
- Feedbacks com nota baixa (≤2) geram automaticamente um alerta no Kanban de Demandas com tag "Reclamação" e prioridade "Crítico".

---

## Ordem de Implementação

1. `RoleContext.tsx` — Adicionar campos de onboarding/training state
2. `NotificationBell.tsx` + `AppLayout.tsx` — Header com sino e simulador
3. `AppSidebar.tsx` — Sidebar dinâmica por subtipo
4. `Dashboard.tsx` — Refatorar as 3 visões (Admin mestre, Cliente com onboarding, Colaborador dinâmico)
5. `Performance.tsx` — Ranking de priorização
6. `Produtos.tsx` — Preço min/max
7. `Demandas.tsx` — Cores por especialidade + auto-filtro
8. `Feedbacks.tsx` — Formulários recorrentes
9. `Academy.tsx` — Trilhas + SOPs + trava de operação

---

## Notas Técnicas

- Nenhum backend necessário — tudo com `useState` e dados mock
- Reutilizar componentes shadcn/ui existentes (Dialog, Tabs, Progress, Badge)
- O role switcher existente no header já suporta admin/colaborador/cliente — será expandido com o dropdown de subtipo
- Páginas individuais (Financeiro, Clientes, Contratos) continuam existindo na sidebar para acesso direto, mas o Dashboard Admin as consolida

