Initialising login role...
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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          categoria: string | null
          client_id: string | null
          criada_em: string
          data_hora: string
          duracao_min: number
          id: string
          nome_cliente: string
          observacoes: string | null
          os_id: string | null
          servico_previsto: string | null
          status: string
          telefone: string | null
          vehicle_id: string | null
          workshop_id: string
        }
        Insert: {
          categoria?: string | null
          client_id?: string | null
          criada_em?: string
          data_hora: string
          duracao_min?: number
          id?: string
          nome_cliente: string
          observacoes?: string | null
          os_id?: string | null
          servico_previsto?: string | null
          status?: string
          telefone?: string | null
          vehicle_id?: string | null
          workshop_id: string
        }
        Update: {
          categoria?: string | null
          client_id?: string | null
          criada_em?: string
          data_hora?: string
          duracao_min?: number
          id?: string
          nome_cliente?: string
          observacoes?: string | null
          os_id?: string | null
          servico_previsto?: string | null
          status?: string
          telefone?: string | null
          vehicle_id?: string | null
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          criada_em: string
          data_aniversario: string | null
          email: string | null
          id: string
          nome: string
          telefone: string
          workshop_id: string
        }
        Insert: {
          criada_em?: string
          data_aniversario?: string | null
          email?: string | null
          id?: string
          nome: string
          telefone: string
          workshop_id: string
        }
        Update: {
          criada_em?: string
          data_aniversario?: string | null
          email?: string | null
          id?: string
          nome?: string
          telefone?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      dismissed_alerts: {
        Row: {
          client_id: string
          dispensado_em: string
          id: string
          workshop_id: string
        }
        Insert: {
          client_id: string
          dispensado_em?: string
          id?: string
          workshop_id: string
        }
        Update: {
          client_id?: string
          dispensado_em?: string
          id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dismissed_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dismissed_alerts_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_inventory: {
        Row: {
          atualizada_em: string
          codigo: string | null
          criada_em: string
          custo_unitario: number
          estoque_minimo: number
          id: string
          nome: string
          observacao: string | null
          preco_venda: number
          quantidade: number
          unidade: string
          workshop_id: string
        }
        Insert: {
          atualizada_em?: string
          codigo?: string | null
          criada_em?: string
          custo_unitario?: number
          estoque_minimo?: number
          id?: string
          nome: string
          observacao?: string | null
          preco_venda?: number
          quantidade?: number
          unidade?: string
          workshop_id: string
        }
        Update: {
          atualizada_em?: string
          codigo?: string | null
          criada_em?: string
          custo_unitario?: number
          estoque_minimo?: number
          id?: string
          nome?: string
          observacao?: string | null
          preco_venda?: number
          quantidade?: number
          unidade?: string
          workshop_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          criada_em: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"] | null
          id: string
          observacao: string | null
          recebido_em: string
          service_order_id: string
          valor: number
          workshop_id: string
        }
        Insert: {
          criada_em?: string
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          observacao?: string | null
          recebido_em?: string
          service_order_id: string
          valor?: number
          workshop_id: string
        }
        Update: {
          criada_em?: string
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          observacao?: string | null
          recebido_em?: string
          service_order_id?: string
          valor?: number
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_payments_service_order"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_payments_workshop"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          atualizada_em: string
          avatar_url: string | null
          criada_em: string
          id: string
          nome: string | null
          workshop_id: string | null
        }
        Insert: {
          atualizada_em?: string
          avatar_url?: string | null
          criada_em?: string
          id: string
          nome?: string | null
          workshop_id?: string | null
        }
        Update: {
          atualizada_em?: string
          avatar_url?: string | null
          criada_em?: string
          id?: string
          nome?: string | null
          workshop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_parts: {
        Row: {
          custo_unitario: number
          id: string
          inventory_id: string | null
          nome: string
          ordem: number
          quantidade: number
          service_order_id: string
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          custo_unitario?: number
          id?: string
          inventory_id?: string | null
          nome: string
          ordem?: number
          quantidade?: number
          service_order_id: string
          valor_total?: number
          valor_unitario?: number
        }
        Update: {
          custo_unitario?: number
          id?: string
          inventory_id?: string | null
          nome?: string
          ordem?: number
          quantidade?: number
          service_order_id?: string
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_order_parts_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_services: {
        Row: {
          descricao: string
          id: string
          ordem: number
          service_order_id: string
          valor: number
        }
        Insert: {
          descricao: string
          id?: string
          ordem?: number
          service_order_id: string
          valor?: number
        }
        Update: {
          descricao?: string
          id?: string
          ordem?: number
          service_order_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_order_services_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          atualizada_em: string
          categoria: string | null
          client_id: string
          criada_em: string
          data_entrada: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"] | null
          id: string
          km_entrada: number | null
          nota_satisfacao: number | null
          numero: number
          observacoes: string | null
          previsao_entrega: string | null
          status: Database["public"]["Enums"]["os_status"]
          total_geral: number
          total_pecas: number
          total_servicos: number
          vehicle_id: string
          vencimento_fiado: string | null
          workshop_id: string
        }
        Insert: {
          atualizada_em?: string
          categoria?: string | null
          client_id: string
          criada_em?: string
          data_entrada?: string
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          km_entrada?: number | null
          nota_satisfacao?: number | null
          numero: number
          observacoes?: string | null
          previsao_entrega?: string | null
          status?: Database["public"]["Enums"]["os_status"]
          total_geral?: number
          total_pecas?: number
          total_servicos?: number
          vehicle_id: string
          vencimento_fiado?: string | null
          workshop_id: string
        }
        Update: {
          atualizada_em?: string
          categoria?: string | null
          client_id?: string
          criada_em?: string
          data_entrada?: string
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          km_entrada?: number | null
          nota_satisfacao?: number | null
          numero?: number
          observacoes?: string | null
          previsao_entrega?: string | null
          status?: Database["public"]["Enums"]["os_status"]
          total_geral?: number
          total_pecas?: number
          total_servicos?: number
          vehicle_id?: string
          vencimento_fiado?: string | null
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      services_catalog: {
        Row: {
          ativo: boolean
          categoria: string
          criada_em: string
          descricao: string | null
          duracao_estimada_min: number | null
          id: string
          nome: string
          preco_padrao: number | null
          workshop_id: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string
          criada_em?: string
          descricao?: string | null
          duracao_estimada_min?: number | null
          id?: string
          nome: string
          preco_padrao?: number | null
          workshop_id: string
        }
        Update: {
          ativo?: boolean
          categoria?: string
          criada_em?: string
          descricao?: string | null
          duracao_estimada_min?: number | null
          id?: string
          nome?: string
          preco_padrao?: number | null
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_catalog_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          criada_em: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          workshop_id: string
        }
        Insert: {
          criada_em?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          workshop_id: string
        }
        Update: {
          criada_em?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          ano: number | null
          client_id: string
          cor: string | null
          criada_em: string
          data_ultima_revisao: string | null
          id: string
          intervalo_revisao_meses: number
          km: number | null
          km_proxima_revisao: number | null
          marca: string | null
          modelo: string | null
          placa: string
          workshop_id: string
        }
        Insert: {
          ano?: number | null
          client_id: string
          cor?: string | null
          criada_em?: string
          data_ultima_revisao?: string | null
          id?: string
          intervalo_revisao_meses?: number
          km?: number | null
          km_proxima_revisao?: number | null
          marca?: string | null
          modelo?: string | null
          placa: string
          workshop_id: string
        }
        Update: {
          ano?: number | null
          client_id?: string
          cor?: string | null
          criada_em?: string
          data_ultima_revisao?: string | null
          id?: string
          intervalo_revisao_meses?: number
          km?: number | null
          km_proxima_revisao?: number | null
          marca?: string | null
          modelo?: string | null
          placa?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_invites: {
        Row: {
          criada_em: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          token: string
          used_at: string | null
          workshop_id: string
        }
        Insert: {
          criada_em?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          used_at?: string | null
          workshop_id: string
        }
        Update: {
          criada_em?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          used_at?: string | null
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_invites_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshops: {
        Row: {
          created_by: string | null
          criada_em: string
          endereco: string | null
          id: string
          logo_url: string | null
          mensagem_atualizacao: string | null
          mensagem_orcamento: string | null
          mensagem_retorno: string | null
          nome: string
          plano: Database["public"]["Enums"]["plano"]
          proxima_os_numero: number
          telefone: string | null
        }
        Insert: {
          created_by?: string | null
          criada_em?: string
          endereco?: string | null
          id?: string
          logo_url?: string | null
          mensagem_atualizacao?: string | null
          mensagem_orcamento?: string | null
          mensagem_retorno?: string | null
          nome: string
          plano?: Database["public"]["Enums"]["plano"]
          proxima_os_numero?: number
          telefone?: string | null
        }
        Update: {
          created_by?: string | null
          criada_em?: string
          endereco?: string | null
          id?: string
          logo_url?: string | null
          mensagem_atualizacao?: string | null
          mensagem_orcamento?: string | null
          mensagem_retorno?: string | null
          nome?: string
          plano?: Database["public"]["Enums"]["plano"]
          proxima_os_numero?: number
          telefone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_workshop_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
          _workshop_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "dono" | "mecanico"
      forma_pagamento:
        | "pix"
        | "dinheiro"
        | "cartao"
        | "parcelado"
        | "a_combinar"
      os_status:
        | "aguardando_aprovacao"
        | "em_andamento"
        | "aguardando_peca"
        | "concluido"
        | "entregue"
        | "cancelado"
      plano: "gratuito" | "solo" | "oficina"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["dono", "mecanico"],
      forma_pagamento: ["pix", "dinheiro", "cartao", "parcelado", "a_combinar"],
      os_status: [
        "aguardando_aprovacao",
        "em_andamento",
        "aguardando_peca",
        "concluido",
        "entregue",
        "cancelado",
      ],
      plano: ["gratuito", "solo", "oficina"],
    },
  },
} as const
<claude-code-hint v="1" type="plugin" value="supabase@claude-plugins-official" />
