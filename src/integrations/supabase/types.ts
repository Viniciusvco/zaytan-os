export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      campaign_clients: {
        Row: {
          accumulated_balance: number
          campaign_id: string
          client_id: string
          created_at: string
          daily_limit: number | null
          id: string
          investment_amount: number
          last_reset_date: string | null
          leads_received_today: number
          paused: boolean
          updated_at: string
          weight_override: boolean
          weight_percent: number
        }
        Insert: {
          accumulated_balance?: number
          campaign_id: string
          client_id: string
          created_at?: string
          daily_limit?: number | null
          id?: string
          investment_amount?: number
          last_reset_date?: string | null
          leads_received_today?: number
          paused?: boolean
          updated_at?: string
          weight_override?: boolean
          weight_percent?: number
        }
        Update: {
          accumulated_balance?: number
          campaign_id?: string
          client_id?: string
          created_at?: string
          daily_limit?: number | null
          id?: string
          investment_amount?: number
          last_reset_date?: string | null
          leads_received_today?: number
          paused?: boolean
          updated_at?: string
          weight_override?: boolean
          weight_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_clients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          active: boolean
          created_at: string
          id: string
          min_lead_goal: number | null
          name: string
          stock_expiry_days: number
          total_investment: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          min_lead_goal?: number | null
          name: string
          stock_expiry_days?: number
          total_investment?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          min_lead_goal?: number | null
          name?: string
          stock_expiry_days?: number
          total_investment?: number
          updated_at?: string
        }
        Relationships: []
      }
      client_user_roles: {
        Row: {
          client_id: string
          client_role: Database["public"]["Enums"]["client_role_type"]
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          client_role?: Database["public"]["Enums"]["client_role_type"]
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          client_role?: Database["public"]["Enums"]["client_role_type"]
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_user_roles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_visibility_config: {
        Row: {
          client_id: string
          created_at: string
          hidden_views: string[]
          id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          hidden_views?: string[]
          id?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          hidden_views?: string[]
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_visibility_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          active: boolean
          assigned_to: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          onboarding_complete: boolean
          phone: string | null
          primary_color: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          onboarding_complete?: boolean
          phone?: string | null
          primary_color?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          onboarding_complete?: boolean
          phone?: string | null
          primary_color?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          client_id: string
          created_at: string
          end_date: string | null
          id: string
          mrr_value: number | null
          notes: string | null
          setup_value: number | null
          start_date: string
          status: Database["public"]["Enums"]["contract_status"]
          title: string
          updated_at: string
          weekly_investment: number | null
        }
        Insert: {
          client_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          mrr_value?: number | null
          notes?: string | null
          setup_value?: number | null
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"]
          title: string
          updated_at?: string
          weekly_investment?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          mrr_value?: number | null
          notes?: string | null
          setup_value?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"]
          title?: string
          updated_at?: string
          weekly_investment?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      demands: {
        Row: {
          assigned_to: string | null
          client_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["demand_priority"]
          specialty: Database["public"]["Enums"]["demand_specialty"] | null
          status: Database["public"]["Enums"]["demand_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["demand_priority"]
          specialty?: Database["public"]["Enums"]["demand_specialty"] | null
          status?: Database["public"]["Enums"]["demand_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["demand_priority"]
          specialty?: Database["public"]["Enums"]["demand_specialty"] | null
          status?: Database["public"]["Enums"]["demand_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demands_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demands_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      distribution_logs: {
        Row: {
          accumulated_balance_at: number
          campaign_id: string
          client_id: string
          created_at: string
          id: string
          lead_queue_id: string
          performed_by: string | null
          rule_applied: Database["public"]["Enums"]["distribution_rule"]
          status_after: Database["public"]["Enums"]["lead_queue_status"]
          status_before: Database["public"]["Enums"]["lead_queue_status"]
          weight_at_distribution: number
        }
        Insert: {
          accumulated_balance_at?: number
          campaign_id: string
          client_id: string
          created_at?: string
          id?: string
          lead_queue_id: string
          performed_by?: string | null
          rule_applied: Database["public"]["Enums"]["distribution_rule"]
          status_after: Database["public"]["Enums"]["lead_queue_status"]
          status_before: Database["public"]["Enums"]["lead_queue_status"]
          weight_at_distribution?: number
        }
        Update: {
          accumulated_balance_at?: number
          campaign_id?: string
          client_id?: string
          created_at?: string
          id?: string
          lead_queue_id?: string
          performed_by?: string | null
          rule_applied?: Database["public"]["Enums"]["distribution_rule"]
          status_after?: Database["public"]["Enums"]["lead_queue_status"]
          status_before?: Database["public"]["Enums"]["lead_queue_status"]
          weight_at_distribution?: number
        }
        Relationships: [
          {
            foreignKeyName: "distribution_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribution_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribution_logs_lead_queue_id_fkey"
            columns: ["lead_queue_id"]
            isOneToOne: false
            referencedRelation: "lead_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_records: {
        Row: {
          amount: number
          category: string | null
          client_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          due_day: number | null
          id: string
          mrr_start_date: string | null
          paid_date: string | null
          status: Database["public"]["Enums"]["payment_status"]
          type: Database["public"]["Enums"]["financial_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_day?: number | null
          id?: string
          mrr_start_date?: string | null
          paid_date?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          type: Database["public"]["Enums"]["financial_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_day?: number | null
          id?: string
          mrr_start_date?: string | null
          paid_date?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          type?: Database["public"]["Enums"]["financial_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      juridico_cards: {
        Row: {
          assigned_to: string | null
          client_id: string
          contrato_url: string | null
          created_at: string
          id: string
          laudo_url: string | null
          lead_id: string
          notes: string | null
          status: Database["public"]["Enums"]["juridico_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id: string
          contrato_url?: string | null
          created_at?: string
          id?: string
          laudo_url?: string | null
          lead_id: string
          notes?: string | null
          status?: Database["public"]["Enums"]["juridico_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string
          contrato_url?: string | null
          created_at?: string
          id?: string
          laudo_url?: string | null
          lead_id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["juridico_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "juridico_cards_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "juridico_cards_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "juridico_cards_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_distribution_config: {
        Row: {
          active: boolean
          client_id: string
          created_at: string
          id: string
          investment_amount: number
          period_end: string | null
          period_start: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          client_id: string
          created_at?: string
          id?: string
          investment_amount?: number
          period_end?: string | null
          period_start?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          client_id?: string
          created_at?: string
          id?: string
          investment_amount?: number
          period_end?: string | null
          period_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_distribution_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_queue: {
        Row: {
          assigned_client_id: string | null
          campaign_id: string
          created_at: string
          distributed_at: string | null
          distribution_rule:
            | Database["public"]["Enums"]["distribution_rule"]
            | null
          email: string | null
          expires_at: string | null
          id: string
          name: string
          phone: string | null
          raw_data: Json | null
          source: string | null
          status: Database["public"]["Enums"]["lead_queue_status"]
          stock_client_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_client_id?: string | null
          campaign_id: string
          created_at?: string
          distributed_at?: string | null
          distribution_rule?:
            | Database["public"]["Enums"]["distribution_rule"]
            | null
          email?: string | null
          expires_at?: string | null
          id?: string
          name: string
          phone?: string | null
          raw_data?: Json | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_queue_status"]
          stock_client_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_client_id?: string | null
          campaign_id?: string
          created_at?: string
          distributed_at?: string | null
          distribution_rule?:
            | Database["public"]["Enums"]["distribution_rule"]
            | null
          email?: string | null
          expires_at?: string | null
          id?: string
          name?: string
          phone?: string | null
          raw_data?: Json | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_queue_status"]
          stock_client_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_queue_assigned_client_id_fkey"
            columns: ["assigned_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_queue_stock_client_id_fkey"
            columns: ["stock_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          client_id: string
          created_at: string
          email: string | null
          financing_type: string | null
          id: string
          installment_value: string | null
          laudo_data: Json | null
          laudo_pdf_url: string | null
          lead_entry_date: string | null
          loss_reason: Database["public"]["Enums"]["loss_reason_type"] | null
          name: string
          notes: string | null
          phone: string | null
          seller_tag: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          value: number | null
        }
        Insert: {
          client_id: string
          created_at?: string
          email?: string | null
          financing_type?: string | null
          id?: string
          installment_value?: string | null
          laudo_data?: Json | null
          laudo_pdf_url?: string | null
          lead_entry_date?: string | null
          loss_reason?: Database["public"]["Enums"]["loss_reason_type"] | null
          name: string
          notes?: string | null
          phone?: string | null
          seller_tag?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          value?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string | null
          financing_type?: string | null
          id?: string
          installment_value?: string | null
          laudo_data?: Json | null
          laudo_pdf_url?: string | null
          lead_entry_date?: string | null
          loss_reason?: Database["public"]["Enums"]["loss_reason_type"] | null
          name?: string
          notes?: string | null
          phone?: string | null
          seller_tag?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_tracking: {
        Row: {
          client_id: string
          created_at: string
          due_date: string | null
          id: string
          lead_id: string
          paid: boolean
          paid_date: string | null
          seller_name: string | null
          updated_at: string
          valor_parcela: number
        }
        Insert: {
          client_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          lead_id: string
          paid?: boolean
          paid_date?: string | null
          seller_name?: string | null
          updated_at?: string
          valor_parcela?: number
        }
        Update: {
          client_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          lead_id?: string
          paid?: boolean
          paid_date?: string | null
          seller_name?: string | null
          updated_at?: string
          valor_parcela?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_tracking_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_tracking_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          description: string | null
          id: string
          max_price: number | null
          min_price: number | null
          name: string
          recurrence: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          max_price?: number | null
          min_price?: number | null
          name: string
          recurrence?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          max_price?: number | null
          min_price?: number | null
          name?: string
          recurrence?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          colaborador_type:
            | Database["public"]["Enums"]["colaborador_subtype"]
            | null
          contract_start_date: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          colaborador_type?:
            | Database["public"]["Enums"]["colaborador_subtype"]
            | null
          contract_start_date?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          colaborador_type?:
            | Database["public"]["Enums"]["colaborador_subtype"]
            | null
          contract_start_date?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_client_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      nextval_proposal: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "colaborador" | "cliente"
      client_role_type: "vendedor" | "supervisor" | "gerente"
      colaborador_subtype: "gestor" | "designer" | "cs"
      contract_status: "rascunho" | "ativo" | "cancelado" | "aguardando"
      demand_priority: "baixa" | "media" | "alta" | "critica"
      demand_specialty: "trafego" | "design" | "cs"
      demand_status: "backlog" | "em_progresso" | "revisao" | "concluido"
      distribution_rule:
        | "proporcional"
        | "estoque"
        | "redistribuicao"
        | "manual"
      financial_type: "receita" | "despesa"
      juridico_status:
        | "analise_documentacao"
        | "protocolo_administrativo"
        | "ajuizado"
        | "concluido"
      lead_queue_status:
        | "pendente"
        | "em_processamento"
        | "distribuido"
        | "duplicado"
        | "expirado"
        | "estoque"
      lead_status:
        | "novo"
        | "contatado"
        | "qualificado"
        | "proposta"
        | "fechado"
        | "perdido"
      loss_reason_type:
        | "nao_atende"
        | "sem_interesse"
        | "concorrente"
        | "dados_incorretos"
        | "sem_perfil"
        | "outros"
      payment_status: "pendente" | "pago" | "atrasado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "colaborador", "cliente"],
      client_role_type: ["vendedor", "supervisor", "gerente"],
      colaborador_subtype: ["gestor", "designer", "cs"],
      contract_status: ["rascunho", "ativo", "cancelado", "aguardando"],
      demand_priority: ["baixa", "media", "alta", "critica"],
      demand_specialty: ["trafego", "design", "cs"],
      demand_status: ["backlog", "em_progresso", "revisao", "concluido"],
      distribution_rule: [
        "proporcional",
        "estoque",
        "redistribuicao",
        "manual",
      ],
      financial_type: ["receita", "despesa"],
      juridico_status: [
        "analise_documentacao",
        "protocolo_administrativo",
        "ajuizado",
        "concluido",
      ],
      lead_queue_status: [
        "pendente",
        "em_processamento",
        "distribuido",
        "duplicado",
        "expirado",
        "estoque",
      ],
      lead_status: [
        "novo",
        "contatado",
        "qualificado",
        "proposta",
        "fechado",
        "perdido",
      ],
      loss_reason_type: [
        "nao_atende",
        "sem_interesse",
        "concorrente",
        "dados_incorretos",
        "sem_perfil",
        "outros",
      ],
      payment_status: ["pendente", "pago", "atrasado"],
    },
  },
} as const
