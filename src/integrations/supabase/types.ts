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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          dose_id: string | null
          elder_id: string | null
          family_id: string
          id: string
          kind: string
          message: string
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          created_at?: string
          dose_id?: string | null
          elder_id?: string | null
          family_id: string
          id?: string
          kind?: string
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          created_at?: string
          dose_id?: string | null
          elder_id?: string | null
          family_id?: string
          id?: string
          kind?: string
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_dose_id_fkey"
            columns: ["dose_id"]
            isOneToOne: false
            referencedRelation: "doses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_elder_id_fkey"
            columns: ["elder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          created_by: string | null
          day_before_sent_at: string | null
          elder_id: string
          family_id: string
          hours_before_sent_at: string | null
          id: string
          location: string | null
          notes: string | null
          scheduled_at: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          day_before_sent_at?: string | null
          elder_id: string
          family_id: string
          hours_before_sent_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          scheduled_at: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          day_before_sent_at?: string | null
          elder_id?: string
          family_id?: string
          hours_before_sent_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          scheduled_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_elder_id_fkey"
            columns: ["elder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_questions: {
        Row: {
          answer: string | null
          created_at: string
          elder_id: string
          family_id: string
          id: string
          question: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          elder_id: string
          family_id: string
          id?: string
          question: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          elder_id?: string
          family_id?: string
          id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_questions_elder_id_fkey"
            columns: ["elder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_questions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          family_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          family_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          family_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      doses: {
        Row: {
          created_at: string
          dose: string
          due_reminder_sent_at: string | null
          elder_id: string
          family_id: string
          id: string
          medicine_id: string
          medicine_name: string
          missed_alert_sent_at: string | null
          pre_reminder_sent_at: string | null
          scheduled_at: string
          second_reminder_sent_at: string | null
          status: Database["public"]["Enums"]["dose_status"]
          taken_at: string | null
        }
        Insert: {
          created_at?: string
          dose: string
          due_reminder_sent_at?: string | null
          elder_id: string
          family_id: string
          id?: string
          medicine_id: string
          medicine_name: string
          missed_alert_sent_at?: string | null
          pre_reminder_sent_at?: string | null
          scheduled_at: string
          second_reminder_sent_at?: string | null
          status?: Database["public"]["Enums"]["dose_status"]
          taken_at?: string | null
        }
        Update: {
          created_at?: string
          dose?: string
          due_reminder_sent_at?: string | null
          elder_id?: string
          family_id?: string
          id?: string
          medicine_id?: string
          medicine_name?: string
          missed_alert_sent_at?: string | null
          pre_reminder_sent_at?: string | null
          scheduled_at?: string
          second_reminder_sent_at?: string | null
          status?: Database["public"]["Enums"]["dose_status"]
          taken_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doses_elder_id_fkey"
            columns: ["elder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doses_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doses_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          email_dry_run: boolean
          email_enabled: boolean
          id: string
          is_sample: boolean
          missed_after_minutes: number
          name: string
          pre_reminder_minutes: number
          second_reminder_minutes: number
          timezone: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          email_dry_run?: boolean
          email_enabled?: boolean
          id?: string
          is_sample?: boolean
          missed_after_minutes?: number
          name: string
          pre_reminder_minutes?: number
          second_reminder_minutes?: number
          timezone?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          email_dry_run?: boolean
          email_enabled?: boolean
          id?: string
          is_sample?: boolean
          missed_after_minutes?: number
          name?: string
          pre_reminder_minutes?: number
          second_reminder_minutes?: number
          timezone?: string
        }
        Relationships: []
      }
      medicines: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          days: number[]
          dose: string
          elder_id: string
          end_date: string | null
          family_id: string
          id: string
          name: string
          notes: string | null
          start_date: string
          times: string[]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          days?: number[]
          dose: string
          elder_id: string
          end_date?: string | null
          family_id: string
          id?: string
          name: string
          notes?: string | null
          start_date?: string
          times: string[]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          days?: number[]
          dose?: string
          elder_id?: string
          end_date?: string | null
          family_id?: string
          id?: string
          name?: string
          notes?: string | null
          start_date?: string
          times?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicines_elder_id_fkey"
            columns: ["elder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicines_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          created_at: string
          dedupe_key: string
          error: string | null
          family_id: string
          id: string
          kind: string
          recipient: string
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          dedupe_key: string
          error?: string | null
          family_id: string
          id?: string
          kind: string
          recipient: string
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          dedupe_key?: string
          error?: string | null
          family_id?: string
          id?: string
          kind?: string
          recipient?: string
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          family_id: string | null
          full_name: string
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          family_id?: string | null
          full_name?: string
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          family_id?: string | null
          full_name?: string
          id?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          locked_until: string | null
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          locked_until?: string | null
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          locked_until?: string | null
          window_start?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          elder_id: string | null
          family_id: string
          file_name: string
          file_path: string
          flags: Json
          id: string
          mime: string
          size_bytes: number
          status: string
          summarized_at: string | null
          summary: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          elder_id?: string | null
          family_id: string
          file_name: string
          file_path: string
          flags?: Json
          id?: string
          mime: string
          size_bytes: number
          status?: string
          summarized_at?: string | null
          summary?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          elder_id?: string | null
          family_id?: string
          file_name?: string
          file_path?: string
          flags?: Json
          id?: string
          mime?: string
          size_bytes?: number
          status?: string
          summarized_at?: string | null
          summary?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_elder_id_fkey"
            columns: ["elder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      current_family_id: { Args: never; Returns: string }
      generate_all_doses: { Args: never; Returns: undefined }
      generate_doses_for_medicine: {
        Args: { _med: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_caretaker_of: { Args: { _family: string }; Returns: boolean }
      is_caretaker_of_folder: { Args: { _folder: string }; Returns: boolean }
      is_family_member: { Args: { _family: string }; Returns: boolean }
      mark_dose_taken: { Args: { _dose: string }; Returns: string }
      rate_limit_clear: { Args: { _key: string }; Returns: undefined }
      rate_limit_hit: {
        Args: {
          _key: string
          _lock_seconds: number
          _max: number
          _window_seconds: number
        }
        Returns: boolean
      }
      rate_limit_is_locked: { Args: { _key: string }; Returns: boolean }
    }
    Enums: {
      app_role: "caretaker" | "elder"
      dose_status: "upcoming" | "taken" | "missed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["caretaker", "elder"],
      dose_status: ["upcoming", "taken", "missed"],
    },
  },
} as const
