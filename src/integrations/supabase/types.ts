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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      feedback: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          id: string
          title: string
          company: string
          description: string
          requirements: string | null
          location: string
          job_type: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance'
          category: string
          tags: string[] | null
          salary_min: number | null
          salary_max: number | null
          salary_currency: string
          salary_period: 'yearly' | 'monthly' | 'hourly' | 'project'
          remote_type: 'fully-remote' | 'hybrid' | 'on-site' | 'timezone-specific' | null
          company_size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | null
          apply_url: string
          company_url: string | null
          company_logo_url: string | null
          source: string
          source_id: string | null
          published_at: string
          expires_at: string | null
          created_at: string
          updated_at: string
          is_featured: boolean
          is_active: boolean
        }
        Insert: {
          id?: string
          title: string
          company: string
          description: string
          requirements?: string | null
          location?: string
          job_type?: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance'
          category: string
          tags?: string[] | null
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string
          salary_period?: 'yearly' | 'monthly' | 'hourly' | 'project'
          remote_type?: 'fully-remote' | 'hybrid' | 'on-site' | 'timezone-specific' | null
          company_size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | null
          apply_url: string
          company_url?: string | null
          company_logo_url?: string | null
          source: string
          source_id?: string | null
          published_at: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
          is_featured?: boolean
          is_active?: boolean
        }
        Update: {
          id?: string
          title?: string
          company?: string
          description?: string
          requirements?: string | null
          location?: string
          job_type?: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance'
          category?: string
          tags?: string[] | null
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string
          salary_period?: 'yearly' | 'monthly' | 'hourly' | 'project'
          remote_type?: 'fully-remote' | 'hybrid' | 'on-site' | 'timezone-specific' | null
          company_size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | null
          apply_url?: string
          company_url?: string | null
          company_logo_url?: string | null
          source?: string
          source_id?: string | null
          published_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
          is_featured?: boolean
          is_active?: boolean
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          destination: string
          email: string | null
          id: string
          message: string | null
          name: string
          phone: string
          pickup: string
        }
        Insert: {
          created_at?: string
          destination: string
          email?: string | null
          id?: string
          message?: string | null
          name: string
          phone: string
          pickup: string
        }
        Update: {
          created_at?: string
          destination?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string
          pickup?: string
        }
        Relationships: []
      }
      saved_jobs: {
        Row: {
          id: string
          user_id: string
          job_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          categories: string[]
          job_types: string[]
          remote_types: string[]
          company_sizes: string[]
          salary_min: number | null
          salary_max: number | null
          keywords: string[]
          email_alerts_enabled: boolean
          alert_frequency: 'daily' | 'weekly' | 'instant'
          last_alert_sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          categories?: string[]
          job_types?: string[]
          remote_types?: string[]
          company_sizes?: string[]
          salary_min?: number | null
          salary_max?: number | null
          keywords?: string[]
          email_alerts_enabled?: boolean
          alert_frequency?: 'daily' | 'weekly' | 'instant'
          last_alert_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          categories?: string[]
          job_types?: string[]
          remote_types?: string[]
          company_sizes?: string[]
          salary_min?: number | null
          salary_max?: number | null
          keywords?: string[]
          email_alerts_enabled?: boolean
          alert_frequency?: 'daily' | 'weekly' | 'instant'
          last_alert_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      email_alerts_log: {
        Row: {
          id: string
          user_id: string
          jobs_sent: number
          sent_at: string
          status: 'sent' | 'failed' | 'bounced'
        }
        Insert: {
          id?: string
          user_id: string
          jobs_sent?: number
          sent_at?: string
          status?: 'sent' | 'failed' | 'bounced'
        }
        Update: {
          id?: string
          user_id?: string
          jobs_sent?: number
          sent_at?: string
          status?: 'sent' | 'failed' | 'bounced'
        }
        Relationships: [
          {
            foreignKeyName: "email_alerts_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
