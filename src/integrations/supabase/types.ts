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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      carbon_forecasts: {
        Row: {
          carbon_intensity_g: number
          created_at: string
          id: string
          region_id: string
          timestamp: string
        }
        Insert: {
          carbon_intensity_g: number
          created_at?: string
          id?: string
          region_id: string
          timestamp: string
        }
        Update: {
          carbon_intensity_g?: number
          created_at?: string
          id?: string
          region_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "carbon_forecasts_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      carbon_logs: {
        Row: {
          co2_kg: number
          id: string
          model_id: string | null
          region_id: string | null
          timestamp: string
          user_id: string
        }
        Insert: {
          co2_kg: number
          id?: string
          model_id?: string | null
          region_id?: string | null
          timestamp?: string
          user_id: string
        }
        Update: {
          co2_kg?: number
          id?: string
          model_id?: string | null
          region_id?: string | null
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carbon_logs_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carbon_logs_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_hash: string
          created_at: string
          id: string
          is_verified: boolean | null
          model_id: string
          model_name: string
          renewable_percentage: number
          total_co2_kg: number
          training_date: string
          user_id: string
        }
        Insert: {
          certificate_hash: string
          created_at?: string
          id?: string
          is_verified?: boolean | null
          model_id: string
          model_name: string
          renewable_percentage: number
          total_co2_kg: number
          training_date: string
          user_id: string
        }
        Update: {
          certificate_hash?: string
          created_at?: string
          id?: string
          is_verified?: boolean | null
          model_id?: string
          model_name?: string
          renewable_percentage?: number
          total_co2_kg?: number
          training_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_logs: {
        Row: {
          energy_kwh: number
          id: string
          model_id: string
          timestamp: string
        }
        Insert: {
          energy_kwh: number
          id?: string
          model_id: string
          timestamp?: string
        }
        Update: {
          energy_kwh?: number
          id?: string
          model_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "energy_logs_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_sources: {
        Row: {
          created_at: string
          id: string
          is_renewable: boolean | null
          percentage: number
          source_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_renewable?: boolean | null
          percentage: number
          source_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_renewable?: boolean | null
          percentage?: number
          source_name?: string
          user_id?: string
        }
        Relationships: []
      }
      models: {
        Row: {
          co2_emissions: number
          created_at: string
          efficiency_score: number | null
          energy_kwh: number
          gpu_count: number
          gpu_hours: number
          id: string
          last_deployed_at: string | null
          name: string
          next_maintenance_at: string | null
          region_id: string
          status: Database["public"]["Enums"]["model_status"]
          user_id: string
          version: string | null
        }
        Insert: {
          co2_emissions?: number
          created_at?: string
          efficiency_score?: number | null
          energy_kwh?: number
          gpu_count?: number
          gpu_hours?: number
          id?: string
          last_deployed_at?: string | null
          name: string
          next_maintenance_at?: string | null
          region_id: string
          status?: Database["public"]["Enums"]["model_status"]
          user_id: string
          version?: string | null
        }
        Update: {
          co2_emissions?: number
          created_at?: string
          efficiency_score?: number | null
          energy_kwh?: number
          gpu_count?: number
          gpu_hours?: number
          id?: string
          last_deployed_at?: string | null
          name?: string
          next_maintenance_at?: string | null
          region_id?: string
          status?: Database["public"]["Enums"]["model_status"]
          user_id?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "models_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          job_title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          carbon_factor: number
          code: string
          created_at: string
          id: string
          name: string
          renewable_percentage: number
        }
        Insert: {
          carbon_factor?: number
          code: string
          created_at?: string
          id?: string
          name: string
          renewable_percentage?: number
        }
        Update: {
          carbon_factor?: number
          code?: string
          created_at?: string
          id?: string
          name?: string
          renewable_percentage?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      model_status: "active" | "idle" | "training"
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
      model_status: ["active", "idle", "training"],
    },
  },
} as const
