

## Plano: Menu "Mais opções" na coluna "Novo Lead" do Kanban

### O que será feito
Adicionar um ícone de três pontos (`MoreHorizontal`) no cabeçalho da coluna "Novo Lead" do Kanban. Ao clicar, exibe um dropdown com a opção "Inserir lead manualmente", que abre o diálogo existente de criação de lead. O formulário será expandido para incluir todos os campos da tabela `leads` (financing_type, installment_value, lead_entry_date, seller_tag, notes). O cliente será pré-selecionado automaticamente quando um filtro de cliente estiver ativo.

### Detalhes técnicos

**Arquivo: `src/pages/CRM.tsx`**

1. **Importações**: Adicionar `MoreHorizontal` de `lucide-react` e `DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger` de `@/components/ui/dropdown-menu`.

2. **Estado `newLead`** (linha ~30): Expandir o objeto para incluir os campos adicionais: `financing_type`, `installment_value`, `lead_entry_date`, `seller_tag`, `notes`.

3. **Cabeçalho da coluna Kanban** (linhas ~357-360): Para a coluna `"novo"`, adicionar um `DropdownMenu` com ícone `MoreHorizontal` ao lado do badge de contagem. O item do menu chama `setShowAdd(true)` e, se `clientFilter !== "all"`, pré-seleciona `newLead.client_id` com o valor do filtro ativo.

4. **Formulário "Adicionar Lead"** (linhas ~538-551): Adicionar campos para:
   - `financing_type` (select: opções da tabela externa como "financiamento", "consórcio", etc.)
   - `installment_value` (input texto)
   - `lead_entry_date` (input date)
   - `seller_tag` (input texto)
   - `notes` (textarea)

5. **Mutação `createLeadMut`** (linha ~146-148): Expandir o insert para enviar os novos campos (`financing_type`, `installment_value`, `lead_entry_date`, `seller_tag`, `notes`).

6. **Reset do estado** (linha ~150): Limpar todos os campos novos no `onSuccess`.

### Sem alterações de backend
A tabela `leads` já possui todos os campos necessários. Nenhuma migração ou edge function precisa ser alterada.

