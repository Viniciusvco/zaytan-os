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
      client_user_roles: {
        Row: {
          client_id: string
          client_role: Database["public"]["Enums"]["client_role_type"]
          created_at: string
          id: string
          supervisor_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          client_role?: Database["public"]["Enums"]["client_role_type"]
          created_at?: string
          id?: string
          supervisor_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          client_role?: Database["public"]["Enums"]["client_role_type"]
          created_at?: string
          id?: string
          supervisor_id?: string | null
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
            foreignKeyName: "client_user_roles_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          colaborador_type:
            | Database["public"]["Enums"]["colaborador_subtype"]
            | null
          contract_start_date: string | null
          created_at: string
          csv_import_enabled: boolean
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
          csv_import_enabled?: boolean
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
          csv_import_enabled?: boolean
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
    },
  },
} as const
