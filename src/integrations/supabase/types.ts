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
      clinical_records: {
        Row: {
          anesthesia: string | null
          created_at: string
          created_by: string | null
          diagnosis: string | null
          doctor_id: string
          doctor_note: string | null
          id: string
          medicines_used: string | null
          next_visit_datetime: string | null
          procedures_done: string | null
          tooth_map: Json | null
          updated_at: string
          updated_by: string | null
          visit_order_id: string
        }
        Insert: {
          anesthesia?: string | null
          created_at?: string
          created_by?: string | null
          diagnosis?: string | null
          doctor_id: string
          doctor_note?: string | null
          id?: string
          medicines_used?: string | null
          next_visit_datetime?: string | null
          procedures_done?: string | null
          tooth_map?: Json | null
          updated_at?: string
          updated_by?: string | null
          visit_order_id: string
        }
        Update: {
          anesthesia?: string | null
          created_at?: string
          created_by?: string | null
          diagnosis?: string | null
          doctor_id?: string
          doctor_note?: string | null
          id?: string
          medicines_used?: string | null
          next_visit_datetime?: string | null
          procedures_done?: string | null
          tooth_map?: Json | null
          updated_at?: string
          updated_by?: string | null
          visit_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_records_visit_order_id_fkey"
            columns: ["visit_order_id"]
            isOneToOne: true
            referencedRelation: "visit_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          birth_date: string | null
          created_at: string
          created_by: string | null
          full_name: string
          gender: string | null
          id: string
          is_deleted: boolean
          jshshir: string | null
          notes: string | null
          phone: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          created_by?: string | null
          full_name: string
          gender?: string | null
          id?: string
          is_deleted?: boolean
          jshshir?: string | null
          notes?: string | null
          phone: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          created_by?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          is_deleted?: boolean
          jshshir?: string | null
          notes?: string | null
          phone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          actor_user_id: string
          created_at: string
          id: string
          new_debt_amount: number | null
          new_paid_amount: number | null
          new_status: string | null
          note: string | null
          old_debt_amount: number | null
          old_paid_amount: number | null
          old_status: string | null
          patient_id: string
          visit_order_id: string
        }
        Insert: {
          actor_user_id: string
          created_at?: string
          id?: string
          new_debt_amount?: number | null
          new_paid_amount?: number | null
          new_status?: string | null
          note?: string | null
          old_debt_amount?: number | null
          old_paid_amount?: number | null
          old_status?: string | null
          patient_id: string
          visit_order_id: string
        }
        Update: {
          actor_user_id?: string
          created_at?: string
          id?: string
          new_debt_amount?: number | null
          new_paid_amount?: number | null
          new_status?: string | null
          note?: string | null
          old_debt_amount?: number | null
          old_paid_amount?: number | null
          old_status?: string | null
          patient_id?: string
          visit_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_events_visit_order_id_fkey"
            columns: ["visit_order_id"]
            isOneToOne: false
            referencedRelation: "visit_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_protocols: {
        Row: {
          created_at: string
          doctor_id: string
          file_url: string
          id: string
          storage_path: string | null
          type: string
          visit_order_id: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          file_url: string
          id?: string
          storage_path?: string | null
          type: string
          visit_order_id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          file_url?: string
          id?: string
          storage_path?: string | null
          type?: string
          visit_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_protocols_visit_order_id_fkey"
            columns: ["visit_order_id"]
            isOneToOne: false
            referencedRelation: "visit_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          channel: string
          created_at: string
          id: string
          message: string
          patient_id: string
          remind_at: string
          sent_at: string | null
          status: string
          visit_order_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          message: string
          patient_id: string
          remind_at: string
          sent_at?: string | null
          status?: string
          visit_order_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          message?: string
          patient_id?: string
          remind_at?: string
          sent_at?: string | null
          status?: string
          visit_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_visit_order_id_fkey"
            columns: ["visit_order_id"]
            isOneToOne: false
            referencedRelation: "visit_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          base_price: number
          created_at: string
          duration_minutes: number | null
          id: string
          is_active: boolean
          name_uz: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          name_uz: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          name_uz?: string
          updated_at?: string
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
      visit_orders: {
        Row: {
          assigned_doctor_id: string
          complaint: string | null
          created_at: string
          created_by: string | null
          debt_amount: number
          id: string
          paid_amount: number
          patient_id: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          payment_updated_at: string | null
          payment_updated_by: string | null
          price: number
          reception_note: string | null
          selected_service_id: string | null
          status: Database["public"]["Enums"]["visit_status"]
          updated_at: string
          updated_by: string | null
          visit_datetime: string
        }
        Insert: {
          assigned_doctor_id: string
          complaint?: string | null
          created_at?: string
          created_by?: string | null
          debt_amount?: number
          id?: string
          paid_amount?: number
          patient_id: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_updated_at?: string | null
          payment_updated_by?: string | null
          price?: number
          reception_note?: string | null
          selected_service_id?: string | null
          status?: Database["public"]["Enums"]["visit_status"]
          updated_at?: string
          updated_by?: string | null
          visit_datetime: string
        }
        Update: {
          assigned_doctor_id?: string
          complaint?: string | null
          created_at?: string
          created_by?: string | null
          debt_amount?: number
          id?: string
          paid_amount?: number
          patient_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_updated_at?: string | null
          payment_updated_by?: string | null
          price?: number
          reception_note?: string | null
          selected_service_id?: string | null
          status?: Database["public"]["Enums"]["visit_status"]
          updated_at?: string
          updated_by?: string | null
          visit_datetime?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_orders_selected_service_id_fkey"
            columns: ["selected_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_services: {
        Row: {
          created_at: string
          id: string
          price: number
          quantity: number
          service_id: string
          visit_order_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          price?: number
          quantity?: number
          service_id: string
          visit_order_id: string
        }
        Update: {
          created_at?: string
          id?: string
          price?: number
          quantity?: number
          service_id?: string
          visit_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_services_visit_order_id_fkey"
            columns: ["visit_order_id"]
            isOneToOne: false
            referencedRelation: "visit_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_status: string
          old_status: string | null
          visit_order_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status: string
          old_status?: string | null
          visit_order_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status?: string
          old_status?: string | null
          visit_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_status_history_visit_order_id_fkey"
            columns: ["visit_order_id"]
            isOneToOne: false
            referencedRelation: "visit_orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      doctor_directory: {
        Row: {
          full_name: string | null
          id: string | null
          is_active: boolean | null
        }
        Insert: {
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
        }
        Update: {
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "reception" | "doctor"
      payment_method: "cash" | "card" | "transfer"
      payment_status: "UNPAID" | "PAID" | "PARTIAL" | "DEBT"
      visit_status:
        | "NEW"
        | "SENT_TO_DOCTOR"
        | "IN_PROGRESS"
        | "DONE"
        | "CANCELLED"
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
      app_role: ["admin", "reception", "doctor"],
      payment_method: ["cash", "card", "transfer"],
      payment_status: ["UNPAID", "PAID", "PARTIAL", "DEBT"],
      visit_status: [
        "NEW",
        "SENT_TO_DOCTOR",
        "IN_PROGRESS",
        "DONE",
        "CANCELLED",
      ],
    },
  },
} as const
